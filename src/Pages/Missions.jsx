import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";
import Tabs from "../Components/Tabs";

// Admin management of mission templates — the pool the rotating daily/weekly
// missions are drawn from.

const ACTIONS = [
  { value: "donate", label: "Donate blood" },
  { value: "volunteer_task", label: "Complete a volunteer task" },
  { value: "refer", label: "Refer / invite a donor" },
  { value: "join_drive", label: "Join a donation drive" },
  { value: "share", label: "Share (request/drive)" },
  { value: "daily_login", label: "Daily check-in" },
];

const blankForm = {
  _id: null,
  title: "",
  description: "",
  action: "share",
  target: 1,
  cadence: "daily",
  xp: 10,
  points: 0,
  icon: "🎯",
  active: true,
  sort: 0,
};

const CHECKBOX_STYLE = { width: 16, height: 16, margin: 0, flexShrink: 0, accentColor: "#C0392B", cursor: "pointer" };

const Missions = () => {
  const { setLoading } = useContext(GlobalContext);
  const [cadence, setCadence] = useState("daily");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankForm);

  const apiUrl = import.meta.env.VITE_API_URL;
  const authHeader = { Authorization: sessionStorage.getItem("auth") };

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/mission-templates?cadence=${cadence}`, { headers: authHeader });
      setItems(res?.data?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cadence]);

  const edit = (row) => {
    setForm({
      _id: row._id,
      title: row.title || "",
      description: row.description || "",
      action: row.action || "share",
      target: row.target || 1,
      cadence: row.cadence || "daily",
      xp: row.xp || 0,
      points: row.points || 0,
      icon: row.icon || "🎯",
      active: row.active !== false,
      sort: row.sort || 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (!form.title.trim()) return swal("Error", "Title is required", "error");
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      action: form.action,
      target: Math.max(1, Number(form.target) || 1),
      cadence: form.cadence,
      xp: Number(form.xp) || 0,
      points: Number(form.points) || 0,
      icon: form.icon || "🎯",
      active: form.active,
      sort: Number(form.sort) || 0,
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(`${apiUrl}/mission-templates/${form._id}`, payload, { headers: { ...authHeader, "Content-Type": "application/json" } });
      } else {
        await axios.post(`${apiUrl}/mission-templates`, payload, { headers: { ...authHeader, "Content-Type": "application/json" } });
      }
      swal("Success", form._id ? "Mission updated" : "Mission added", "success");
      setForm({ ...blankForm, cadence });
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    const ok = await swal({ title: "Delete mission?", icon: "warning", buttons: ["No", "Yes"], dangerMode: true });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`${apiUrl}/mission-templates/${id}`, { headers: authHeader });
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Missions" />
      <div className="content-wrapper pt-5">
        <div className="d-flex mb-3 justify-content-between align-items-center flex-wrap" style={{ gap: 12 }}>
          <p className="card-title p-0 m-0">Daily &amp; Weekly Missions</p>
        </div>

        <Tabs
          variant="pill"
          accent="#c0392b"
          active={cadence}
          onChange={(k) => { setCadence(k); setForm({ ...blankForm, cadence: k }); }}
          tabs={{ daily: { label: "Daily", render: "" }, weekly: { label: "Weekly", render: "" } }}
        />

        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">{form._id ? "Edit Mission" : "Add Mission"}</h5>
            <p className="small mb-0">The live line-up rotates through active missions of each cadence.</p>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-5">
                <label className="form-label">Title *</label>
                <input className="form-control" maxLength={80} value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Refer a donor" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Action</label>
                <select className="form-control" value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value })}>
                  {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Cadence</label>
                <select className="form-control" value={form.cadence}
                  onChange={(e) => setForm({ ...form, cadence: e.target.value })}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="col-md-12">
                <label className="form-label">Description</label>
                <input className="form-control" maxLength={200} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short instruction shown to the user" />
              </div>
              <div className="col-md-2">
                <label className="form-label">Target count</label>
                <input type="number" min={1} className="form-control" value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })} />
              </div>
              <div className="col-md-2">
                <label className="form-label">XP</label>
                <input type="number" className="form-control" value={form.xp}
                  onChange={(e) => setForm({ ...form, xp: e.target.value })} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Points</label>
                <input type="number" className="form-control" value={form.points}
                  onChange={(e) => setForm({ ...form, points: e.target.value })} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Icon</label>
                <input className="form-control" maxLength={4} value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <label htmlFor="mActive" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
                  <input type="checkbox" id="mActive" checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })} style={CHECKBOX_STYLE} />
                  Active
                </label>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-3" style={{ gap: 8 }}>
              {form._id && <button className="btn btn-outline-secondary" onClick={() => setForm({ ...blankForm, cadence })}>Cancel</button>}
              <button className="btn btn-primary" onClick={save}>{form._id ? "Update Mission" : "Add Mission"}</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0 text-capitalize">{cadence} Missions</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">Mission</th>
                    <th className="align-left">Action</th>
                    <th className="align-left">Target</th>
                    <th className="align-left">Reward</th>
                    <th className="align-left">Active</th>
                    <th className="align-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="align-center"><p className="m-5 p-5 fs-4">No missions yet.</p></td></tr>
                  ) : items.map((m) => (
                    <tr key={m._id}>
                      <td className="align-left">
                        <strong>{m.icon} {m.title}</strong>
                        <div className="text-muted small" style={{ maxWidth: 280 }}>{m.description}</div>
                      </td>
                      <td className="align-left">{m.action}</td>
                      <td className="align-left">{m.target}</td>
                      <td className="align-left small">{m.xp ? `${m.xp} XP` : ""}{m.xp && m.points ? " · " : ""}{m.points ? `${m.points} pts` : ""}</td>
                      <td className="align-left">
                        <span style={{ padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#fff", background: m.active ? "#22C55E" : "#94A3B8" }}>
                          {m.active ? "Active" : "Off"}
                        </span>
                      </td>
                      <td className="align-center">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => edit(m)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => remove(m._id)}>Delete</button>
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

export default Missions;
