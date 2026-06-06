import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import Tabs from "../Components/Tabs";

// Admin moderation for blood donation drives created by NGOs and Organisations.
// Reuses the two existing admin endpoint groups (no backend change):
//   NGO drives → /api/admin/donation-drives        (status pending|approved|rejected)
//   Org drives → /api/admin/org-drives             (approvalStatus pending|approved|rejected)
// Both expose /:id/approve, /:id/reject and DELETE /:id with the same shape, so
// each row just dispatches to the endpoint matching its source.
const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: sessionStorage.getItem("auth") });

const SOURCE_TABS = {
  all: { label: "All Drives" },
  ngo: { label: "NGO Drives" },
  org: { label: "Organisation Drives" },
};

const STATUS_FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Normalise an NGO DonationDrive into the shared row shape.
const shapeNgo = (d) => ({
  _id: d._id,
  source: "ngo",
  title: d.title || "Untitled drive",
  creator: d.ngoSummary?.name || d.organizer || "NGO partner",
  location: d.location || "—",
  date: d.date || (d.dateIso ? fmtDate(d.dateIso) : "—"),
  goal: d.goal || 0,
  approval: d.status, // pending | approved | rejected
  rejectionReason: d.rejectionReason || "",
  createdAt: d.createdAt,
  raw: d,
});

// Normalise an Organisation OrgDrive into the shared row shape.
const shapeOrg = (d) => ({
  _id: d._id,
  source: "org",
  title: d.name || "Untitled drive",
  creator: d.organization?.name || d.partner || "Organisation",
  location: d.location || "—",
  date: d.date ? fmtDate(d.date) : "—",
  goal: d.target || 0,
  approval: d.approvalStatus, // pending | approved | rejected
  rejectionReason: d.rejectionNote || "",
  createdAt: d.createdAt,
  raw: d,
});

const approvalBadge = (s) =>
  s === "approved"
    ? { label: "Approved", bg: "#16A34A" }
    : s === "rejected"
    ? { label: "Rejected", bg: "#DC2626" }
    : { label: "Pending", bg: "#F59E0B" };

const sourceBadge = (s) =>
  s === "ngo" ? { label: "NGO", bg: "#0EA5E9" } : { label: "Organisation", bg: "#7C3AED" };

// Build the label/value rows for the details modal. The two sources carry
// different fields, so we show the common ones plus source-specific extras.
const detailRows = (row) => {
  const r = row.raw || {};
  const common = [
    ["Source", row.source === "ngo" ? "NGO" : "Organisation"],
    ["Created by", row.creator],
    ["Status", approvalBadge(row.approval).label],
    ["Location", row.location],
    ["Date", row.date],
  ];
  const rejection =
    row.approval === "rejected" && row.rejectionReason
      ? [["Rejection reason", row.rejectionReason]]
      : [];
  if (row.source === "ngo") {
    return [
      ...common,
      ["Organizer", r.organizer || "—"],
      ["Tag", r.tag || "—"],
      ["Goal", r.goal ? `${r.goal} donors` : "—"],
      ["Progress", `${r.progress || 0} registered`],
      ["Blood groups needed", (r.bloodGroupsNeeded || []).join(", ") || "—"],
      ...rejection,
      ["Created", fmtDate(r.createdAt)],
    ];
  }
  return [
    ...common,
    ["Partner", r.partner || "—"],
    ["Time", r.time || "—"],
    ["Target", r.target ? `${r.target} donors` : "—"],
    ["Contact name", r.contactName || "—"],
    ["Contact phone", r.contactPhone || "—"],
    ["Description", r.description || "—"],
    ["Notify", r.notify || "—"],
    ["Lifecycle", r.status || "—"],
    ["Members registered", String((r.joinedBy || []).length)],
    ...rejection,
    ["Created", fmtDate(r.createdAt)],
  ];
};

const pill = (text, bg) => (
  <span
    style={{
      background: bg,
      color: "#fff",
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 10px",
      borderRadius: 999,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </span>
);

const BloodDonationDrives = () => {
  const [source, setSource] = useState("all"); // all | ngo | org
  const [status, setStatus] = useState("pending"); // pending | approved | rejected | all
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null); // drive shown in the details modal

  // NGO list filters by `status` (omit for "all"); Org list by `approvalStatus`.
  const fetchNgo = async () => {
    const q = status && status !== "all" ? `?status=${status}` : "";
    const res = await axios.get(`${API}/donation-drives${q}`, { headers: authHeaders() });
    return (res?.data?.data?.items || []).map(shapeNgo);
  };
  const fetchOrg = async () => {
    const res = await axios.get(`${API}/org-drives?approvalStatus=${status || "all"}`, {
      headers: authHeaders(),
    });
    return (res?.data?.data?.items || []).map(shapeOrg);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let rows = [];
      if (source === "ngo") rows = await fetchNgo();
      else if (source === "org") rows = await fetchOrg();
      else {
        // "All" — pull both; a missing role on one source just yields [].
        const [ngo, org] = await Promise.all([
          fetchNgo().catch(() => []),
          fetchOrg().catch(() => []),
        ]);
        rows = [...ngo, ...org];
      }
      rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDrives(rows);
    } catch (err) {
      console.error("load drives failed:", err);
      swal("Error", err?.response?.data?.error || "Failed to load drives", "error");
      setDrives([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, status]);

  useEffect(() => {
    load();
  }, [load]);

  const endpointBase = (row) => (row.source === "ngo" ? "donation-drives" : "org-drives");

  const approve = async (row) => {
    const ok = await swal({
      title: `Approve "${row.title}"?`,
      text: "It will go live and become visible to volunteers.",
      icon: "info",
      buttons: ["Cancel", "Approve"],
    });
    if (!ok) return;
    try {
      await axios.post(`${API}/${endpointBase(row)}/${row._id}/approve`, {}, { headers: authHeaders() });
      swal("Approved", `"${row.title}" is now live.`, "success");
      load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to approve", "error");
    }
  };

  const reject = async (row) => {
    const reason = await swal({
      title: `Reject "${row.title}"?`,
      text: "Optional reason to share with the creator:",
      content: { element: "input", attributes: { placeholder: "e.g. needs more details" } },
      buttons: ["Cancel", "Reject"],
      dangerMode: true,
    });
    if (reason === null) return;
    try {
      await axios.post(
        `${API}/${endpointBase(row)}/${row._id}/reject`,
        { reason: typeof reason === "string" ? reason : "" },
        { headers: authHeaders() }
      );
      swal("Rejected", `"${row.title}" has been rejected.`, "success");
      load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to reject", "error");
    }
  };

  const remove = async (row) => {
    const ok = await swal({
      title: `Delete "${row.title}"?`,
      text: "This permanently removes the drive.",
      icon: "warning",
      dangerMode: true,
      buttons: ["Cancel", "Delete"],
    });
    if (!ok) return;
    try {
      await axios.delete(`${API}/${endpointBase(row)}/${row._id}`, { headers: authHeaders() });
      swal("Deleted", "Drive removed.", "success");
      load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to delete", "error");
    }
  };

  return (
    <div style={{ position: "relative" }} className="content-wrapper">
      <SEO title="Blood Donation Drives" />

      <div className="d-flex mb-3 justify-content-between align-items-center flex-wrap">
        <p className="card-title p-0 m-0">Blood Donation Drives</p>
      </div>

      {/* Source tabs — All / NGO / Organisation (matches the Requests panel) */}
      <Tabs
        variant="pill"
        accent="#c0392b"
        tabs={{
          all: { label: SOURCE_TABS.all.label, render: "", onClick: () => setSource("all") },
          ngo: { label: SOURCE_TABS.ngo.label, render: "", onClick: () => setSource("ngo") },
          org: { label: SOURCE_TABS.org.label, render: "", onClick: () => setSource("org") },
        }}
      />

      <div className="card">
        <div className="card-body">
          {/* Status filter */}
          <div className="d-flex gap-2 flex-wrap mb-3">
            {STATUS_FILTERS.map((f) => {
              const active = status === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatus(f.key)}
                  className="btn btn-sm"
                  style={{
                    background: active ? "#c0392b" : "#fff",
                    color: active ? "#fff" : "#c0392b",
                    border: "1px solid #c0392b",
                    fontWeight: 600,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Drive</th>
                  <th>Source</th>
                  <th>Created by</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      Loading drives…
                    </td>
                  </tr>
                ) : drives.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      No drives in this view.
                    </td>
                  </tr>
                ) : (
                  drives.map((d) => {
                    const ab = approvalBadge(d.approval);
                    const sb = sourceBadge(d.source);
                    return (
                      <tr key={`${d.source}-${d._id}`}>
                        <td>
                          <strong>{d.title}</strong>
                          {d.goal ? (
                            <div style={{ fontSize: 12, color: "#6b7280" }}>Goal: {d.goal} donors</div>
                          ) : null}
                          {d.approval === "rejected" && d.rejectionReason ? (
                            <div style={{ fontSize: 12, color: "#DC2626" }}>Reason: {d.rejectionReason}</div>
                          ) : null}
                        </td>
                        <td>{sb.label}</td>
                        <td>{d.creator}</td>
                        <td>{d.location}</td>
                        <td>{d.date}</td>
                        <td>{pill(ab.label, ab.bg)}</td>
                        <td className="text-end" style={{ whiteSpace: "nowrap" }}>
                          <button
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => setViewing(d)}
                            title="View"
                          >
                            <i className="ti ti-eye"></i>
                          </button>
                          {d.approval !== "approved" && (
                            <button
                              className="btn btn-sm btn-outline-success me-1"
                              onClick={() => approve(d)}
                              title="Approve"
                            >
                              <i className="ti ti-check"></i>
                            </button>
                          )}
                          {d.approval !== "rejected" && (
                            <button
                              className="btn btn-sm btn-outline-warning me-1"
                              onClick={() => reject(d)}
                              title="Reject"
                            >
                              <i className="ti ti-x"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => remove(d)}
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

      {/* Details modal */}
      {viewing && (
        <div
          onClick={() => setViewing(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 10, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto" }}
          >
            <div
              className="d-flex justify-content-between align-items-center"
              style={{ padding: "16px 20px", borderBottom: "1px solid #eee" }}
            >
              <h5 className="m-0">{viewing.title}</h5>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setViewing(null)}
                style={{ border: "none", background: "none" }}
              >
                <i className="ti ti-x" style={{ fontSize: 18 }}></i>
              </button>
            </div>
            <div style={{ padding: "8px 20px 16px" }}>
              {detailRows(viewing).map(([label, value]) => (
                <div key={label} className="d-flex" style={{ padding: "7px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ width: 170, color: "#6b7280", fontSize: 13, flexShrink: 0 }}>{label}</div>
                  <div style={{ fontSize: 13, color: "#111", wordBreak: "break-word" }}>{value || "—"}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #eee", textAlign: "right" }}>
              {viewing.approval !== "approved" && (
                <button
                  className="btn btn-sm btn-outline-success me-1"
                  onClick={() => { const v = viewing; setViewing(null); approve(v); }}
                >
                  Approve
                </button>
              )}
              {viewing.approval !== "rejected" && (
                <button
                  className="btn btn-sm btn-outline-warning me-1"
                  onClick={() => { const v = viewing; setViewing(null); reject(v); }}
                >
                  Reject
                </button>
              )}
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setViewing(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodDonationDrives;
