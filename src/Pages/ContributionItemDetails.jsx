import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

// Detail view for a single Contribution row. Used by the Contributions admin
// page when a donor submitted more than one item — the list view collapses
// the items into a "View N items" link that navigates here. The contribution
// payload arrives via router state on a normal click; on hard-refresh we
// re-fetch from /contribution and find by id so the page still works from a
// shared URL.

const statusPill = (status) => {
  const base = {
    display: "inline-block",
    padding: "4px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "capitalize",
    letterSpacing: 0.3,
  };
  if (status === "approved")
    return { ...base, background: "rgba(34,197,94,0.12)", color: "#16a34a" };
  if (status === "denied")
    return { ...base, background: "rgba(239,68,68,0.12)", color: "#dc2626" };
  if (status === "pending")
    return { ...base, background: "rgba(245,158,11,0.14)", color: "#b45309" };
  return { ...base, background: "#f3f4f6", color: "#6b7280" };
};

const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const ContributionItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { alert } = useContext(GlobalContext);

  const [row, setRow] = useState(location.state?.contribution || null);
  const [loading, setLoading] = useState(!location.state?.contribution);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (row) return;
    // Cold-load (refresh / direct URL): pull the whole list and find by id.
    // The list endpoint already populates user / vendor / contributionRequest
    // / proofs, so a single fetch is enough to hydrate the page.
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_CONTRI}/contribution`
        );
        const found = (res.data || []).find((c) => c._id === id);
        setRow(found || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, row]);

  const updateStatus = async (newStatus) => {
    if (!row) return;
    try {
      setSavingStatus(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_CONTRI}/contributionup/${row._id}`,
        { status: newStatus }
      );
      setRow({ ...row, status: newStatus });
      if (alert) alert("success", `Marked as ${newStatus}`);
    } catch (err) {
      console.error(err);
      if (alert) alert("error", "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <>
        <SEO title="Contribution" />
        <div className="content-wrapper pt-5">
          <p className="text-muted">Loading…</p>
        </div>
      </>
    );
  }

  if (!row) {
    return (
      <>
        <SEO title="Contribution" />
        <div className="content-wrapper pt-5">
          <div className="card">
            <div className="card-body text-center py-5">
              <p className="fs-5 mb-2">Contribution not found.</p>
              <button
                className="btn btn-outline-primary"
                onClick={() => navigate("/contribution")}
              >
                Back to Contributions
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const items = row.sponsoredItems || [];
  const proofs = row.proofs || [];
  const isPending = row.status === "pending";
  const created = row.createdAt ? new Date(row.createdAt) : null;

  return (
    <>
      <SEO title="Contribution Detail" />
      <div className="content-wrapper pt-5">
        <div
          className="d-flex justify-content-between align-items-center mb-3 flex-wrap"
          style={{ gap: 12 }}
        >
          <div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary mb-2"
              onClick={() => navigate("/contribution")}
            >
              <i className="ti ti-arrow-left me-1"></i> Back to Contributions
            </button>
            <p className="card-title p-0 m-0">Contribution Detail</p>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              {row.type ? row.type.charAt(0).toUpperCase() + row.type.slice(1) : "—"}{" "}
              flow · {items.length} item{items.length === 1 ? "" : "s"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={statusPill(row.status)}>{row.status || "-"}</span>
            {isPending && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => updateStatus("approved")}
                  disabled={savingStatus}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    border: "1px solid #16a34a",
                    background: "#16a34a",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus("denied")}
                  disabled={savingStatus}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    border: "1px solid #dc2626",
                    background: "#fff",
                    color: "#dc2626",
                    cursor: "pointer",
                  }}
                >
                  Deny
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== Donor + summary cards ===== */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Donor
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                  {row.user?.name || "—"}
                </div>
                {row.user?.email && (
                  <div className="text-muted small mt-1">{row.user.email}</div>
                )}
                {row.user?.phone && (
                  <div className="text-muted small">
                    +{row.user.phoneCode || ""} {row.user.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 700,
                      }}
                    >
                      Amount
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
                      {fmtMoney(row.contributionAmount)}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 700,
                      }}
                    >
                      Date
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      {created ? created.toLocaleDateString() : "—"}
                    </div>
                    {created && (
                      <div className="text-muted small">
                        {created.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Items ===== */}
        <div className="card mb-3">
          <div
            className="card-header"
            style={{ background: "#C0392B", color: "#fff" }}
          >
            <h5 className="mb-0">Sponsored Items ({items.length})</h5>
          </div>
          <div className="card-body p-0">
            {items.length === 0 ? (
              <p className="text-muted m-4">No items in this contribution.</p>
            ) : (
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead style={{ background: "#f9fafb" }}>
                    <tr>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          width: 80,
                        }}
                      >
                        #
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Item Name
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          width: 140,
                        }}
                      >
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: "#6b7280",
                            fontWeight: 600,
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {i.itemName}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            textAlign: "right",
                            fontWeight: 700,
                            color: "#C0392B",
                          }}
                        >
                          × {i.sponsorQuantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ===== Notes ===== */}
        {row.notes && (
          <div className="card mb-3">
            <div className="card-body">
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Donor Notes
              </div>
              <div style={{ fontSize: 14, color: "#374151", whiteSpace: "pre-wrap" }}>
                {row.notes}
              </div>
            </div>
          </div>
        )}

        {/* ===== Proofs ===== */}
        {proofs.length > 0 && (
          <div className="card mb-3">
            <div className="card-body">
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                Uploaded Proofs ({proofs.length})
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {proofs.map((p) => {
                  if (!p?.url) return null;
                  const isImage = (p.mime || "").startsWith("image/");
                  if (isImage) {
                    return (
                      <a
                        key={p._id}
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        title={p.name || "View screenshot"}
                        style={{
                          display: "block",
                          width: 120,
                          height: 120,
                          borderRadius: 10,
                          overflow: "hidden",
                          border: "1px solid #e5e7eb",
                          background: "#f9fafb",
                        }}
                      >
                        <img
                          src={p.url}
                          alt={p.name || "proof"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </a>
                    );
                  }
                  const isPdf = (p.mime || "").includes("pdf");
                  return (
                    <a
                      key={p._id}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      title={p.name || "View file"}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        background: "#f9fafb",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#374151",
                        textDecoration: "none",
                      }}
                    >
                      <i
                        className={isPdf ? "fa-solid fa-file-pdf" : "fa-solid fa-file"}
                        style={{ color: isPdf ? "#dc2626" : "#6b7280", fontSize: 18 }}
                      ></i>
                      <span>{p.name || "File"}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ContributionItemDetails;
