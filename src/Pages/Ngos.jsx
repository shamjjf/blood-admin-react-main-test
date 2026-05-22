import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import { Link } from "react-router-dom";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

// Admin workflow:
//   1. Pending Review — a new NGO registered and needs its account approved
//      with a permission set.
//   2. Docs Pending   — an approved NGO uploaded verification docs that
//      still need an admin yay/nay.
//   3. Registered     — full history of every NGO that has ever signed up,
//      whatever their current status. The row's status badge tells you
//      whether each one is approved / rejected / blocked.
// Tabs 1–3 filter the NGO list; tab "hospitalRequests" switches the page to
// a different data source (NGO-submitted hospital connections awaiting
// admin approval) using the same chrome.
const STATUS_TABS = [
  { key: "pending",          label: "Pending Review",    color: "#f59e0b", countKey: "pending"          },
  { key: "docsPending",      label: "Docs Pending",      color: "#7c3aed", countKey: "docsPending"      },
  { key: "all",              label: "Registered",        color: "#0ea5e9", countKey: "all"              },
  { key: "hospitalRequests", label: "Hospital Requests", color: "#0d9488", countKey: "hospitalRequests" },
];

// Pill cluster that summarises a row's document review state. Hidden when
// the NGO hasn't submitted anything yet — keeps the table calm for the
// pending-review tab where most rows have zero docs.
const DocSummary = ({ counts }) => {
  if (!counts || counts.total === 0) {
    return <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>;
  }
  const pill = (n, bg, color, title) =>
    n > 0 && (
      <span
        title={title}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 8px",
          borderRadius: 999,
          background: bg,
          color,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {n}
      </span>
    );
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {pill(counts.pending,  "rgba(245,158,11,0.14)", "#b45309", "Pending review")}
      {pill(counts.approved, "rgba(22,163,74,0.14)",  "#15803d", "Approved")}
      {pill(counts.rejected, "rgba(220,38,38,0.14)",  "#b91c1c", "Rejected")}
      <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 2 }}>
        / {counts.total}
      </span>
    </div>
  );
};

const statusBadge = (status) => {
  const cfg = {
    pending:  { bg: "rgba(245,158,11,0.12)", color: "#b45309", label: "Pending" },
    approved: { bg: "rgba(22,163,74,0.12)",  color: "#15803d", label: "Approved" },
    rejected: { bg: "rgba(220,38,38,0.12)",  color: "#b91c1c", label: "Rejected" },
    blocked:  { bg: "rgba(107,114,128,0.14)", color: "#374151", label: "Blocked" },
  }[status] || {
    bg: "#f3f4f6",
    color: "#374151",
    label: status,
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.color,
        textTransform: "capitalize",
        letterSpacing: 0.3,
      }}
    >
      {cfg.label}
    </span>
  );
};

const Ngos = () => {
  const { setLoading } = useContext(GlobalContext);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState("pending");
  const [searchText, setSearchText] = useState("");

  // Auxiliary loader for the Hospital Requests tab — separate endpoint and
  // separate row shape (hospitals vs NGOs). When the user is on any other
  // tab we fall back to the standard /ngos query.
  const load = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: sessionStorage.getItem("auth") };

      if (status === "hospitalRequests") {
        // Pull pending hospital connections + counts in parallel.
        const params = new URLSearchParams({ status: "pending" });
        if (searchText) params.set("searchText", searchText);
        const [hospRes, ngosRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/ngo-hospitals?${params.toString()}`, { headers }),
          // We also re-fetch /ngos to keep the other tabs' counts fresh.
          axios.get(`${import.meta.env.VITE_API_URL}/ngos`, { headers }),
        ]);
        const hospCounts = hospRes?.data?.data?.counts || {};
        const ngoCounts = ngosRes?.data?.data?.counts || {};
        setItems(hospRes?.data?.data?.items || []);
        setCounts({ ...ngoCounts, hospitalRequests: hospCounts.pending ?? 0 });
        return;
      }

      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (searchText) params.set("searchText", searchText);
      const [ngosRes, hospRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/ngos?${params.toString()}`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/ngo-hospitals?status=pending`, { headers }),
      ]);
      const ngoCounts = ngosRes?.data?.data?.counts || {};
      const hospCounts = hospRes?.data?.data?.counts || {};
      setItems(ngosRes?.data?.data?.items || []);
      setCounts({ ...ngoCounts, hospitalRequests: hospCounts.pending ?? 0 });
    } catch (err) {
      console.error("load ngos failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Per-row hospital action: approve or reject in one round-trip and refresh.
  const reviewHospital = async (id, newStatus) => {
    let note = "";
    if (newStatus === "rejected") {
      note = await swal({
        title: "Reject this hospital request?",
        text: "Add a note so the NGO knows why.",
        icon: "warning",
        content: { element: "input", attributes: { placeholder: "Reason" } },
        buttons: ["Cancel", "Reject"],
        dangerMode: true,
      });
      if (note === null) return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/ngo-hospitals/${id}/${
          newStatus === "approved" ? "approve" : "reject"
        }`,
        { note: note || "" },
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      load();
    } catch (err) {
      console.error("hospital review failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <>
      <SEO title="NGO Partners" />
      <div className="content-wrapper">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
          <div>
            <p className="card-title p-0 m-0">NGO Partners</p>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Review and manage partner NGO accounts.
            </p>
          </div>
        </div>

        {/* Status tabs with counts */}
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
            const count = counts[tab.countKey] ?? 0;
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

        {/* Search */}
        <form onSubmit={onSearchSubmit} className="mb-3" style={{ maxWidth: 360 }}>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search name, email, city…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button type="submit" className="btn btn-outline-secondary">
              <i className="ti ti-search"></i>
            </button>
          </div>
        </form>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: 13,
              minWidth: 760,
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
          >
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {(status === "hospitalRequests"
                  ? ["Hospital", "From NGO", "Phone", "Doctor", "Email", "Submitted", "Actions"]
                  : ["NGO", "Contact", "City", "Registered", "Documents", "Status", "Actions"]
                ).map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "#6b7280" }}>
                    {status === "hospitalRequests"
                      ? "No hospital connection requests pending."
                      : "No NGOs in this view."}
                  </td>
                </tr>
              ) : status === "hospitalRequests" ? (
                items.map((h) => (
                  <tr key={h._id}>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", fontWeight: 700 }}>
                      {h.hospitalName}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <span
                        style={{
                          background: "rgba(124,58,237,0.12)",
                          color: "#6d28d9",
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          marginRight: 4,
                        }}
                      >
                        NGO
                      </span>
                      <span style={{ color: "#6b7280", fontSize: 12 }}>
                        {h.ngo?.name || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      {h.phone || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      {h.doctorName || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      {h.email || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                      {h.createdAt ? new Date(h.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => reviewHospital(h._id, "approved")}
                          className="btn btn-sm btn-success"
                          style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5 }}
                        >
                          <i className="ti ti-check me-1"></i> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewHospital(h._id, "rejected")}
                          className="btn btn-sm btn-outline-danger"
                          style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5 }}
                        >
                          <i className="ti ti-x me-1"></i> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                items.map((n) => (
                  <tr key={n._id}>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ fontWeight: 700 }}>{n.name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        {n.website || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <div>{n.email}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        {n.phone ? `${n.phoneCode || ""} ${n.phone}` : "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      {n.city || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                      {new Date(n.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <DocSummary counts={n.docCounts} />
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      {statusBadge(n.status)}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <Link
                        to={`/ngo/${n._id}`}
                        className={
                          status === "docsPending"
                            ? "btn btn-sm btn-primary"
                            : "btn btn-sm btn-outline-primary"
                        }
                        style={{
                          fontSize: 11,
                          padding: "4px 10px",
                          borderRadius: 5,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {status === "docsPending" ? (
                          <>
                            <i className="ti ti-file-search me-1"></i>
                            Review Documents
                          </>
                        ) : status === "pending" ? (
                          <>
                            <i className="ti ti-shield-check me-1"></i>
                            Set Permissions
                          </>
                        ) : (
                          <>
                            <i className="ti ti-eye me-1"></i>
                            View
                          </>
                        )}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Ngos;
