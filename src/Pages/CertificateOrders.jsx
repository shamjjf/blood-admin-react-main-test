import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const PAY_STATUSES = ["All", "pending", "paid", "failed", "refunded"];
const FUL_STATUSES = ["All", "new", "in_progress", "dispatched", "delivered", "cancelled"];

const payBadge = (s) => {
  const base = { padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#fff", display: "inline-block" };
  if (s === "paid") return { ...base, background: "#22C55E" };
  if (s === "pending") return { ...base, background: "#F59E0B" };
  if (s === "failed") return { ...base, background: "#EF4444" };
  if (s === "refunded") return { ...base, background: "#6B7280" };
  return { ...base, background: "#94A3B8" };
};

const fulBadge = (s) => {
  const base = { padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#fff", display: "inline-block" };
  if (s === "delivered") return { ...base, background: "#22C55E" };
  if (s === "dispatched") return { ...base, background: "#0EA5E9" };
  if (s === "in_progress") return { ...base, background: "#F59E0B" };
  if (s === "cancelled") return { ...base, background: "#EF4444" };
  if (s === "new") return { ...base, background: "#94A3B8" };
  return { ...base, background: "#94A3B8" };
};

const CertificateOrders = () => {
  const { setLoading } = useContext(GlobalContext);
  const [orders, setOrders] = useState([]);
  const [payFilter, setPayFilter] = useState("All");
  const [fulFilter, setFulFilter] = useState("All");
  const [editOrder, setEditOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    paymentStatus: "pending",
    paymentRef: "",
    fulfillmentStatus: "new",
    trackingId: "",
    courierProvider: "",
    notes: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (payFilter !== "All") params.set("paymentStatus", payFilter);
      if (fulFilter !== "All") params.set("fulfillmentStatus", fulFilter);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/certificate-orders?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setOrders(res?.data?.data?.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [payFilter, fulFilter]);

  const openEditor = (order) => {
    setEditOrder(order);
    setEditForm({
      paymentStatus: order.paymentStatus || "pending",
      paymentRef: order.paymentRef || "",
      fulfillmentStatus: order.fulfillmentStatus || "new",
      trackingId: order.trackingId || "",
      courierProvider: order.courierProvider || "",
      notes: order.notes || "",
    });
  };

  const closeEditor = () => {
    setEditOrder(null);
  };

  const saveEditor = async () => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/certificate-orders/${editOrder._id}`,
        editForm,
        { headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" } }
      );
      swal("Saved", "Order updated", "success");
      closeEditor();
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to update", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Certificate Orders" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-3">Printed Certificate Orders</p>

        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex gap-3 flex-wrap">
              <div>
                <label className="form-label">Payment</label>
                <select
                  className="form-control text-capitalize"
                  style={{ minWidth: 160 }}
                  value={payFilter}
                  onChange={(e) => setPayFilter(e.target.value)}
                >
                  {PAY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Fulfillment</label>
                <select
                  className="form-control text-capitalize"
                  style={{ minWidth: 160 }}
                  value={fulFilter}
                  onChange={(e) => setFulFilter(e.target.value)}
                >
                  {FUL_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
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
                    <th className="align-left">Shipping</th>
                    <th className="align-left">Charge</th>
                    <th className="align-left">Payment</th>
                    <th className="align-left">Fulfillment</th>
                    <th className="align-left">Tracking</th>
                    <th className="align-left">Date</th>
                    <th className="align-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={8} className="align-center"><p className="m-5 p-5 fs-4">No orders yet.</p></td></tr>
                  ) : orders.map((o) => (
                    <tr key={o._id}>
                      <td className="align-left">
                        <div className="fw-bold">{o.user?.name || o.shippingAddress?.name || "—"}</div>
                        <div className="text-muted small">{o.user?.email || ""}</div>
                        <div className="text-muted small">
                          {o.user?.phone ? `+${o.user.phoneCode || ""} ${o.user.phone}` : (o.shippingAddress?.phone || "")}
                        </div>
                      </td>
                      <td className="align-left" style={{ maxWidth: 240 }}>
                        <div>{o.shippingAddress?.line1}</div>
                        {o.shippingAddress?.line2 && <div>{o.shippingAddress.line2}</div>}
                        <div className="text-muted small">
                          {o.shippingAddress?.city}{o.shippingAddress?.state ? `, ${o.shippingAddress.state}` : ""}
                          {o.shippingAddress?.pinCode ? ` — ${o.shippingAddress.pinCode}` : ""}
                        </div>
                      </td>
                      <td className="align-left">₹{o.courierCharge}</td>
                      <td className="align-left">
                        <span style={payBadge(o.paymentStatus)}>{o.paymentStatus}</span>
                      </td>
                      <td className="align-left">
                        <span style={fulBadge(o.fulfillmentStatus)}>{o.fulfillmentStatus?.replace("_", " ")}</span>
                      </td>
                      <td className="align-left">
                        {o.trackingId ? (
                          <div>
                            <div className="fw-bold">{o.trackingId}</div>
                            {o.courierProvider && <div className="text-muted small">{o.courierProvider}</div>}
                          </div>
                        ) : <span className="text-muted small">—</span>}
                      </td>
                      <td className="align-left">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="align-center">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEditor(o)}>
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Editor modal ===== */}
      {editOrder && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={closeEditor}
        >
          <div
            style={{
              background: "#fff", borderRadius: 12, width: "100%", maxWidth: 620,
              maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: "16px 20px", background: "#C0392B", color: "#fff",
              borderTopLeftRadius: 12, borderTopRightRadius: 12,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <h5 className="m-0">Update Order</h5>
              <button onClick={closeEditor} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Payment Status</label>
                  <select
                    className="form-control text-capitalize"
                    value={editForm.paymentStatus}
                    onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                  >
                    {PAY_STATUSES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Payment Reference</label>
                  <input
                    className="form-control"
                    value={editForm.paymentRef}
                    onChange={(e) => setEditForm({ ...editForm, paymentRef: e.target.value })}
                    placeholder="Razorpay ID, UPI ref, etc."
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Fulfillment Status</label>
                  <select
                    className="form-control text-capitalize"
                    value={editForm.fulfillmentStatus}
                    onChange={(e) => setEditForm({ ...editForm, fulfillmentStatus: e.target.value })}
                  >
                    {FUL_STATUSES.slice(1).map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Courier Provider</label>
                  <input
                    className="form-control"
                    value={editForm.courierProvider}
                    onChange={(e) => setEditForm({ ...editForm, courierProvider: e.target.value })}
                    placeholder="Delhivery, Bluedart, India Post…"
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Tracking ID</label>
                  <input
                    className="form-control"
                    value={editForm.trackingId}
                    onChange={(e) => setEditForm({ ...editForm, trackingId: e.target.value })}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Internal Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button className="btn btn-outline-secondary" onClick={closeEditor}>Cancel</button>
                <button className="btn btn-primary" onClick={saveEditor}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CertificateOrders;
