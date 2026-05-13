import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const AUDIENCES = [
  { value: "all",       label: "All users" },
  { value: "patient",   label: "Patients" },
  { value: "donor",     label: "Donors" },
  { value: "volunteer", label: "Volunteers" },
  { value: "staff",     label: "Staff" },
];

const PRIORITIES = ["low", "normal", "high", "urgent"];

const STATUS_COLORS = {
  draft:     "#6B7280",
  scheduled: "#0EA5E9",
  sending:   "#F59E0B",
  sent:      "#22C55E",
  cancelled: "#EF4444",
};

const statusBadge = (s) => ({
  padding: "3px 10px",
  borderRadius: 10,
  fontSize: 11,
  fontWeight: 700,
  color: "#fff",
  background: STATUS_COLORS[s] || "#94A3B8",
  textTransform: "capitalize",
  display: "inline-block",
});

const Reminders = () => {
  const { setLoading } = useContext(GlobalContext);
  const [tab, setTab] = useState("compose"); // compose | history | settings

  // ===== Compose (campaign form) =====
  const [form, setForm] = useState({
    title: "",
    message: "",
    audience: "all",
    bloodGroup: "",
    priority: "normal",
    scheduledAt: "",
    sendNow: true,
  });
  const [estimate, setEstimate] = useState(null);

  // ===== History =====
  const [campaigns, setCampaigns] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");

  // ===== Settings (per-audience reminder cadence) =====
  const [settings, setSettings] = useState({
    reminderPatientEnabled: true,
    reminderPatientDays: 30,
    reminderDonorEnabled: true,
    reminderDonorDays: 14,
    reminderVolunteerEnabled: true,
    reminderVolunteerDays: 21,
    reminderPatientMessage: "",
    reminderDonorMessage: "",
    reminderVolunteerMessage: "",
  });

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.set("status", statusFilter);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/reminder-campaigns?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setCampaigns(res?.data?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/settings`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      const s = res?.data?.data?.setting || {};
      setSettings({
        reminderPatientEnabled: s.reminderPatientEnabled !== false,
        reminderPatientDays: Number(s.reminderPatientDays) || 30,
        reminderDonorEnabled: s.reminderDonorEnabled !== false,
        reminderDonorDays: Number(s.reminderDonorDays) || 14,
        reminderVolunteerEnabled: s.reminderVolunteerEnabled !== false,
        reminderVolunteerDays: Number(s.reminderVolunteerDays) || 21,
        reminderPatientMessage: s.reminderPatientMessage || "",
        reminderDonorMessage: s.reminderDonorMessage || "",
        reminderVolunteerMessage: s.reminderVolunteerMessage || "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "history") loadCampaigns();
    if (tab === "settings") loadSettings();
  }, [tab, statusFilter]);

  // Audience estimate on every change
  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const params = new URLSearchParams();
        params.set("audience", form.audience);
        if (form.bloodGroup) params.set("bloodGroup", form.bloodGroup);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/reminder-campaigns/estimate?${params.toString()}`,
          { headers: { Authorization: sessionStorage.getItem("auth") } }
        );
        setEstimate(res?.data?.data?.count ?? null);
      } catch {
        setEstimate(null);
      }
    };
    if (tab === "compose") fetchEstimate();
  }, [tab, form.audience, form.bloodGroup]);

  const submitCampaign = async () => {
    if (!form.title.trim()) return swal("Error", "Title is required", "error");
    if (!form.message.trim()) return swal("Error", "Message is required", "error");
    try {
      setLoading(true);
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
        bloodGroup: form.bloodGroup,
        priority: form.priority,
        sendNow: !!form.sendNow,
        scheduledAt: form.sendNow ? null : form.scheduledAt || null,
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/reminder-campaigns`, payload, {
        headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
      });
      swal("Success", form.sendNow ? "Campaign queued for immediate send" : "Campaign scheduled", "success");
      setForm({ title: "", message: "", audience: "all", bloodGroup: "", priority: "normal", scheduledAt: "", sendNow: true });
      setTab("history");
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to create campaign", "error");
    } finally {
      setLoading(false);
    }
  };

  const sendNow = async (id) => {
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/reminder-campaigns/${id}/send-now`, {}, {
        headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
      });
      swal("Done", "Campaign queued", "success");
      await loadCampaigns();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed", "error");
    } finally { setLoading(false); }
  };

  const cancelCampaign = async (id) => {
    const ok = await swal({ title: "Cancel campaign?", icon: "warning", buttons: ["No", "Yes"], dangerMode: true });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/reminder-campaigns/${id}/cancel`, {}, {
        headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
      });
      await loadCampaigns();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed", "error");
    } finally { setLoading(false); }
  };

  const removeCampaign = async (id) => {
    const ok = await swal({ title: "Delete campaign?", icon: "warning", buttons: ["No", "Yes"], dangerMode: true });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/reminder-campaigns/${id}`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      await loadCampaigns();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed", "error");
    } finally { setLoading(false); }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/updatesetting`, settings, {
        headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
      });
      swal("Success", "Reminder settings saved", "success");
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save", "error");
    } finally { setLoading(false); }
  };

  const tabBtn = (key, label) => (
    <button
      key={key}
      className={`btn ${tab === key ? "btn-primary" : "btn-outline-secondary"}`}
      onClick={() => setTab(key)}
      style={{ marginRight: 8 }}
    >
      {label}
    </button>
  );

  return (
    <>
      <SEO title="Reminders & Campaigns" />
      <div className="content-wrapper pt-5">
        <div className="d-flex mb-3 justify-content-between align-items-center flex-wrap" style={{ gap: 12 }}>
          <p className="card-title p-0 m-0">Communication & Reminders</p>
          <div>
            {tabBtn("compose", "Compose Campaign")}
            {tabBtn("history", "History")}
            {tabBtn("settings", "Reminder Settings")}
          </div>
        </div>

        {/* ============== Compose ============== */}
        {tab === "compose" && (
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5>New Promotional Campaign</h5>
              <p className="small mb-0">Send a one-off nudge to a targeted audience.</p>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label">Title *</label>
                  <input
                    className="form-control"
                    maxLength={150}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Urgent: O+ donors needed this weekend"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-control text-capitalize"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="col-md-12">
                  <label className="form-label">Message *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    maxLength={500}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Use {{name}} or {{firstName}} for personalization."
                  />
                  <small className="text-muted">
                    Placeholders: <code>{`{{name}}`}</code> · <code>{`{{firstName}}`}</code>
                  </small>
                </div>

                <div className="col-md-4">
                  <label className="form-label">Audience</label>
                  <select
                    className="form-control"
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  >
                    {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Blood Group (optional narrowing)</label>
                  <input
                    className="form-control"
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    placeholder="e.g. O+, B-"
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <div className="text-muted">
                    Reach: <strong style={{ color: "#0EA5E9", fontSize: 18 }}>{estimate ?? "—"}</strong> user(s)
                  </div>
                </div>

                <div className="col-md-12">
                  <hr />
                </div>

                <div className="col-md-6">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="sendNowChk"
                      className="form-check-input"
                      checked={form.sendNow}
                      onChange={(e) => setForm({ ...form, sendNow: e.target.checked })}
                    />
                    <label htmlFor="sendNowChk" className="form-check-label">
                      <strong>Send immediately</strong>
                      <div className="text-muted small">Triggers the cron right away — users get notified within seconds.</div>
                    </label>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Or schedule for later</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value, sendNow: false })}
                    disabled={form.sendNow}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-primary" onClick={submitCampaign}>
                  {form.sendNow ? "Send Campaign" : "Schedule Campaign"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============== History ============== */}
        {tab === "history" && (
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Campaign History</h5>
              <select
                className="form-control"
                style={{ maxWidth: 200, color: "#111" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {["All", "draft", "scheduled", "sending", "sent", "cancelled"].map((s) =>
                  <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover-removed my-table">
                  <thead id="request-heading">
                    <tr>
                      <th className="align-left">Title</th>
                      <th className="align-left">Audience</th>
                      <th className="align-left">Priority</th>
                      <th className="align-left">Status</th>
                      <th className="align-left">Sent / Scheduled</th>
                      <th className="align-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.length === 0 ? (
                      <tr><td colSpan={6} className="align-center"><p className="m-5 p-5 fs-4">No campaigns yet.</p></td></tr>
                    ) : campaigns.map((c) => (
                      <tr key={c._id}>
                        <td className="align-left">
                          <div className="fw-bold">{c.title}</div>
                          <div className="text-muted small" style={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.message}
                          </div>
                        </td>
                        <td className="align-left text-capitalize">
                          {c.audience}{c.bloodGroup ? ` · ${c.bloodGroup}` : ""}
                        </td>
                        <td className="align-left text-capitalize">{c.priority}</td>
                        <td className="align-left">
                          <span style={statusBadge(c.status)}>{c.status}</span>
                          {c.status === "sent" && (
                            <div className="text-muted small">{c.sentCount} delivered</div>
                          )}
                        </td>
                        <td className="align-left">
                          {c.sentAt ? new Date(c.sentAt).toLocaleString() :
                            (c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : "—")}
                        </td>
                        <td className="align-center">
                          {["draft", "scheduled"].includes(c.status) && (
                            <button className="btn btn-sm btn-success me-2" onClick={() => sendNow(c._id)}>Send Now</button>
                          )}
                          {["draft", "scheduled"].includes(c.status) && (
                            <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => cancelCampaign(c._id)}>Cancel</button>
                          )}
                          {c.status !== "sending" && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeCampaign(c._id)}>Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============== Settings ============== */}
        {tab === "settings" && (
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5>Automatic Reminders — Cadence Per Audience</h5>
              <p className="small mb-0">
                The system sends these on a daily cron. A user only receives a reminder if their
                last reminder of the same audience is older than the interval below.
              </p>
            </div>
            <div className="card-body">
              {[
                { key: "Patient",   label: "Patients (post-crisis promotion)" },
                { key: "Donor",     label: "Donors (re-engagement)" },
                { key: "Volunteer", label: "Volunteers (tasks pending)" },
              ].map((row) => {
                const enabled = settings[`reminder${row.key}Enabled`];
                return (
                  <div key={row.key} className="mb-4 pb-3" style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <div className="row g-3 align-items-center">
                      <div className="col-md-4">
                        <div className="fw-bold">{row.label}</div>
                      </div>
                      <div className="col-md-2">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`enabled-${row.key}`}
                            checked={enabled}
                            onChange={(e) => setSettings({ ...settings, [`reminder${row.key}Enabled`]: e.target.checked })}
                          />
                          <label className="form-check-label" htmlFor={`enabled-${row.key}`}>Enabled</label>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small mb-1">Interval (days)</label>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          className="form-control"
                          value={settings[`reminder${row.key}Days`]}
                          onChange={(e) => setSettings({ ...settings, [`reminder${row.key}Days`]: Number(e.target.value) || 1 })}
                          disabled={!enabled}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="form-label small mb-1">Message Template</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={settings[`reminder${row.key}Message`]}
                        onChange={(e) => setSettings({ ...settings, [`reminder${row.key}Message`]: e.target.value })}
                        disabled={!enabled}
                      />
                      <small className="text-muted">Placeholders: <code>{`{{name}}`}</code> · <code>{`{{firstName}}`}</code></small>
                    </div>
                  </div>
                );
              })}

              <div className="d-flex justify-content-end">
                <button className="btn btn-primary" onClick={saveSettings}>Save Settings</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Reminders;
