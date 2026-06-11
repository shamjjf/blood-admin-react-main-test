import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";
import Tabs from "../Components/Tabs";

// Admin management of the Lucky Spin reward pool (wheel segments). Two wheels:
// "regular" (daily/earned) and "golden" (premium, post-donation).

const TYPES = [
  { value: "points", label: "Reward Points" },
  { value: "xp", label: "XP" },
  { value: "spin", label: "Extra Spin(s)" },
  { value: "badge", label: "Badge" },
  { value: "sticker", label: "Sticker" },
  { value: "frame", label: "Profile Frame" },
  { value: "healthTip", label: "Health Tip" },
];

const blankForm = {
  _id: null,
  label: "",
  type: "points",
  value: 10,
  weight: 10,
  icon: "🎁",
  color: "#e74c3c",
  tier: "regular",
  assetId: "",
  tip: "",
  active: true,
  sort: 0,
};

const CHECKBOX_STYLE = {
  width: 16,
  height: 16,
  margin: 0,
  flexShrink: 0,
  accentColor: "#C0392B",
  cursor: "pointer",
};

const SpinRewards = () => {
  const { setLoading } = useContext(GlobalContext);
  const [tierFilter, setTierFilter] = useState("regular");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankForm);

  const apiUrl = import.meta.env.VITE_API_URL;
  const authHeader = { Authorization: sessionStorage.getItem("auth") };

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/spin-rewards?tier=${tierFilter}`, {
        headers: authHeader,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierFilter]);

  const edit = (row) => {
    setForm({
      _id: row._id,
      label: row.label || "",
      type: row.type || "points",
      value: row.value || 0,
      weight: row.weight ?? 10,
      icon: row.icon || "🎁",
      color: row.color || "#e74c3c",
      tier: row.tier || "regular",
      assetId: row.assetId || "",
      tip: row.tip || "",
      active: row.active !== false,
      sort: row.sort || 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (!form.label.trim()) return swal("Error", "Label is required", "error");
    const payload = {
      label: form.label.trim(),
      type: form.type,
      value: Number(form.value) || 0,
      weight: Number(form.weight) || 0,
      icon: form.icon || "🎁",
      color: form.color || "#e74c3c",
      tier: form.tier,
      assetId: form.assetId.trim() || null,
      tip: form.tip.trim() || null,
      active: form.active,
      sort: Number(form.sort) || 0,
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(`${apiUrl}/spin-rewards/${form._id}`, payload, {
          headers: { ...authHeader, "Content-Type": "application/json" },
        });
      } else {
        await axios.post(`${apiUrl}/spin-rewards`, payload, {
          headers: { ...authHeader, "Content-Type": "application/json" },
        });
      }
      swal("Success", form._id ? "Reward updated" : "Reward added", "success");
      setForm({ ...blankForm, tier: tierFilter });
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    const ok = await swal({ title: "Delete reward?", icon: "warning", buttons: ["No", "Yes"], dangerMode: true });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`${apiUrl}/spin-rewards/${id}`, { headers: authHeader });
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const needsValue = ["points", "xp", "spin"].includes(form.type);
  const needsAsset = ["sticker", "frame"].includes(form.type);
  const needsTip = form.type === "healthTip";

  return (
    <>
      <SEO title="Lucky Spin Rewards" />
      <div className="content-wrapper pt-5">
        <div className="d-flex mb-3 justify-content-between align-items-center flex-wrap" style={{ gap: 12 }}>
          <p className="card-title p-0 m-0">Lucky Spin — Reward Pool</p>
        </div>

        <Tabs
          variant="pill"
          accent="#c0392b"
          active={tierFilter}
          onChange={(k) => {
            setTierFilter(k);
            setForm({ ...blankForm, tier: k });
          }}
          tabs={{
            regular: { label: "Regular Wheel", render: "" },
            golden: { label: "🌟 Golden Wheel", render: "" },
          }}
        />

        {/* Add / Edit form */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">{form._id ? "Edit Reward" : "Add Reward"}</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Label *</label>
                <input className="form-control" maxLength={40} value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. 25 Points" />
              </div>
              <div className="col-md-3">
                <label className="form-label">Type</label>
                <select className="form-control" value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {needsValue && (
                <div className="col-md-2">
                  <label className="form-label">Amount</label>
                  <input type="number" className="form-control" value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })} />
                </div>
              )}
              {needsAsset && (
                <div className="col-md-3">
                  <label className="form-label">Asset key</label>
                  <input className="form-control" value={form.assetId}
                    onChange={(e) => setForm({ ...form, assetId: e.target.value })} placeholder="e.g. lifesaver-gold" />
                </div>
              )}
              {needsTip && (
                <div className="col-md-5">
                  <label className="form-label">Tip text</label>
                  <input className="form-control" value={form.tip}
                    onChange={(e) => setForm({ ...form, tip: e.target.value })} placeholder="Health tip shown to the user" />
                </div>
              )}
              <div className="col-md-2">
                <label className="form-label">Weight</label>
                <input type="number" className="form-control" value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                <small className="text-muted">Higher = more likely</small>
              </div>
              <div className="col-md-2">
                <label className="form-label">Icon (emoji)</label>
                <input className="form-control" maxLength={4} value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Color</label>
                <input type="color" className="form-control form-control-color" value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ height: 40 }} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Wheel</label>
                <select className="form-control" value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                  <option value="regular">Regular</option>
                  <option value="golden">Golden</option>
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <label htmlFor="activeChk" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
                  <input type="checkbox" id="activeChk" checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })} style={CHECKBOX_STYLE} />
                  Active
                </label>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-3" style={{ gap: 8 }}>
              {form._id && (
                <button className="btn btn-outline-secondary" onClick={() => setForm({ ...blankForm, tier: tierFilter })}>Cancel</button>
              )}
              <button className="btn btn-primary" onClick={save}>{form._id ? "Update Reward" : "Add Reward"}</button>
            </div>
          </div>
        </div>

        {/* Pool table */}
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0 text-capitalize">{tierFilter} Wheel Segments</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">Reward</th>
                    <th className="align-left">Type</th>
                    <th className="align-left">Value</th>
                    <th className="align-left">Weight</th>
                    <th className="align-left">Active</th>
                    <th className="align-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="align-center"><p className="m-5 p-5 fs-4">No rewards yet.</p></td></tr>
                  ) : items.map((r) => (
                    <tr key={r._id}>
                      <td className="align-left">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 26, height: 26, borderRadius: 6, background: r.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{r.icon}</span>
                          <strong>{r.label}</strong>
                        </span>
                      </td>
                      <td className="align-left text-capitalize">{r.type}</td>
                      <td className="align-left">{["points", "xp", "spin"].includes(r.type) ? r.value : (r.assetId || r.tip || "—")}</td>
                      <td className="align-left">{r.weight}</td>
                      <td className="align-left">
                        <span style={{ padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#fff", background: r.active ? "#22C55E" : "#94A3B8" }}>
                          {r.active ? "Active" : "Off"}
                        </span>
                      </td>
                      <td className="align-center">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => edit(r)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => remove(r._id)}>Delete</button>
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

export default SpinRewards;
