import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const CRITERIA_KINDS = [
  { value: "manual", label: "Manual (admin-awarded only)" },
  { value: "donations_count", label: "Donations count" },
  { value: "points_total", label: "Points total" },
  { value: "referrals_count", label: "Referrals count" },
];

const emptyForm = {
  _id: null,
  name: "",
  description: "",
  icon: "🏅",
  criteriaKind: "manual",
  criteriaThreshold: 0,
  active: true,
};

const Badges = () => {
  const { setLoading } = useContext(GlobalContext);
  const [badges, setBadges] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/badges`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      setBadges(res?.data?.data?.badges || []);
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

  const handleEdit = (b) => {
    setForm({
      _id: b._id,
      name: b.name || "",
      description: b.description || "",
      icon: b.icon || "🏅",
      criteriaKind: b.criteria?.kind || "manual",
      criteriaThreshold: b.criteria?.threshold ?? 0,
      active: !!b.active,
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return swal("Error", "Badge name is required", "error");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      icon: form.icon.trim() || "🏅",
      criteria: {
        kind: form.criteriaKind,
        threshold:
          form.criteriaKind === "manual" ? 0 : Math.max(0, Number(form.criteriaThreshold) || 0),
      },
      active: !!form.active,
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/badges/${form._id}`, payload, {
          headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
        });
        swal("Success", "Badge updated", "success");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/badges`, payload, {
          headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
        });
        swal("Success", "Badge created", "success");
      }
      resetForm();
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save badge", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await swal({
      title: "Delete badge?",
      text: "Users who earned this badge will lose it. This cannot be undone.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!confirm) return;
    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/badges/${id}`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      swal("Deleted", "Badge removed", "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to delete badge", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (b) => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/badges/${b._id}`,
        { active: !b.active },
        { headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" } }
      );
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to toggle badge", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Badges" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-3">Badges & Achievements</p>

        {/* ===== Form ===== */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5>{editing ? "Edit Badge" : "Create Badge"}</h5>
            <p className="small mb-0">
              Define a badge and the criteria that auto-awards it. Use "Manual" if the badge
              can only be granted by an admin from the user details page.
            </p>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-2">
                <label className="form-label">Icon (emoji)</label>
                <input
                  className="form-control text-center"
                  style={{ fontSize: 22 }}
                  value={form.icon}
                  maxLength={4}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label">Name *</label>
                <input
                  className="form-control"
                  value={form.name}
                  maxLength={60}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="First Drop, Century Donor, Top Referrer…"
                />
              </div>
              <div className="col-md-5">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  value={form.description}
                  maxLength={240}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Shown to the user when they earn the badge"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Criteria</label>
                <select
                  className="form-control"
                  value={form.criteriaKind}
                  onChange={(e) => setForm({ ...form, criteriaKind: e.target.value })}
                >
                  {CRITERIA_KINDS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Threshold</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={form.criteriaThreshold}
                  disabled={form.criteriaKind === "manual"}
                  onChange={(e) => setForm({ ...form, criteriaThreshold: e.target.value })}
                />
                <small className="text-muted">
                  {form.criteriaKind === "manual"
                    ? "Not used for manual badges"
                    : `User reaches this value of ${form.criteriaKind} → badge awarded`}
                </small>
              </div>
              <div className="col-md-4 d-flex align-items-center">
                <div className="form-check mt-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="badgeActive"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="badgeActive">Active</label>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              {editing && (
                <button className="btn btn-outline-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? "Update Badge" : "Create Badge"}
              </button>
            </div>
          </div>
        </div>

        {/* ===== List ===== */}
        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              <div className="table-responsive">
                <table className="table table-hover-removed my-table">
                  <thead id="request-heading">
                    <tr>
                      <th className="align-left">Icon</th>
                      <th className="align-left">Name</th>
                      <th className="align-left">Description</th>
                      <th className="align-left">Criteria</th>
                      <th className="align-left">Status</th>
                      <th className="align-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {badges.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="align-center">
                          <p className="m-5 p-5 fs-4">No badges yet — create one above.</p>
                        </td>
                      </tr>
                    ) : (
                      badges.map((b) => (
                        <tr key={b._id}>
                          <td className="align-left" style={{ fontSize: 22 }}>{b.icon || "🏅"}</td>
                          <td className="align-left fw-bold">{b.name}</td>
                          <td className="align-left">{b.description || <em className="text-muted">—</em>}</td>
                          <td className="align-left">
                            {b.criteria?.kind === "manual"
                              ? "Manual"
                              : `${b.criteria?.kind?.replace("_", " ")} ≥ ${b.criteria?.threshold}`}
                          </td>
                          <td className="align-left">
                            <span style={{
                              padding: "3px 10px",
                              borderRadius: 10,
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#FFFFFF",
                              background: b.active ? "#22C55E" : "#6B7280",
                            }}>
                              {b.active ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td className="align-center">
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(b)}>
                              Edit
                            </button>
                            <button
                              className={`btn btn-sm me-2 ${b.active ? "btn-outline-secondary" : "btn-outline-success"}`}
                              onClick={() => handleToggleActive(b)}
                            >
                              {b.active ? "Disable" : "Enable"}
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(b._id)}>
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

export default Badges;
