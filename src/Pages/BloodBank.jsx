import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";
import EmptyState from "../Components/EmptyState";

// Admin Blood Banks — browse, edit, delete, add, bulk-import via CSV,
// export filtered set to CSV. Filters mirror the client locator:
// Country → State → District → City → Search.

const EDITABLE_FIELDS = [
  { key: "name",     label: "Name",     type: "text",     required: true },
  { key: "country",  label: "Country",  type: "text" },
  { key: "state",    label: "State",    type: "text" },
  { key: "district", label: "District", type: "text" },
  { key: "city",     label: "City",     type: "text" },
  { key: "pincode",  label: "Pincode",  type: "text" },
  { key: "address",  label: "Address",  type: "textarea" },
  { key: "phone",    label: "Phone",    type: "text" },
  { key: "mobile",   label: "Mobile",   type: "text" },
  { key: "email",    label: "Email",    type: "email" },
  { key: "website",  label: "Website",  type: "text" },
  { key: "type",     label: "Type",     type: "text",
    hint: "Govt. / Pvt / Trust / Charitable/Vol / Red Cross" },
  { key: "category", label: "Category", type: "text",
    hint: "Blood Bank / Blood Storage Centre / Blood Component Unit" },
  { key: "hours",    label: "Hours",    type: "text" },
];

// Tiny CSV parser — header row + simple comma split. For pathological CSVs
// (commas in values) use the JSON import path via Postman instead.
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((h, i) => {
      if (h) row[h] = cells[i] ?? "";
    });
    return row;
  });
};

const BloodBank = () => {
  const { setLoading } = useContext(GlobalContext);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  // Cascading filter state — same shape as client BloodBankServices page.
  const [countryFilter, setCountryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [search, setSearch] = useState("");

  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const API = `${import.meta.env.VITE_API_URL}/bloodbanks`;
  // The dropdowns hit the OPEN /user endpoint (no auth) so they work the
  // same way the client locator does.
  const PUBLIC_API = `${import.meta.env.VITE_API_URL.replace("/admin", "/user")}/bloodbanks`;
  const auth = sessionStorage.getItem("auth");

  // Countries — once on mount. Defaults to India when present so the admin
  // doesn't have to click before seeing rows.
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${PUBLIC_API}/countries`);
        const list = res.data?.data?.countries || [];
        setCountryOptions(list);
        if (list.includes("India")) setCountryFilter("India");
        else if (list.length === 1) setCountryFilter(list[0]);
      } catch (err) {
        console.error("countries load failed:", err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // States cascade on Country change.
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${PUBLIC_API}/states`, {
          params: countryFilter ? { country: countryFilter } : {},
        });
        setStateOptions(res.data?.data?.states || []);
      } catch (err) {
        console.error("states load failed:", err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryFilter]);

  // Districts cascade on State change.
  useEffect(() => {
    if (!stateFilter) {
      setDistrictOptions([]);
      setDistrictFilter("");
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${PUBLIC_API}/districts`, {
          params: {
            state: stateFilter,
            ...(countryFilter ? { country: countryFilter } : {}),
          },
        });
        setDistrictOptions(res.data?.data?.districts || []);
      } catch (err) {
        console.error("districts load failed:", err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilter, countryFilter]);

  // Cities cascade on District change (or State only when district unset).
  useEffect(() => {
    if (!stateFilter) {
      setCityOptions([]);
      setCityFilter("");
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${PUBLIC_API}/cities`, {
          params: {
            state: stateFilter,
            ...(districtFilter ? { district: districtFilter } : {}),
            ...(countryFilter ? { country: countryFilter } : {}),
          },
        });
        setCityOptions(res.data?.data?.cities || []);
      } catch (err) {
        console.error("cities load failed:", err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilter, districtFilter, countryFilter]);

  const load = async () => {
    try {
      setLoading(true);
      const params = { n: pageSize, p: page };
      if (countryFilter) params.country = countryFilter;
      if (stateFilter) params.state = stateFilter;
      if (districtFilter) params.district = districtFilter;
      if (cityFilter) params.city = cityFilter;
      if (search.trim()) params.q = search.trim();
      const res = await axios.get(API, {
        params,
        headers: { Authorization: auth },
      });
      const d = res.data?.data || {};
      setItems(d.items || []);
      setTotal(d.total || 0);
    } catch (err) {
      console.error(err);
      swal("Error", err?.response?.data?.error || "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, countryFilter, stateFilter, districtFilter, cityFilter]);

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openEdit = (row) => {
    setAdding(false);
    setEditing(row);
    const f = {};
    for (const { key } of EDITABLE_FIELDS) f[key] = row[key] || "";
    setEditForm(f);
  };

  const openAdd = () => {
    setEditing(null);
    setAdding(true);
    const f = { country: "India" };
    for (const { key } of EDITABLE_FIELDS) {
      if (!(key in f)) f[key] = "";
    }
    setEditForm(f);
  };

  const closeModal = () => {
    setEditing(null);
    setAdding(false);
  };

  const saveEdit = async () => {
    if (!editForm.name?.trim()) {
      swal("Name required", "Name cannot be empty", "warning");
      return;
    }
    try {
      setSaving(true);
      if (adding) {
        await axios.post(API, editForm, { headers: { Authorization: auth } });
        swal("Added", "Blood bank added to the directory", "success");
      } else {
        await axios.patch(`${API}/${editing._id}`, editForm, {
          headers: { Authorization: auth },
        });
        swal("Saved", "Blood bank updated", "success");
      }
      closeModal();
      load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (row) => {
    const ok = await swal({
      title: `Delete "${row.name}"?`,
      text: "This cannot be undone.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      await axios.delete(`${API}/${row._id}`, { headers: { Authorization: auth } });
      load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Delete failed", "error");
    }
  };

  const onCsvFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setImporting(true);
      const text = await file.text();
      const rows = parseCSV(text);
      if (!rows.length) {
        swal("Empty CSV", "No rows found. Make sure the first row is headers.", "warning");
        return;
      }
      const res = await axios.post(
        `${API}/import`,
        { rows },
        { headers: { Authorization: auth, "Content-Type": "application/json" } }
      );
      const s = res.data?.data || {};
      swal(
        "Import complete",
        `Received: ${s.received} · Inserted: ${s.inserted} · Updated: ${s.updated} · Skipped: ${s.skipped}`,
        "success"
      );
      load();
    } catch (err) {
      swal("Import failed", err?.response?.data?.error || err.message, "error");
    } finally {
      setImporting(false);
    }
  };

  const exportCSV = async () => {
    try {
      setExporting(true);
      const COLUMNS = [
        "name", "country", "state", "district", "city", "pincode",
        "address", "phone", "mobile", "email", "website", "type", "category",
        "licenseNumber", "hours",
      ];

      const baseParams = {};
      if (countryFilter) baseParams.country = countryFilter;
      if (stateFilter) baseParams.state = stateFilter;
      if (districtFilter) baseParams.district = districtFilter;
      if (cityFilter) baseParams.city = cityFilter;
      if (search.trim()) baseParams.q = search.trim();

      const PAGE = 1000;
      const all = [];
      const first = await axios.get(API, {
        params: { ...baseParams, n: PAGE, p: 0 },
        headers: { Authorization: auth },
      });
      const totalRows = first.data?.data?.total || 0;
      all.push(...(first.data?.data?.items || []));
      const pages = Math.ceil(totalRows / PAGE);
      for (let p = 1; p < pages; p++) {
        const res = await axios.get(API, {
          params: { ...baseParams, n: PAGE, p },
          headers: { Authorization: auth },
        });
        all.push(...(res.data?.data?.items || []));
      }

      const esc = (val) => {
        if (val == null) return "";
        const s = String(val).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      };
      const lines = [COLUMNS.join(",")];
      for (const row of all) {
        lines.push(COLUMNS.map((c) => esc(row[c])).join(","));
      }
      const blob = new Blob(["﻿" + lines.join("\n")], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `blood-banks-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      swal("Export failed", err?.response?.data?.error || err.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <>
      <SEO title="Blood Banks" />
      <div className="content-wrapper pt-5">
        <div className="lsa-page-head d-flex justify-content-between align-items-center mb-3 flex-wrap" style={{ gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, margin: 0 }}>Blood Banks</h1>
            <div className="text-muted small">
              {total.toLocaleString()} record{total === 1 ? "" : "s"} matching current filters
            </div>
          </div>
          <div className="d-flex flex-wrap" style={{ gap: 8 }}>
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <i className="ti ti-plus"></i> Add Blood Bank
            </button>
            <label className="btn btn-outline-primary mb-0" style={{ cursor: "pointer" }}>
              <i className="ti ti-file-import"></i>{" "}
              {importing ? "Importing…" : "Import CSV"}
              <input
                type="file"
                accept=".csv,text/csv"
                style={{ display: "none" }}
                onChange={onCsvFile}
                disabled={importing}
              />
            </label>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={exportCSV}
              disabled={exporting || total === 0}
              title={total === 0 ? "Nothing to export" : `Export ${total} rows`}
            >
              <i className="ti ti-file-export"></i>{" "}
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>

        {/* Filters — Country / State / District / City / Search */}
        <div className="card mb-3">
          <div className="card-body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14,
              }}
            >
              <div>
                <label className="form-label">Country</label>
                <select
                  className="form-control"
                  value={countryFilter}
                  onChange={(e) => {
                    setCountryFilter(e.target.value);
                    setStateFilter("");
                    setDistrictFilter("");
                    setCityFilter("");
                    setPage(0);
                  }}
                >
                  <option value="">All countries</option>
                  {countryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">State</label>
                <select
                  className="form-control"
                  value={stateFilter}
                  onChange={(e) => {
                    setStateFilter(e.target.value);
                    setDistrictFilter("");
                    setCityFilter("");
                    setPage(0);
                  }}
                >
                  <option value="">All states</option>
                  {stateOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">District</label>
                <select
                  className="form-control"
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setCityFilter("");
                    setPage(0);
                  }}
                  disabled={!stateFilter}
                >
                  <option value="">All districts</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">City</label>
                <select
                  className="form-control"
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    setPage(0);
                  }}
                  disabled={!stateFilter}
                >
                  <option value="">All cities</option>
                  {cityOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Name, address, city…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card mb-3">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th style={{ width: 110, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <EmptyState
                      colSpan={5}
                      icon="ti ti-building-hospital"
                      title="No blood banks found for the current filters."
                    />
                  ) : (
                    items.map((b) => (
                      <tr key={b._id}>
                        <td>
                          <div className="fw-bold">{b.name}</div>
                          {b.address && (
                            <div className="text-muted small" style={{ maxWidth: 360 }}>
                              {b.address}
                            </div>
                          )}
                        </td>
                        <td>
                          <div>{[b.city, b.district].filter(Boolean).join(", ")}</div>
                          <div className="text-muted small">
                            {b.state}{b.country && b.country !== "India" ? `, ${b.country}` : ""}
                          </div>
                        </td>
                        <td>
                          {b.phone && (
                            <a href={`tel:${b.phone}`} style={{ textDecoration: "none" }}>
                              {b.phone}
                            </a>
                          )}
                          {b.email && (
                            <div className="text-muted small">{b.email}</div>
                          )}
                        </td>
                        <td>
                          {b.type && <div>{b.type}</div>}
                          <div className="text-muted small">{b.category}</div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => openEdit(b)}
                            title="Edit"
                          >
                            <i className="ti ti-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteRow(b)}
                            title="Delete"
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination footer — always visible. Shows the count even when
            the filtered set fits in a single page. */}
        {total > 0 && (
          <div
            className="d-flex justify-content-between align-items-center flex-wrap mb-5"
            style={{ gap: 10 }}
          >
            <span className="text-muted small">
              Showing{" "}
              <strong>
                {(page * pageSize + 1).toLocaleString()}-
                {Math.min((page + 1) * pageSize, total).toLocaleString()}
              </strong>{" "}
              of <strong>{total.toLocaleString()}</strong> record
              {total === 1 ? "" : "s"}
            </span>
            <div className="d-flex align-items-center" style={{ gap: 10 }}>
             <button
  type="button"
  className="btn btn-sm"
  style={{
    backgroundColor: "#d4453a",
    borderColor: "#d4453a",
    color: "#fff",
  }}
  onClick={() => setPage((p) => Math.max(p - 1, 0))}
  disabled={page === 0}
>
  <i className="ti ti-chevron-left"></i> Prev
</button>
              <span className="text-muted small">
                Page {page + 1} of {totalPages}
              </span>
             <button
  type="button"
  className="btn btn-sm"
  style={{
    backgroundColor: "#d4453a",
    borderColor: "#d4453a",
    color: "#fff",
  }}
  onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
  disabled={page + 1 >= totalPages}
>
  Next <i className="ti ti-chevron-right"></i>
</button>
            </div>
          </div>
        )}

        {/* Create / Edit modal — inline styles to escape admin-theme.css
            .content-wrapper .card-body { padding: 0 !important } override. */}
        {(editing || adding) && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1050,
              padding: 16,
            }}
            onClick={closeModal}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                maxWidth: 760,
                width: "100%",
                maxHeight: "90vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderBottom: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  flexShrink: 0,
                }}
              >
                <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {adding ? "Add Blood Bank" : "Edit Blood Bank"}
                </h5>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    background: "transparent",
                    border: "1px solid #E5E7EB",
                    borderRadius: 6,
                    width: 30,
                    height: 30,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  {EDITABLE_FIELDS.map((f) => (
                    <div
                      key={f.key}
                      style={{
                        gridColumn: f.type === "textarea" ? "1 / -1" : "auto",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        {f.label}
                        {f.required && (
                          <span style={{ color: "#C0392B" }}> *</span>
                        )}
                      </label>
                      {f.type === "textarea" ? (
                        <textarea
                          rows={2}
                          value={editForm[f.key] ?? ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, [f.key]: e.target.value })
                          }
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            fontSize: 14,
                            border: "1px solid #D1D5DB",
                            borderRadius: 6,
                            fontFamily: "inherit",
                            outline: "none",
                            resize: "vertical",
                          }}
                        />
                      ) : (
                        <input
                          type={f.type}
                          value={editForm[f.key] ?? ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, [f.key]: e.target.value })
                          }
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            fontSize: 14,
                            border: "1px solid #D1D5DB",
                            borderRadius: 6,
                            outline: "none",
                          }}
                        />
                      )}
                      {f.hint && (
                        <small style={{ color: "#9CA3AF", fontSize: 11 }}>
                          {f.hint}
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  padding: "14px 20px",
                  borderTop: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "#FFFFFF",
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: "#374151",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveEdit}
                  style={{
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "#C0392B",
                    border: "1px solid #C0392B",
                    borderRadius: 6,
                    cursor: saving ? "not-allowed" : "pointer",
                    color: "#FFFFFF",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving…" : adding ? "Add Bank" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BloodBank;
