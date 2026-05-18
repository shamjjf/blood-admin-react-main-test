import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

// Admin moderation view for ALL reward redemptions from the Gifts catalog
// (GiftClaim model) — printed certificates, stickers, merch, etc. The
// dedicated CertificateOrder flow was removed from this page since this
// deployment funnels every reward through GiftClaim.

const CLAIM_STATUSES = ["All", "Requested", "Approved", "Shipped", "Delivered", "Canceled"];

const claimBadge = (s) => {
  const base = {
    padding: "3px 10px",
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    display: "inline-block",
  };
  if (s === "Delivered") return { ...base, background: "#22C55E" };
  if (s === "Shipped")   return { ...base, background: "#0EA5E9" };
  if (s === "Approved")  return { ...base, background: "#10B981" };
  if (s === "Requested") return { ...base, background: "#F59E0B" };
  if (s === "Canceled")  return { ...base, background: "#EF4444" };
  return { ...base, background: "#94A3B8" };
};

const CertificateOrders = () => {
  const { setLoading } = useContext(GlobalContext);

  const [claims, setClaims] = useState([]);
  const [claimFilter, setClaimFilter] = useState("All");
  const [editClaim, setEditClaim] = useState(null);
  const [editClaimForm, setEditClaimForm] = useState({
    status: "Requested",
    trackingCode: "",
    trackingProvider: "",
    notes: "",
  });

  const loadClaims = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (claimFilter !== "All") params.set("status", claimFilter);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/gift-claims?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      const all = res?.data?.data?.claims || [];
      setClaims(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, [claimFilter]);

  const openClaimEditor = (claim) => {
    setEditClaim(claim);
    setEditClaimForm({
      status: claim.status || "Requested",
      trackingCode: claim.trackingCode || "",
      trackingProvider: claim.trackingProvider || "",
      notes: claim.notes || "",
    });
  };

  const closeClaimEditor = () => setEditClaim(null);

  const saveClaimEditor = async () => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/gift-claims/${editClaim._id}`,
        editClaimForm,
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
            "Content-Type": "application/json",
          },
        }
      );
      swal("Saved", "Claim updated", "success");
      closeClaimEditor();
      await loadClaims();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to update", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Reward Claims" />
      <div className="content-wrapper pt-5">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap" style={{ gap: 12 }}>
          <div>
            <p className="card-title p-0 m-0">Reward Claims</p>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Every reward redeemed from the Gifts catalog — certificates, stickers, merch, and more.
            </p>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex gap-3 flex-wrap">
              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-control text-capitalize"
                  style={{ minWidth: 160 }}
                  value={claimFilter}
                  onChange={(e) => setClaimFilter(e.target.value)}
                >
                  {CLAIM_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">Customer</th>
                    <th className="align-left">Reward</th>
                    <th className="align-left">Shipping</th>
                    <th className="align-left">Points / Paid</th>
                    <th className="align-left">Status</th>
                    <th className="align-left">Tracking</th>
                    <th className="align-left">Date</th>
                    <th className="align-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="align-center">
                        <p className="m-5 p-5 fs-4">No reward redemptions yet.</p>
                      </td>
                    </tr>
                  ) : (
                    claims.map((c) => (
                      <tr key={c._id}>
                        <td className="align-left">
                          <div className="fw-bold">
                            {c.user?.name || c.shippingAddress?.name || "—"}
                          </div>
                          <div className="text-muted small">{c.user?.email || ""}</div>
                          <div className="text-muted small">
                            {c.user?.phone
                              ? `+${c.user.phoneCode || ""} ${c.user.phone}`
                              : c.contactPhone || ""}
                          </div>
                        </td>
                        <td className="align-left">
                          <div className="fw-bold">{c.gift?.name || "—"}</div>
                          {c.gift?.category && (
                            <div className="text-muted small text-capitalize">
                              {c.gift.category}
                            </div>
                          )}
                        </td>
                        <td className="align-left" style={{ maxWidth: 240 }}>
                          <div>{c.shippingAddress?.line1}</div>
                          {c.shippingAddress?.line2 && <div>{c.shippingAddress.line2}</div>}
                          <div className="text-muted small">
                            {c.shippingAddress?.city}
                            {c.shippingAddress?.state ? `, ${c.shippingAddress.state}` : ""}
                            {c.shippingAddress?.pinCode ? ` — ${c.shippingAddress.pinCode}` : ""}
                          </div>
                        </td>
                        <td className="align-left">
                          <div>{c.pointsSpent ? `${c.pointsSpent} pts` : "—"}</div>
                          {c.amountPaid > 0 && (
                            <div className="text-muted small">₹{c.amountPaid} paid</div>
                          )}
                        </td>
                        <td className="align-left">
                          <span style={claimBadge(c.status)}>{c.status}</span>
                        </td>
                        <td className="align-left">
                          {c.trackingCode ? (
                            <div>
                              <div className="fw-bold">{c.trackingCode}</div>
                              {c.trackingProvider && (
                                <div className="text-muted small">{c.trackingProvider}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td className="align-left">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="align-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openClaimEditor(c)}
                          >
                            Manage
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
      </div>

      {/* ===== Claim editor modal ===== */}
      {editClaim && (
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
          onClick={closeClaimEditor}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 620,
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
              <h5 className="m-0">Update Reward Claim</h5>
              <button
                onClick={closeClaimEditor}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={editClaimForm.status}
                    onChange={(e) =>
                      setEditClaimForm({ ...editClaimForm, status: e.target.value })
                    }
                  >
                    {CLAIM_STATUSES.slice(1).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Courier Provider</label>
                  <input
                    className="form-control"
                    value={editClaimForm.trackingProvider}
                    onChange={(e) =>
                      setEditClaimForm({ ...editClaimForm, trackingProvider: e.target.value })
                    }
                    placeholder="Delhivery, Bluedart, India Post…"
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Tracking Code</label>
                  <input
                    className="form-control"
                    value={editClaimForm.trackingCode}
                    onChange={(e) =>
                      setEditClaimForm({ ...editClaimForm, trackingCode: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Internal Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editClaimForm.notes}
                    onChange={(e) =>
                      setEditClaimForm({ ...editClaimForm, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button className="btn btn-outline-secondary" onClick={closeClaimEditor}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={saveClaimEditor}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CertificateOrders;
