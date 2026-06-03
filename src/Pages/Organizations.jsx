import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";
import { DEMO_MODE, resetOrganizationsDemoData } from "./organizationsDemo";

const emptyForm = {
  _id: null,
  name: "",
  description: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  website: "",
  password: "",
  active: true,
};

const authHeaders = () => ({
  Authorization: sessionStorage.getItem("auth"),
  "Content-Type": "application/json",
});

const verificationStatus = (o) => {
  if (o.verified) return { label: "Verified", color: "#16A34A", icon: "ti-circle-check" };
  if (o.verificationRejected) return { label: "Rejected", color: "#DC2626", icon: "ti-circle-x" };
  return { label: "Pending", color: "#F59E0B", icon: "ti-clock" };
};

// Verification tabs that double as the list filter (NGO Partners style).
// `countKey` maps to the computed `stats` object below.
const STATUS_TABS = [
  { key: "all",      label: "All Organisations", color: "#0EA5E9", countKey: "total"    },
  { key: "pending",  label: "Pending",           color: "#F59E0B", countKey: "pending"  },
  { key: "verified", label: "Verified",          color: "#16A34A", countKey: "verified" },
  { key: "rejected", label: "Rejected",          color: "#DC2626", countKey: "rejected" },
];

const StatCard = ({ label, value, accent, icon }) => (
  <div className="col-md-3 col-sm-6">
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div className="card-body d-flex align-items-center gap-3" style={{ padding: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: `${accent}15`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          <i className={`ti ${icon}`}></i>
        </div>
        <div>
          <div className="text-muted small" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
            {label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
        </div>
      </div>
    </div>
  </div>
);

const Organizations = () => {
  const { setLoading } = useContext(GlobalContext);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState("all");
  const [searchText, setSearchText] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchText) params.set("searchText", searchText);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/organizations?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setItems(res?.data?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return items.filter((o) => {
      if (status === "verified") return !!o.verified;
      if (status === "rejected") return !!o.verificationRejected;
      if (status === "pending") return !o.verified && !o.verificationRejected;
      return true; // "all"
    });
  }, [items, status]);

  const stats = useMemo(() => {
    const total = items.length;
    const verified = items.filter((o) => o.verified).length;
    const rejected = items.filter((o) => o.verificationRejected).length;
    const pending = items.filter((o) => !o.verified && !o.verificationRejected).length;
    return { total, verified, rejected, pending };
  }, [items]);

  const openCreate = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (o) => {
    setForm({
      _id: o._id,
      name: o.name || "",
      description: o.description || "",
      contactName: o.contactName || "",
      contactEmail: o.contactEmail || "",
      contactPhone: o.contactPhone || "",
      address: o.address || "",
      website: o.website || "",
      password: "", // never prefilled — leave blank to keep the existing one
      active: !!o.active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return swal("Error", "Name is required", "error");
    const payload = {
      name: form.name.trim(),
      // Org accounts created here log into the organisation portal, which
      // only recognises the "Company" type — so we fix the type rather than
      // exposing a picker.
      type: "Company",
      description: form.description.trim(),
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      address: form.address.trim(),
      website: form.website.trim(),
      active: !!form.active,
    };
    // Password is optional on edit (blank = keep existing); send only when set.
    if (form.password && form.password.trim()) {
      payload.password = form.password.trim();
    }
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/organizations/${form._id}`, payload, {
          headers: authHeaders(),
        });
        swal("Success", "Organization updated", "success");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/organizations`, payload, {
          headers: authHeaders(),
        });
        swal("Success", "Organization added", "success");
      }
      closeModal();
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save organization", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await swal({
      title: "Delete organization?",
      text: "This cannot be undone.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/organizations/${id}`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      swal("Deleted", "Organization removed", "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  const quickVerify = async (o) => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/organizations/${o._id}`,
        {
          verified: !o.verified,
          verificationRejected: false,
          verifiedAt: !o.verified ? new Date().toISOString() : null,
        },
        { headers: authHeaders() }
      );
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to update verification", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    const ok = await swal({
      title: "Reset demo data?",
      text: "All edits to organizations, members, drives, campaigns and collaborations made in this session will be discarded and the original seed data restored.",
      icon: "warning",
      buttons: ["Cancel", "Reset"],
      dangerMode: true,
    });
    if (!ok) return;
    resetOrganizationsDemoData();
    await load();
    swal("Reset", "Demo data restored to seed.", "success");
  };

  return (
    <>
      <SEO title="Organizations" />
      <div className="content-wrapper pt-4">
        {DEMO_MODE && (
          <div
            className="d-flex justify-content-between align-items-center gap-2 mb-3 p-3 flex-wrap"
            style={{
              background: "#FEF3C7",
              border: "1px solid #FCD34D",
              borderRadius: 8,
              color: "#92400E",
            }}
          >
            <div className="small">
              <strong><i className="ti ti-flask me-1"></i>Demo mode is on.</strong>{" "}
              Organizations, members, drives, campaigns and collaborations are served from in-browser seed data — every edit persists to sessionStorage and resets when you close the tab. Disable in <code>src/Pages/organizationsDemo.js</code> (<code>DEMO_MODE = false</code>) when the backend is ready.
            </div>
            <button
              className="btn btn-sm btn-outline-warning"
              style={{ borderColor: "#92400E", color: "#92400E" }}
              onClick={handleResetDemo}
            >
              <i className="ti ti-refresh me-1"></i> Reset demo data
            </button>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <p className="card-title p-0 m-0">Organizations &amp; Partners</p>
            <small className="text-muted">
              Verify partners, manage members, track CSR drives and NGO collaborations.
            </small>
          </div>
          <button className="btn btn-primary" style={{ borderRadius: 5 }} onClick={openCreate}>
            <i className="ti ti-plus me-1"></i> Add Organization
          </button>
        </div>

        <div className="row g-3 mb-4">
          <StatCard label="Total" value={stats.total} accent="#0EA5E9" icon="ti-building-community" />
          <StatCard label="Verified" value={stats.verified} accent="#16A34A" icon="ti-shield-check" />
          <StatCard label="Pending Verification" value={stats.pending} accent="#F59E0B" icon="ti-clock" />
        </div>

        {/* Verification tabs — act as the list filter (NGO Partners style) */}
        <div
          style={{
            display: "flex",
            gap: 6,
            borderBottom: "1px solid #e5e7eb",
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = status === tab.key;
            const count = stats[tab.countKey] ?? 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatus(tab.key)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: isActive ? tab.color : "#6b7280",
                  borderBottom: `2px solid ${isActive ? tab.color : "transparent"}`,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {tab.label}
                <span
                  style={{
                    background: isActive ? tab.color : "#e5e7eb",
                    color: isActive ? "white" : "#6b7280",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 8px",
                    borderRadius: 999,
                    minWidth: 22,
                    textAlign: "center",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="card">
          <div className="card-body">
            <div className="d-flex gap-2 mb-3 flex-wrap">
              <input
                className="form-control"
                style={{ maxWidth: 260 }}
                placeholder="Search by name…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") load(); }}
              />
              <button className="btn btn-outline-primary" onClick={load}>
                <i className="ti ti-search me-1"></i>Search
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">Name</th>
                    <th className="align-left">Type</th>
                    <th className="align-left">Verification</th>
                    <th className="align-center">Members</th>
                    <th className="align-center">Drives</th>
                    <th className="align-center">Campaigns</th>
                    <th className="align-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="align-center">
                        <p className="m-5 p-5 fs-4">
                          {items.length === 0
                            ? "No organizations yet — click ‘Add Organization’ to begin."
                            : "No organizations match the current filters."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => {
                      const vs = verificationStatus(o);
                      return (
                        <tr key={o._id}>
                          <td className="align-left">
                            <Link
                              to={`/organizations/${o._id}`}
                              className="fw-bold"
                              style={{ color: "#111827", textDecoration: "none" }}
                            >
                              {o.name}
                            </Link>
                            {o.description && (
                              <div className="text-muted small" style={{ maxWidth: 320 }}>
                                {o.description}
                              </div>
                            )}
                          </td>
                          <td className="align-left">{o.type}</td>
                          <td className="align-left">
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#fff",
                                background: vs.color,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <i className={`ti ${vs.icon}`}></i> {vs.label}
                            </span>
                          </td>
                          <td className="align-center">{o.membersCount ?? 0}</td>
                          <td className="align-center">{o.drivesCount ?? 0}</td>
                          <td className="align-center">{o.campaignsCount ?? 0}</td>
                          <td className="align-center">
                            <Link
                              to={`/organizations/${o._id}`}
                              className="btn btn-sm btn-outline-primary me-1"
                              title="View details"
                            >
                              <i className="ti ti-eye"></i>
                            </Link>
                            <button
                              className={`btn btn-sm me-1 ${o.verified ? "btn-outline-success" : "btn-outline-secondary"}`}
                              onClick={() => quickVerify(o)}
                              title={o.verified ? "Mark unverified" : "Mark verified"}
                            >
                              <i className={`ti ${o.verified ? "ti-shield-check" : "ti-shield-off"}`}></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-info me-1"
                              onClick={() => openEdit(o)}
                              title="Edit"
                            >
                              <i className="ti ti-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(o._id)}
                              title="Delete"
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 760,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 20px",
                background: "#C0392B",
                color: "#fff",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h5 className="m-0">{form._id ? "Edit Organization" : "Add Organization"}</h5>
              <button
                onClick={closeModal}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name *</label>
                  <input
                    className="form-control"
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">
                    Password {form._id && <span className="text-muted small">(leave blank to keep)</span>}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    autoComplete="new-password"
                    placeholder={form._id ? "••••••••" : "Set a login password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="orgActive"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="orgActive">Active</label>
                  </div>
                </div>
                <div className="col-md-12">
                  <label className="form-label">Description</label>
                  <input
                    className="form-control"
                    maxLength={500}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Contact Name</label>
                  <input
                    className="form-control"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Contact Email</label>
                  <input
                    className="form-control"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Contact Phone</label>
                  <input
                    className="form-control"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  />
                </div>
                <div className="col-md-8">
                  <label className="form-label">Address</label>
                  <input
                    className="form-control"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Website</label>
                  <input
                    className="form-control"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave}>
                  {form._id ? "Update" : "Add Organization"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Organizations;
