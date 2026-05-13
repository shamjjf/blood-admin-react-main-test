import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const ORG_TYPES = ["NGO", "Company", "University", "School", "Hospital", "Government", "Other"];

const emptyForm = {
  _id: null,
  name: "",
  type: "NGO",
  description: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  website: "",
  partnershipSince: "",
  partnershipNotes: "",
  active: true,
};

const Organizations = () => {
  const { setLoading } = useContext(GlobalContext);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchText, setSearchText] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "All") params.set("type", typeFilter);
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
  }, [typeFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(false);
  };

  const handleEdit = (o) => {
    setForm({
      _id: o._id,
      name: o.name || "",
      type: o.type || "NGO",
      description: o.description || "",
      contactName: o.contactName || "",
      contactEmail: o.contactEmail || "",
      contactPhone: o.contactPhone || "",
      address: o.address || "",
      website: o.website || "",
      partnershipSince: o.partnershipSince ? new Date(o.partnershipSince).toISOString().slice(0, 10) : "",
      partnershipNotes: o.partnershipNotes || "",
      active: !!o.active,
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return swal("Error", "Name is required", "error");
    const payload = {
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim(),
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      address: form.address.trim(),
      website: form.website.trim(),
      partnershipSince: form.partnershipSince || null,
      partnershipNotes: form.partnershipNotes.trim(),
      active: !!form.active,
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/organizations/${form._id}`, payload, {
          headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
        });
        swal("Success", "Organization updated", "success");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/organizations`, payload, {
          headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
        });
        swal("Success", "Organization added", "success");
      }
      resetForm();
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

  const toggleActive = async (o) => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/organizations/${o._id}`,
        { active: !o.active },
        { headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" } }
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
      <SEO title="Organizations" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-3">Organizations & Partners</p>

        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5>{editing ? "Edit Organization" : "Add Organization"}</h5>
            <p className="small mb-0">
              Partner NGOs, companies, universities and other orgs you collaborate with on blood camps.
            </p>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Name *</label>
                <input className="form-control" maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Type *</label>
                <select className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-center">
                <div className="form-check mt-3">
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
                <input className="form-control" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Contact Name</label>
                <input className="form-control" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Contact Email</label>
                <input className="form-control" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Contact Phone</label>
                <input className="form-control" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              </div>
              <div className="col-md-8">
                <label className="form-label">Address</label>
                <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Website</label>
                <input className="form-control" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Partnership Since</label>
                <input type="date" className="form-control" value={form.partnershipSince} onChange={(e) => setForm({ ...form, partnershipSince: e.target.value })} />
              </div>
              <div className="col-md-8">
                <label className="form-label">Partnership Notes</label>
                <input className="form-control" value={form.partnershipNotes} onChange={(e) => setForm({ ...form, partnershipNotes: e.target.value })} />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              {editing && <button className="btn btn-outline-secondary" onClick={resetForm}>Cancel</button>}
              <button className="btn btn-primary" onClick={handleSave}>{editing ? "Update" : "Add Organization"}</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              <div className="d-flex gap-3 mb-3 flex-wrap">
                <select className="form-control" style={{ maxWidth: 200 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="All">All Types</option>
                  {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
                      <th className="align-left">Type</th>
                      <th className="align-left">Contact</th>
                      <th className="align-left">Status</th>
                      <th className="align-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="align-center">
                          <p className="m-5 p-5 fs-4">No organizations yet — add one above.</p>
                        </td>
                      </tr>
                    ) : items.map((o) => (
                      <tr key={o._id}>
                        <td className="align-left">
                          <div className="fw-bold">{o.name}</div>
                          {o.description && <div className="text-muted small">{o.description}</div>}
                        </td>
                        <td className="align-left">{o.type}</td>
                        <td className="align-left">
                          {o.contactName && <div>{o.contactName}</div>}
                          {o.contactEmail && <div className="text-muted small">{o.contactEmail}</div>}
                          {o.contactPhone && <div className="text-muted small">{o.contactPhone}</div>}
                        </td>
                        <td className="align-left">
                          <span style={{
                            padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                            color: "#FFFFFF", background: o.active ? "#22C55E" : "#6B7280",
                          }}>
                            {o.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="align-center">
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(o)}>Edit</button>
                          <button
                            className={`btn btn-sm me-2 ${o.active ? "btn-outline-secondary" : "btn-outline-success"}`}
                            onClick={() => toggleActive(o)}
                          >
                            {o.active ? "Disable" : "Enable"}
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(o._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
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

export default Organizations;
