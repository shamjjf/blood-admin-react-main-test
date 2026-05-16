import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const CATEGORIES = ["sticker", "bag", "gift", "merchandise", "other"];

const emptyForm = {
  _id: null,
  name: "",
  category: "sticker",
  description: "",
  unitCost: 0,
  stockOnHand: 0,
  reorderAt: -1,
  active: true,
};

const Inventory = () => {
  const { setLoading } = useContext(GlobalContext);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchText, setSearchText] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== "All") params.set("category", categoryFilter);
      if (searchText) params.set("searchText", searchText);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/contribution-items?${params.toString()}`,
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
  }, [categoryFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(false);
  };

  const handleEdit = (it) => {
    setForm({
      _id: it._id,
      name: it.name || "",
      category: it.category || "other",
      description: it.description || "",
      unitCost: it.unitCost ?? 0,
      stockOnHand: it.stockOnHand ?? 0,
      reorderAt: it.reorderAt ?? -1,
      active: !!it.active,
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return swal("Error", "Name is required", "error");
    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      unitCost: Math.max(0, Number(form.unitCost) || 0),
      stockOnHand: Math.max(0, Number(form.stockOnHand) || 0),
      reorderAt: Number(form.reorderAt),
      active: !!form.active,
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/contribution-items/${form._id}`, payload, {
          headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
        });
        swal("Success", "Item updated", "success");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/contribution-items`, payload, {
          headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
        });
        swal("Success", "Item added", "success");
      }
      resetForm();
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save item", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await swal({
      title: "Delete item?",
      text: "This cannot be undone.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/contribution-items/${id}`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      swal("Deleted", "Item removed", "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (it) => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/contribution-items/${it._id}`,
        { active: !it.active },
        { headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" } }
      );
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to toggle", "error");
    } finally {
      setLoading(false);
    }
  };

  const lowStock = (it) =>
    it.reorderAt >= 0 && it.stockOnHand <= it.reorderAt;

  return (
    <>
      <SEO title="Donation Inventory" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-3">In-Kind Donation Inventory</p>

        {/* ===== Add / Edit form ===== */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5>{editing ? "Edit Item" : "Add Item"}</h5>
            <p className="small mb-0">
              Master catalog of in-kind donation items (stickers, bags, gifts, merchandise).
            </p>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Name *</label>
                <input
                  className="form-control"
                  maxLength={80}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="LSA branded sticker"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Category</label>
                <select
                  className="form-control text-capitalize"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-center">
                <div className="form-check mt-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="itemActive"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="itemActive">Active</label>
                </div>
              </div>
              <div className="col-md-12">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  maxLength={300}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Unit Cost (₹)</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={form.unitCost}
                  onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Stock On Hand</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={form.stockOnHand}
                  onChange={(e) => setForm({ ...form, stockOnHand: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Reorder At</label>
                <input
                  type="number"
                  min={-1}
                  className="form-control"
                  value={form.reorderAt}
                  onChange={(e) => setForm({ ...form, reorderAt: e.target.value })}
                />
                <small className="text-muted">Set -1 to disable low-stock alert.</small>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              {editing && <button className="btn btn-outline-secondary" onClick={resetForm}>Cancel</button>}
              <button className="btn btn-primary" onClick={handleSave}>{editing ? "Update Item" : "Add Item"}</button>
            </div>
          </div>
        </div>

        {/* ===== List ===== */}
        <div className="card">
          <div className="card-body">
            <div className="d-flex gap-3 mb-3 flex-wrap">
              <select
                className="form-control text-capitalize"
                style={{ maxWidth: 200 }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                className="form-control"
                style={{ maxWidth: 280 }}
                placeholder="Search by name…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") load(); }}
              />
              <button className="btn btn-outline-primary" onClick={load}>Search</button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">Name</th>
                    <th className="align-left">Category</th>
                    <th className="align-left">Unit Cost</th>
                    <th className="align-left">Stock</th>
                    <th className="align-left">Status</th>
                    <th className="align-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="align-center"><p className="m-5 p-5 fs-4">No items yet — add one above.</p></td></tr>
                  ) : items.map((it) => (
                    <tr key={it._id}>
                      <td className="align-left">
                        <div className="fw-bold">{it.name}</div>
                        {it.description && <div className="text-muted small">{it.description}</div>}
                      </td>
                      <td className="align-left text-capitalize">{it.category}</td>
                      <td className="align-left">₹{it.unitCost}</td>
                      <td className="align-left">
                        <span style={{
                          padding: "3px 10px",
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                          background: lowStock(it) ? "#DC2626" : "#22C55E",
                        }}>
                          {it.stockOnHand}{lowStock(it) ? " · LOW" : ""}
                        </span>
                      </td>
                      <td className="align-left">
                        <span style={{
                          padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                          color: "#fff", background: it.active ? "#22C55E" : "#6B7280",
                        }}>
                          {it.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="align-center">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(it)}>Edit</button>
                        <button
                          className={`btn btn-sm me-2 ${it.active ? "btn-outline-secondary" : "btn-outline-success"}`}
                          onClick={() => toggleActive(it)}
                        >
                          {it.active ? "Disable" : "Enable"}
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(it._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Inventory;
