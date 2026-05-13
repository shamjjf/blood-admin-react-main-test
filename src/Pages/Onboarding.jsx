import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const emptyForm = {
  _id: null,
  title: "",
  summary: "",
  body: "",
  videoUrl: "",
  order: 0,
  active: true,
};

const Onboarding = () => {
  const { setLoading } = useContext(GlobalContext);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/onboarding`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      setItems(res?.data?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(false);
  };

  const handleEdit = (m) => {
    setForm({
      _id: m._id,
      title: m.title || "",
      summary: m.summary || "",
      body: m.body || "",
      videoUrl: m.videoUrl || "",
      order: m.order ?? 0,
      active: !!m.active,
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.title.trim()) return swal("Error", "Title is required", "error");
    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      body: form.body,
      videoUrl: form.videoUrl.trim(),
      order: Number(form.order) || 0,
      active: !!form.active,
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/onboarding/${form._id}`, payload, {
          headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
        });
        swal("Success", "Module updated", "success");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/onboarding`, payload, {
          headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
        });
        swal("Success", "Module created", "success");
      }
      resetForm();
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save module", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await swal({
      title: "Delete module?",
      text: "This cannot be undone.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/onboarding/${id}`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      swal("Deleted", "Module removed", "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (m) => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/onboarding/${m._id}`,
        { active: !m.active },
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
      <SEO title="Volunteer 101" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-3">Volunteer 101 — Onboarding Modules</p>

        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5>{editing ? "Edit Module" : "Create Module"}</h5>
            <p className="small mb-0">
              Modules appear to volunteers in the client app's "Learning Hub" section, sorted by Order.
            </p>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">Title *</label>
                <input
                  className="form-control"
                  value={form.title}
                  maxLength={120}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="How blood donation works"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Order</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </div>
              <div className="col-md-2 d-flex align-items-center">
                <div className="form-check mt-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="moduleActive"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="moduleActive">Active</label>
                </div>
              </div>
              <div className="col-md-12">
                <label className="form-label">Summary</label>
                <input
                  className="form-control"
                  value={form.summary}
                  maxLength={300}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="One-line description shown on the module card"
                />
              </div>
              <div className="col-md-12">
                <label className="form-label">Video URL (YouTube / Vimeo embed)</label>
                <input
                  className="form-control"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/embed/xxxx"
                />
              </div>
              <div className="col-md-12">
                <label className="form-label">Body</label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Full content of the module. Use blank lines to separate paragraphs."
                />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              {editing && (
                <button className="btn btn-outline-secondary" onClick={resetForm}>Cancel</button>
              )}
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? "Update Module" : "Create Module"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              <div className="table-responsive">
                <table className="table table-hover-removed my-table">
                  <thead id="request-heading">
                    <tr>
                      <th className="align-left">Order</th>
                      <th className="align-left">Title</th>
                      <th className="align-left">Summary</th>
                      <th className="align-left">Video</th>
                      <th className="align-left">Status</th>
                      <th className="align-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="align-center">
                          <p className="m-5 p-5 fs-4">No modules yet — create one above.</p>
                        </td>
                      </tr>
                    ) : (
                      items.map((m) => (
                        <tr key={m._id}>
                          <td className="align-left">{m.order}</td>
                          <td className="align-left fw-bold">{m.title}</td>
                          <td className="align-left">{m.summary || <em className="text-muted">—</em>}</td>
                          <td className="align-left">
                            {m.videoUrl ? (
                              <a href={m.videoUrl} target="_blank" rel="noopener noreferrer">Open</a>
                            ) : (
                              <em className="text-muted">—</em>
                            )}
                          </td>
                          <td className="align-left">
                            <span style={{
                              padding: "3px 10px",
                              borderRadius: 10,
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#FFFFFF",
                              background: m.active ? "#22C55E" : "#6B7280",
                            }}>
                              {m.active ? "Active" : "Hidden"}
                            </span>
                          </td>
                          <td className="align-center">
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(m)}>Edit</button>
                            <button
                              className={`btn btn-sm me-2 ${m.active ? "btn-outline-secondary" : "btn-outline-success"}`}
                              onClick={() => toggleActive(m)}
                            >
                              {m.active ? "Hide" : "Show"}
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(m._id)}>Delete</button>
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

export default Onboarding;
