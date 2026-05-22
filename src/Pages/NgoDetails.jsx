import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import { Link, useNavigate, useParams } from "react-router-dom";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

// Friendly labels for the permission keys defined by the backend Ngo model.
// If the backend adds a new key, list returns it via /admin/ngos and the
// matrix renders a fallback row for it.
const PERM_LABELS = {
  "blood-requests":   { label: "Blood Requests",     icon: "ti ti-droplet-filled",  hint: "Post requests, match donors, close out fulfilled cases." },
  "donors":           { label: "Donors",             icon: "ti ti-users",            hint: "Browse, invite and manage the donor network." },
  "camps":            { label: "Donation Camps",     icon: "ti ti-calendar-event",   hint: "Publish camps and track attendance / registrations." },
  "volunteers":       { label: "Volunteers",         icon: "ti ti-heart-handshake",  hint: "Onboard volunteers and assign tasks." },
  "hospitals":        { label: "Hospitals & Orgs",   icon: "ti ti-building-hospital", hint: "Connect hospitals, partner organisations and blood banks." },
  "emergency-alerts": { label: "Emergency Alerts",   icon: "ti ti-alert-triangle",    hint: "Broadcast urgent requests to nearby donors." },
  "notifications":    { label: "Notifications",      icon: "ti ti-bell-ringing",      hint: "Send email / SMS / WhatsApp campaigns." },
  "reports":          { label: "Reports & Analytics", icon: "ti ti-chart-pie",        hint: "View dashboards and export reports." },
  "documents":        { label: "Documents",          icon: "ti ti-file-certificate",  hint: "Upload + manage NGO documents (always granted)." },
  "support":          { label: "Support",            icon: "ti ti-lifebuoy",          hint: "Raise tickets and view complaints." },
};

const statusBadge = (status) => {
  const cfg = {
    pending:  { bg: "rgba(245,158,11,0.12)", color: "#b45309", label: "Pending" },
    approved: { bg: "rgba(22,163,74,0.12)",  color: "#15803d", label: "Approved" },
    rejected: { bg: "rgba(220,38,38,0.12)",  color: "#b91c1c", label: "Rejected" },
    blocked:  { bg: "rgba(107,114,128,0.14)", color: "#374151", label: "Blocked" },
  }[status] || { bg: "#f3f4f6", color: "#374151", label: status };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 14px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
};

const NgoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setLoading, alert } = useContext(GlobalContext);

  const [ngo, setNgo] = useState(null);
  const [permList, setPermList] = useState([]);
  const [selected, setSelected] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/ngos/${id}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      const data = res.data?.data || {};
      setNgo(data.ngo || null);
      setPermList(data.permissions || []);
      setSelected(data.ngo?.permissions || []);
    } catch (err) {
      console.error("load ngo failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const togglePerm = (key) => {
    setSelected((s) =>
      s.includes(key) ? s.filter((k) => k !== key) : [...s, key]
    );
  };

  const toggleAll = () => {
    if (selected.length === permList.length) setSelected([]);
    else setSelected([...permList]);
  };

  const headers = () => ({ Authorization: sessionStorage.getItem("auth") });

  const handleApprove = async () => {
    if (selected.length === 0) {
      const ok = await swal({
        title: "Approve with no permissions?",
        text: "You haven't selected any modules. The NGO will be approved but won't see any operations modules in their panel.",
        icon: "warning",
        buttons: ["Cancel", "Approve anyway"],
        dangerMode: true,
      });
      if (!ok) return;
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/ngos/${id}/approve`,
        { permissions: selected },
        { headers: headers() }
      );
      setNgo(res.data?.data?.ngo);
      if (alert) alert({ type: "success", title: "Approved", text: "NGO approved with the selected permissions." });
    } catch (err) {
      console.error("approve failed:", err);
      if (alert) alert({ type: "error", title: "Failed", text: err?.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePerms = async () => {
    try {
      setLoading(true);
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/ngos/${id}/permissions`,
        { permissions: selected },
        { headers: headers() }
      );
      setNgo(res.data?.data?.ngo);
      if (alert) alert({ type: "success", title: "Saved", text: "Permissions updated." });
    } catch (err) {
      console.error("save perms failed:", err);
      if (alert) alert({ type: "error", title: "Failed", text: err?.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = await swal({
      title: "Reject this NGO?",
      text: "They won't be able to sign in. Provide a reason — the NGO will see this on the login screen.",
      icon: "warning",
      content: { element: "input", attributes: { placeholder: "Reason for rejection" } },
      buttons: ["Cancel", "Reject"],
      dangerMode: true,
    });
    if (!reason) return;
    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/ngos/${id}/reject`,
        { reason },
        { headers: headers() }
      );
      setNgo(res.data?.data?.ngo);
      if (alert) alert({ type: "success", title: "Rejected", text: "NGO marked as rejected." });
    } catch (err) {
      if (alert) alert({ type: "error", title: "Failed", text: err?.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    const ok = await swal({
      title: "Block this NGO?",
      text: "They'll be signed out and prevented from logging back in.",
      icon: "warning",
      buttons: ["Cancel", "Block"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/ngos/${id}/block`,
        {},
        { headers: headers() }
      );
      setNgo(res.data?.data?.ngo);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/ngos/${id}/unblock`,
        {},
        { headers: headers() }
      );
      setNgo(res.data?.data?.ngo);
    } finally {
      setLoading(false);
    }
  };

  // Per-document review. The docId param matches the Mongoose subdoc _id.
  const reviewDoc = async (docId, status) => {
    let note = "";
    if (status === "rejected") {
      note = await swal({
        title: "Reject this document?",
        text: "Add a short note so the NGO knows what to fix.",
        icon: "warning",
        content: { element: "input", attributes: { placeholder: "e.g. Image is blurry, please reupload" } },
        buttons: ["Cancel", "Reject"],
        dangerMode: true,
      });
      if (!note) return;
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/ngos/${id}/documents/${docId}/review`,
        { status, note },
        { headers: headers() }
      );
      setNgo(res.data?.data?.ngo);
      if (alert) alert({ type: "success", title: "Updated", text: `Document marked ${status}.` });
    } catch (err) {
      console.error("review doc failed:", err);
      if (alert) alert({ type: "error", title: "Failed", text: err?.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!ngo) {
    return (
      <div className="content-wrapper">
        <SEO title="NGO Details" />
        <p>Loading…</p>
      </div>
    );
  }

  const isPending = ngo.status === "pending";
  const isApproved = ngo.status === "approved";
  const isRejected = ngo.status === "rejected";
  const isBlocked = ngo.status === "blocked";

  return (
    <>
      <SEO title={`NGO · ${ngo.name}`} />
      <div className="content-wrapper">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap" style={{ gap: 16 }}>
          <div>
            <Link to="/ngos" style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}>
              <i className="ti ti-arrow-left"></i> Back to NGOs
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
              <p className="card-title p-0 m-0" style={{ fontSize: 22 }}>
                {ngo.name}
              </p>
              {statusBadge(ngo.status)}
            </div>
            <p className="text-muted mb-0" style={{ fontSize: 13, marginTop: 4 }}>
              Registered {new Date(ngo.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {(isPending || isRejected) && (
              <button
                type="button"
                onClick={handleApprove}
                className="btn btn-success"
                style={{ borderRadius: 6 }}
              >
                <i className="ti ti-check me-1"></i> Approve
              </button>
            )}
            {isApproved && (
              <button
                type="button"
                onClick={handleSavePerms}
                className="btn btn-primary"
                style={{ borderRadius: 6 }}
              >
                <i className="ti ti-device-floppy me-1"></i> Save Permissions
              </button>
            )}
            {(isPending || isApproved) && (
              <button
                type="button"
                onClick={handleReject}
                className="btn btn-outline-danger"
                style={{ borderRadius: 6 }}
              >
                <i className="ti ti-x me-1"></i> Reject
              </button>
            )}
            {isApproved && (
              <button
                type="button"
                onClick={handleBlock}
                className="btn btn-outline-secondary"
                style={{ borderRadius: 6 }}
              >
                <i className="ti ti-ban me-1"></i> Block
              </button>
            )}
            {isBlocked && (
              <button
                type="button"
                onClick={handleUnblock}
                className="btn btn-success"
                style={{ borderRadius: 6 }}
              >
                <i className="ti ti-rotate-clockwise me-1"></i> Unblock
              </button>
            )}
          </div>
        </div>

        {/* Two-column: profile + permissions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 18 }}>
          {/* Profile card */}
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 22,
            }}
          >
            <h6 style={{ fontWeight: 700, marginBottom: 14 }}>
              <i className="ti ti-building me-2" style={{ color: "#c0392b" }}></i>
              Profile
            </h6>
            <ProfileRow label="Email" value={ngo.email} />
            <ProfileRow label="Phone" value={ngo.phone ? `${ngo.phoneCode || ""} ${ngo.phone}` : "—"} />
            <ProfileRow label="City" value={ngo.city || "—"} />
            <ProfileRow label="State" value={ngo.state || "—"} />
            <ProfileRow label="Pincode" value={ngo.pincode || "—"} />
            <ProfileRow label="Address" value={ngo.address || "—"} />
            <ProfileRow label="Website" value={ngo.website || "—"} />
            <ProfileRow label="About" value={ngo.description || "—"} multiline />
            {ngo.status === "rejected" && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#991b1b",
                }}
              >
                <strong>Rejection reason:</strong> {ngo.rejectionReason || "(no reason recorded)"}
              </div>
            )}
            {ngo.approvedAt && (
              <div style={{ marginTop: 12, fontSize: 11, color: "#6b7280" }}>
                Approved on {new Date(ngo.approvedAt).toLocaleString()}
              </div>
            )}

            {/* Verification documents the NGO has submitted. Each doc gets
                its own approve / reject buttons until reviewed. */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 6,
                }}
              >
                Submitted Documents
              </div>
              {ngo.documentsSubmittedAt ? (
                <>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>
                    {new Date(ngo.documentsSubmittedAt).toLocaleString()}
                  </div>
                  {(ngo.documents || []).map((d) => (
                    <DocumentRow
                      key={d._id || `${d.type}-${d.submittedAt}`}
                      doc={d}
                      onReview={reviewDoc}
                    />
                  ))}
                </>
              ) : (
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  No documents submitted yet.
                </div>
              )}
            </div>
          </div>

          {/* Permission matrix */}
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 22,
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 style={{ fontWeight: 700, margin: 0 }}>
                <i className="ti ti-shield-check me-2" style={{ color: "#c0392b" }}></i>
                Module Permissions
              </h6>
              <button
                type="button"
                onClick={toggleAll}
                className="btn btn-sm btn-outline-secondary"
                style={{ fontSize: 11, borderRadius: 5 }}
              >
                {selected.length === permList.length ? "Clear all" : "Select all"}
              </button>
            </div>
            <p className="text-muted" style={{ fontSize: 12, marginBottom: 14 }}>
              Pick which modules this NGO can access in their panel. Documents
              and Support are always available regardless of selection.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {permList.map((key) => {
                const meta = PERM_LABELS[key] || { label: key, icon: "ti ti-square", hint: "" };
                const checked = selected.includes(key);
                return (
                  <label
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 12px",
                      border: `1px solid ${checked ? "#c0392b" : "#e5e7eb"}`,
                      borderRadius: 8,
                      background: checked ? "rgba(192,57,43,0.04)" : "white",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePerm(key)}
                      style={{ marginTop: 3 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                        <i className={meta.icon} style={{ color: "#c0392b" }}></i>
                        {meta.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                        {meta.hint}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// One row per submitted document. Shows the doc type, filename, status pill,
// and (when still pending) approve/reject buttons. Rejected docs additionally
// surface the admin's note so the NGO can see what to fix on resubmission.
const DocumentRow = ({ doc, onReview }) => {
  const status = doc.status || "pending";
  const statusCfg = {
    pending:  { bg: "rgba(245,158,11,0.14)", color: "#b45309", icon: "ti ti-clock-hour-4", label: "Pending" },
    approved: { bg: "rgba(22,163,74,0.14)",  color: "#15803d", icon: "ti ti-circle-check", label: "Approved" },
    rejected: { bg: "rgba(220,38,38,0.14)",  color: "#b91c1c", icon: "ti ti-x",            label: "Rejected" },
  }[status];
  return (
    <div
      style={{
        padding: "10px 12px",
        fontSize: 12,
        background: "#f9fafb",
        border: "1px solid #f3f4f6",
        borderRadius: 8,
        marginBottom: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <i className="ti ti-file-text" style={{ color: "#c0392b" }}></i>
        <span style={{ fontWeight: 700, minWidth: 100, textTransform: "capitalize" }}>
          {doc.type}
        </span>
        <span
          style={{
            color: "#6b7280",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {doc.name || "—"}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 9px",
            borderRadius: 999,
            background: statusCfg.bg,
            color: statusCfg.color,
            fontSize: 10.5,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          <i className={statusCfg.icon} style={{ fontSize: 12 }}></i>
          {statusCfg.label}
        </span>
      </div>

      {status === "rejected" && doc.reviewNote && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#991b1b" }}>
          <strong>Note:</strong> {doc.reviewNote}
        </div>
      )}

      {status === "pending" && (
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => onReview(doc._id, "approved")}
            className="btn btn-sm btn-success"
            style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5 }}
          >
            <i className="ti ti-check me-1"></i> Approve
          </button>
          <button
            type="button"
            onClick={() => onReview(doc._id, "rejected")}
            className="btn btn-sm btn-outline-danger"
            style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5 }}
          >
            <i className="ti ti-x me-1"></i> Reject
          </button>
        </div>
      )}
    </div>
  );
};

const ProfileRow = ({ label, value, multiline }) => (
  <div style={{ marginBottom: 10 }}>
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 2,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 13,
        color: "#111827",
        whiteSpace: multiline ? "pre-wrap" : "normal",
        wordBreak: "break-word",
      }}
    >
      {value}
    </div>
  </div>
);

export default NgoDetails;
