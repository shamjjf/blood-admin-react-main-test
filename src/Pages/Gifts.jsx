import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const CATEGORIES = [
  "merch",
  "merchandise",
  "certificate",
  "sticker",
  "bag",
  "gift",
  "other",
];

const emptyForm = {
  _id: null,
  name: "",
  description: "",
  imageUrl: "",
  pointCost: 0,
  priceInr: 0,
  stock: -1,
  unitCost: 0,
  reorderAt: -1,
  category: "merch",
  active: true,
};

const formatInr = (n) =>
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const Gifts = () => {
  const { setLoading } = useContext(GlobalContext);
  const [gifts, setGifts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterActive, setFilterActive] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory) params.append("category", filterCategory);
      if (filterActive) params.append("active", filterActive);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/gifts${qs}`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      setGifts(res?.data?.data?.gifts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterActive]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(false);
  };

  const handleEdit = (g) => {
    setForm({
      _id: g._id,
      name: g.name || "",
      description: g.description || "",
      imageUrl: g.imageUrl || "",
      pointCost: g.pointCost ?? 0,
      priceInr: g.priceInr ?? 0,
      stock: g.stock ?? -1,
      unitCost: g.unitCost ?? 0,
      reorderAt: g.reorderAt ?? -1,
      category: g.category || "merch",
      active: !!g.active,
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return swal("Error", "Gift name is required", "error");
    const pc = Number(form.pointCost);
    const pi = Number(form.priceInr);
    const stk = form.stock === "" ? -1 : Number(form.stock);
    const uc = form.unitCost === "" ? 0 : Number(form.unitCost);
    const ra = form.reorderAt === "" ? -1 : Number(form.reorderAt);
    if (!Number.isFinite(pc) || pc < 0)
      return swal("Error", "Point cost must be a non-negative number", "error");
    if (!Number.isFinite(pi) || pi < 0)
      return swal("Error", "Price (INR) must be a non-negative number", "error");
    if (!Number.isFinite(stk))
      return swal("Error", "Stock must be a number (use -1 for unlimited)", "error");
    if (!Number.isFinite(uc) || uc < 0)
      return swal("Error", "Unit cost must be a non-negative number", "error");
    if (!Number.isFinite(ra) || ra < -1)
      return swal("Error", "Reorder threshold must be -1 (disabled) or a non-negative number", "error");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      pointCost: pc,
      priceInr: pi,
      stock: stk,
      unitCost: uc,
      reorderAt: ra,
      category: form.category,
      active: !!form.active,
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/gifts/${form._id}`,
          payload,
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
              "Content-Type": "application/json",
            },
          }
        );
        swal("Success", "Gift updated", "success");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/gifts`, payload, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
            "Content-Type": "application/json",
          },
        });
        swal("Success", "Gift created", "success");
      }
      resetForm();
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save gift", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (g) => {
    const claimNote =
      g.claimCount > 0
        ? `\n\n⚠️ This gift has ${g.claimCount} claim record(s). It will be hidden (not deleted) so receipts stay intact.`
        : "";
    const ok = await swal({
      title: `Delete "${g.name}"?`,
      text: `This cannot be undone.${claimNote}`,
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/gifts/${g._id}`,
        {
          headers: { Authorization: sessionStorage.getItem("auth") },
        }
      );
      swal("Done", res?.data?.data?.message || "Gift removed", "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (g) => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/gifts/${g._id}`,
        { active: !g.active },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
            "Content-Type": "application/json",
          },
        }
      );
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to toggle", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Gifts & Inventory" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-3">Gifts, Rewards & Inventory Catalog</p>

        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5>{editing ? "Edit Gift" : "Create Gift"}</h5>
            <p className="small mb-0">
              Gifts appear in the user app&apos;s Rewards page. Set <strong>pointCost</strong> for
              points-based redemption and <strong>priceInr</strong> for paid items (courier, etc.).
              Use stock <code>-1</code> for unlimited.
            </p>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">Name *</label>
                <input
                  className="form-control"
                  value={form.name}
                  maxLength={120}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Branded T-Shirt"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-center">
                <div className="form-check mt-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="giftActive"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="giftActive">
                    Active
                  </label>
                </div>
              </div>

              <div className="col-md-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.description}
                  maxLength={500}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="One-line summary shown on the gift card"
                />
              </div>

              <div className="col-md-12">
                <label className="form-label">Image URL</label>
                <input
                  className="form-control"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://cdn.example.com/gifts/tshirt.png"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Point Cost</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={form.pointCost}
                  onChange={(e) => setForm({ ...form, pointCost: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Price (INR)</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={form.priceInr}
                  onChange={(e) => setForm({ ...form, priceInr: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Stock (-1 = unlimited)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>

              <div
                className="col-12 mt-2"
                style={{
                  borderTop: "1px dashed #d1d5db",
                  paddingTop: 14,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#6b7280",
                    marginBottom: 8,
                  }}
                >
                  <i className="ti ti-package me-1"></i>
                  INVENTORY TRACKING (admin-only — not shown to users)
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label">Unit cost to source (INR)</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={form.unitCost}
                  onChange={(e) =>
                    setForm({ ...form, unitCost: e.target.value })
                  }
                  placeholder="Procurement cost per unit"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Reorder at (-1 = disable alert)
                </label>
                <input
                  type="number"
                  min={-1}
                  className="form-control"
                  value={form.reorderAt}
                  onChange={(e) =>
                    setForm({ ...form, reorderAt: e.target.value })
                  }
                  placeholder="Warn when stock drops to this level"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
              {editing && (
                <button className="btn btn-outline-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? "Update Gift" : "Create Gift"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex flex-wrap gap-2 align-items-center">
            <strong className="me-auto">All Gifts ({gifts.length})</strong>
            <select
              className="form-select form-select-sm"
              style={{ maxWidth: 180 }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="form-select form-select-sm"
              style={{ maxWidth: 140 }}
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
            >
              <option value="">All status</option>
              <option value="true">Active only</option>
              <option value="false">Hidden only</option>
            </select>
          </div>
          <div className="card-body">
            <div className="table-card-border">
              <div className="table-responsive">
                <table className="table table-hover-removed my-table">
                  <thead id="request-heading">
                    <tr>
                      <th className="align-left">Name</th>
                      <th className="align-left">Category</th>
                      <th className="align-left">Points</th>
                      <th className="align-left">INR</th>
                      <th className="align-left">Stock</th>
                      <th className="align-left">Claims</th>
                      <th className="align-left">Status</th>
                      <th className="align-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gifts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="align-center">
                          <p className="m-5 p-5 fs-4">
                            No gifts yet — create one above.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      gifts.map((g) => (
                        <tr key={g._id}>
                          <td className="align-left">
                            <div className="fw-bold">{g.name}</div>
                            {g.description ? (
                              <small className="text-muted">{g.description}</small>
                            ) : null}
                          </td>
                          <td className="align-left">{g.category}</td>
                          <td className="align-left">{g.pointCost}</td>
                          <td className="align-left">
                            {g.priceInr > 0 ? `₹${formatInr(g.priceInr)}` : <em className="text-muted">free</em>}
                          </td>
                          <td className="align-left">
                            {g.stock === -1 ? (
                              <em className="text-muted">unlimited</em>
                            ) : (
                              <>
                                {g.stock}
                                {g.reorderAt !== undefined &&
                                  g.reorderAt >= 0 &&
                                  g.stock <= g.reorderAt && (
                                    <span
                                      className="ms-2"
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 10,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: "#FFFFFF",
                                        background: "#dc2626",
                                      }}
                                      title={`Reorder threshold: ${g.reorderAt}`}
                                    >
                                      LOW
                                    </span>
                                  )}
                              </>
                            )}
                          </td>
                          <td className="align-left">{g.claimCount ?? 0}</td>
                          <td className="align-left">
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#FFFFFF",
                                background: g.active ? "#22C55E" : "#6B7280",
                              }}
                            >
                              {g.active ? "Active" : "Hidden"}
                            </span>
                          </td>
                          <td className="align-center">
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleEdit(g)}
                            >
                              Edit
                            </button>
                            <button
                              className={`btn btn-sm me-2 ${
                                g.active ? "btn-outline-secondary" : "btn-outline-success"
                              }`}
                              onClick={() => toggleActive(g)}
                            >
                              {g.active ? "Hide" : "Show"}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(g)}
                            >
                              Delete
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
      </div>
    </>
  );
};

export default Gifts;
