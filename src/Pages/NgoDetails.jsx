import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import { Link, useNavigate, useParams } from "react-router-dom";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const statusBadge = (status) => {
  const cfg = {
    pending:  { bg: "#f3f4f6", color: "#6b7280", label: "Pending" },
    approved: { bg: "rgba(192,57,43,0.12)", color: "#c0392b", label: "Approved" },
    rejected: { bg: "#f3f4f6", color: "#374151", label: "Rejected" },
    blocked:  { bg: "#f3f4f6", color: "#374151", label: "Blocked" },
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
  // Document currently open in the preview modal (null = closed).
  const [preview, setPreview] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/ngos/${id}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      const data = res.data?.data || {};
      setNgo(data.ngo || null);
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

  const headers = () => ({ Authorization: sessionStorage.getItem("auth") });

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

  const isApproved = ngo.status === "approved";
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
                className="btn"
                style={{ borderRadius: 6, background: "#c0392b", color: "#fff", border: "none" }}
              >
                <i className="ti ti-rotate-clockwise me-1"></i> Unblock
              </button>
            )}
          </div>
        </div>

        {/* Profile */}
        <div>
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
                      onView={setPreview}
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
        </div>
      </div>

      {preview && (
        <DocumentPreview
          doc={preview}
          onClose={() => setPreview(null)}
          onReview={(docId, status) => {
            reviewDoc(docId, status);
            setPreview(null);
          }}
        />
      )}
    </>
  );
};

// Full-screen modal that renders the uploaded file (image inline, PDF in an
// iframe) so the admin can eyeball it before approving/rejecting. Falls back
// to an "open in new tab" link for anything that can't be embedded.
const DocumentPreview = ({ doc, onClose, onReview }) => {
  const url = doc.url || "";
  const lower = `${url} ${doc.name || ""}`.toLowerCase();
  const isPdf = lower.includes(".pdf");
  const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)/.test(lower);
  const status = doc.status || "pending";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 12,
          width: "min(900px, 100%)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 18px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <i className="ti ti-file-text" style={{ color: "#c0392b", fontSize: 18 }}></i>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{doc.type}</div>
            <div
              style={{
                fontSize: 12,
                color: "#6b7280",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {doc.name || "—"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lsa-icon-btn"
            style={{
              border: "none",
              background: "#f3f4f6",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 16,
            }}
            aria-label="Close"
          >
            <i className="ti ti-x"></i>
          </button>
        </div>

        {/* File body */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 320,
          }}
        >
          {!url ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>
              <i className="ti ti-file-off" style={{ fontSize: 40, display: "block", marginBottom: 8 }}></i>
              No file was uploaded for this document.
            </div>
          ) : isImage ? (
            <img
              src={url}
              alt={doc.name || doc.type}
              style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
            />
          ) : isPdf ? (
            <iframe
              title={doc.name || doc.type}
              src={url}
              style={{ width: "100%", height: "70vh", border: "none" }}
            />
          ) : (
            <div style={{ textAlign: "center", color: "#6b7280", padding: 40 }}>
              <i className="ti ti-file-unknown" style={{ fontSize: 40, display: "block", marginBottom: 8 }}></i>
              This file type can&apos;t be previewed here.
              <div style={{ marginTop: 10 }}>
                <a href={url} target="_blank" rel="noreferrer" style={{ color: "#c0392b", fontWeight: 700 }}>
                  Open in a new tab
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 18px",
            borderTop: "1px solid #e5e7eb",
            flexWrap: "wrap",
          }}
        >
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="lsa-btn-outline"
              style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6 }}
            >
              <i className="ti ti-external-link"></i> Open in new tab
            </a>
          )}
          <div style={{ flex: 1 }} />
          {status === "pending" ? (
            <>
              <button
                type="button"
                onClick={() => onReview(doc._id, "rejected")}
                className="btn btn-outline-danger"
                style={{ borderRadius: 6 }}
              >
                <i className="ti ti-x me-1"></i> Reject
              </button>
              <button
                type="button"
                onClick={() => onReview(doc._id, "approved")}
                className="btn"
                style={{ borderRadius: 6, background: "#c0392b", color: "#fff", border: "none" }}
              >
                <i className="ti ti-check me-1"></i> Approve
              </button>
            </>
          ) : (
            <span style={{ fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>
              Already {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// One row per submitted document. Shows the doc type, filename, status pill,
// and (when still pending) approve/reject buttons. Rejected docs additionally
// surface the admin's note so the NGO can see what to fix on resubmission.
const DocumentRow = ({ doc, onReview, onView }) => {
  const status = doc.status || "pending";
  const statusCfg = {
    pending:  { bg: "#f3f4f6", color: "#6b7280", icon: "ti ti-clock-hour-4", label: "Pending" },
    approved: { bg: "rgba(192,57,43,0.12)", color: "#c0392b", icon: "ti ti-circle-check", label: "Approved" },
    rejected: { bg: "#f3f4f6", color: "#374151", icon: "ti ti-x",            label: "Rejected" },
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

      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {/* Eye / view button is ALWAYS shown. If the document has no uploaded
            file (legacy records), the preview modal explains that. */}
        <button
          type="button"
          onClick={() => onView(doc)}
          className="lsa-btn-primary"
          style={{ fontSize: 11, padding: "4px 11px", borderRadius: 5, border: "none", cursor: "pointer" }}
        >
          <i className="ti ti-eye"></i> View document
        </button>
        {status === "pending" && (
            <>
              <button
                type="button"
                onClick={() => onReview(doc._id, "approved")}
                className="btn btn-sm"
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, background: "#c0392b", color: "#fff", border: "none" }}
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
            </>
          )}
        </div>
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
