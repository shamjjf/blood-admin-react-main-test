import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const CATEGORIES = ["onboarding", "operations", "outreach", "emergency"];

const emptyForm = {
  _id: null,
  title: "",
  summary: "",
  estimatedMinutes: 5,
  order: 0,
  category: "onboarding",
  active: true,
  sections: [{ heading: "", body: "" }],
};

const TrainingModules = () => {
  const { setLoading } = useContext(GlobalContext);
  const [modules, setModules] = useState([]);
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
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/training-modules${qs}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setModules(res?.data?.data?.modules || []);
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

  const handleEdit = (m) => {
    setForm({
      _id: m._id,
      title: m.title || "",
      summary: m.summary || "",
      estimatedMinutes: m.estimatedMinutes ?? 5,
      order: m.order ?? 0,
      category: m.category || "onboarding",
      active: !!m.active,
      sections:
        Array.isArray(m.sections) && m.sections.length > 0
          ? m.sections.map((s) => ({
              heading: s.heading || "",
              body: s.body || "",
            }))
          : [{ heading: "", body: "" }],
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addSection = () => {
    setForm({
      ...form,
      sections: [...form.sections, { heading: "", body: "" }],
    });
  };

  const updateSection = (idx, key, value) => {
    setForm({
      ...form,
      sections: form.sections.map((s, i) => (i === idx ? { ...s, [key]: value } : s)),
    });
  };

  const removeSection = (idx) => {
    if (form.sections.length === 1) {
      // Keep at least one row; just clear it.
      setForm({ ...form, sections: [{ heading: "", body: "" }] });
      return;
    }
    setForm({
      ...form,
      sections: form.sections.filter((_, i) => i !== idx),
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) return swal("Error", "Title is required", "error");
    const minutes = Number(form.estimatedMinutes);
    const ord = Number(form.order);
    if (!Number.isFinite(minutes) || minutes < 1)
      return swal("Error", "Estimated minutes must be at least 1", "error");

    const sections = form.sections
      .map((s) => ({
        heading: (s.heading || "").trim(),
        body: s.body || "",
      }))
      .filter((s) => s.heading || s.body);

    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      estimatedMinutes: minutes,
      order: Number.isFinite(ord) ? ord : 0,
      category: form.category,
      active: !!form.active,
      sections,
    };

    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/training-modules/${form._id}`,
          payload,
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
              "Content-Type": "application/json",
            },
          }
        );
        swal("Success", "Training module updated", "success");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/training-modules`,
          payload,
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
              "Content-Type": "application/json",
            },
          }
        );
        swal("Success", "Training module created", "success");
      }
      resetForm();
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save module", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (m) => {
    const completionNote =
      m.completionCount > 0
        ? `\n\n⚠️ ${m.completionCount} user(s) have completed this. It will be hidden (not deleted) so progress stays intact.`
        : "";
    const ok = await swal({
      title: `Delete "${m.title}"?`,
      text: `This cannot be undone.${completionNote}`,
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/training-modules/${m._id}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      swal("Done", res?.data?.data?.message || "Module removed", "success");
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
        `${import.meta.env.VITE_API_URL}/training-modules/${m._id}`,
        { active: !m.active },
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
      <SEO title="Training Modules" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-3">Training Modules</p>

        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5>{editing ? "Edit Module" : "Create Module"}</h5>
            <p className="small mb-0">
              Modules appear in the user app&apos;s Training page, sorted by{" "}
              <strong>Order</strong>. Each module has multiple sections (heading + body).
            </p>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Title *</label>
                <input
                  className="form-control"
                  value={form.title}
                  maxLength={120}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="How blood donation saves lives"
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
              <div className="col-md-2">
                <label className="form-label">Est. minutes</label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={form.estimatedMinutes}
                  onChange={(e) =>
                    setForm({ ...form, estimatedMinutes: e.target.value })
                  }
                />
              </div>
              <div className="col-md-1">
                <label className="form-label">Order</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </div>
              <div className="col-md-1 d-flex align-items-end">
                <div className="form-check mb-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="trModActive"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
                    }
                  />
                  <label className="form-check-label" htmlFor="trModActive">
                    Active
                  </label>
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
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label m-0">
                    Sections ({form.sections.length})
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={addSection}
                  >
                    + Add Section
                  </button>
                </div>
                {form.sections.map((s, idx) => (
                  <div
                    key={idx}
                    className="border rounded p-3 mb-2"
                    style={{ background: "#f9fafb" }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <strong className="text-muted">Section {idx + 1}</strong>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeSection(idx)}
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      className="form-control mb-2"
                      placeholder="Heading"
                      value={s.heading}
                      maxLength={120}
                      onChange={(e) =>
                        updateSection(idx, "heading", e.target.value)
                      }
                    />
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Body — use blank lines to separate paragraphs."
                      value={s.body}
                      onChange={(e) => updateSection(idx, "body", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
              {editing && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? "Update Module" : "Create Module"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex flex-wrap gap-2 align-items-center">
            <strong className="me-auto">All Modules ({modules.length})</strong>
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
                      <th className="align-left">Order</th>
                      <th className="align-left">Title</th>
                      <th className="align-left">Category</th>
                      <th className="align-left">Sections</th>
                      <th className="align-left">Minutes</th>
                      <th className="align-left">Completions</th>
                      <th className="align-left">Status</th>
                      <th className="align-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="align-center">
                          <p className="m-5 p-5 fs-4">
                            No modules yet — create one above.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      modules.map((m) => (
                        <tr key={m._id}>
                          <td className="align-left">{m.order}</td>
                          <td className="align-left">
                            <div className="fw-bold">{m.title}</div>
                            {m.summary ? (
                              <small className="text-muted">{m.summary}</small>
                            ) : null}
                          </td>
                          <td className="align-left">{m.category}</td>
                          <td className="align-left">{m.sectionCount ?? 0}</td>
                          <td className="align-left">{m.estimatedMinutes}</td>
                          <td className="align-left">{m.completionCount ?? 0}</td>
                          <td className="align-left">
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#FFFFFF",
                                background: m.active ? "#22C55E" : "#6B7280",
                              }}
                            >
                              {m.active ? "Active" : "Hidden"}
                            </span>
                          </td>
                          <td className="align-center">
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleEdit(m)}
                            >
                              Edit
                            </button>
                            <button
                              className={`btn btn-sm me-2 ${
                                m.active
                                  ? "btn-outline-secondary"
                                  : "btn-outline-success"
                              }`}
                              onClick={() => toggleActive(m)}
                            >
                              {m.active ? "Hide" : "Show"}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(m)}
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

export default TrainingModules;
