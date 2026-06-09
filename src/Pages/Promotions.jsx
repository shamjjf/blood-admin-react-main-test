import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";
import Tabs from "../Components/Tabs";

// Advertisement-style promo campaigns: broadcast Donation Drives / Blood Camps /
// Events / Announcements to members (dashboard banner + inbox + optional
// email/push). Mirrors the Reminders page patterns. Drives/Camps also create
// these automatically on approval; this page is for hand-authored promos.

const CATEGORIES = [
  { value: "donation_drive", label: "🩸 Donation Drive" },
  { value: "blood_camp", label: "⛺ Blood Camp" },
  { value: "event", label: "📅 Event" },
  { value: "announcement", label: "📢 Announcement" },
];
const PRIORITIES = ["low", "normal", "high", "urgent"];

// Visual treatment per category. All categories use the brand red — only the
// icon differentiates them.
const RED_GRAD = "linear-gradient(135deg, #9C0C0D, #FD292F)";
const CATEGORY_META = {
  donation_drive: { label: "Donation Drive", icon: "🩸", grad: RED_GRAD },
  blood_camp: { label: "Blood Camp", icon: "⛺", grad: RED_GRAD },
  event: { label: "Event", icon: "📅", grad: RED_GRAD },
  announcement: { label: "Announcement", icon: "📢", grad: RED_GRAD },
};

// Plain checkbox styling. We deliberately avoid the `.form-check-input` class:
// the admin template forces it to `position:absolute; margin-left:-1.25rem`,
// which yanks the box out of flow and pushes it outside its container border.
const CHECKBOX_STYLE = {
  width: 16,
  height: 16,
  margin: 0,
  flexShrink: 0,
  accentColor: "#C0392B",
  cursor: "pointer",
};

// Small uppercase section heading used to group the compose form.
const SectionLabel = ({ children }) => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: "#9CA3AF",
      margin: "4px 0 10px",
    }}
  >
    {children}
  </div>
);

const STATUS_COLORS = {
  draft: "#6B7280",
  scheduled: "#0EA5E9",
  active: "#22C55E",
  archived: "#94A3B8",
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

const blankForm = {
  category: "announcement",
  title: "",
  body: "",
  image: null, // FileObject _id
  imageUrl: "", // preview
  ctaLabel: "Learn more",
  ctaLink: "",
  priority: "normal",
  channels: { inApp: true, email: false, push: false },
  sendNow: true,
  startAt: "",
  endAt: "",
};

const Promotions = () => {
  const { setLoading } = useContext(GlobalContext);
  const [tab, setTab] = useState("compose"); // compose | history
  const [form, setForm] = useState(blankForm);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");

  const apiUrl = import.meta.env.VITE_API_URL; // .../api/admin
  // /upload-test lives at the API root, not under /admin.
  const apiRoot = apiUrl.replace(/\/admin$/, "");
  const authHeader = { Authorization: sessionStorage.getItem("auth") };

  const loadItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.set("status", statusFilter);
      const res = await axios.get(`${apiUrl}/promotions?${params.toString()}`, {
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
    if (tab === "history") loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, statusFilter]);

  // Presigned-S3 upload (same flow the rest of the app uses).
  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      return swal("Error", "Please choose an image file", "error");
    }
    if (file.size > 5 * 1024 * 1024) {
      return swal("Error", "Image must be under 5MB", "error");
    }
    try {
      setUploading(true);
      const { name, size, type } = file;
      const res = await axios.post(
        `${apiRoot}/upload-test`,
        { name, size, mime: type },
        { headers: { "content-type": "application/json" } }
      );
      const { data } = res;
      const fd = new FormData();
      for (const [k, v] of Object.entries(data.data.fields)) fd.append(k, v);
      fd.append("file", file);
      const s3 = await fetch(data.data.url, { method: "POST", body: fd });
      if (!s3.ok) throw new Error("S3 upload failed");
      setForm((f) => ({ ...f, image: data.data._id, imageUrl: data.url }));
    } catch (err) {
      console.error(err);
      swal("Error", "Failed to upload image", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async () => {
    if (!form.title.trim()) return swal("Error", "Title is required", "error");
    if (!form.body.trim()) return swal("Error", "Message body is required", "error");
    if (!form.channels.inApp && !form.channels.email && !form.channels.push)
      return swal("Error", "Pick at least one delivery channel", "error");
    try {
      setLoading(true);
      const payload = {
        category: form.category,
        title: form.title.trim(),
        body: form.body.trim(),
        image: form.image || null,
        ctaLabel: form.ctaLabel.trim() || "Learn more",
        ctaLink: form.ctaLink.trim() || null,
        priority: form.priority,
        channels: form.channels,
        sendNow: !!form.sendNow,
        startAt: form.sendNow ? null : form.startAt || null,
        endAt: form.endAt || null,
      };
      await axios.post(`${apiUrl}/promotions`, payload, {
        headers: { ...authHeader, "Content-Type": "application/json" },
      });
      swal(
        "Success",
        form.sendNow ? "Campaign is broadcasting" : "Campaign scheduled",
        "success"
      );
      setForm(blankForm);
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
      await axios.post(`${apiUrl}/promotions/${id}/send-now`, {}, {
        headers: { ...authHeader, "Content-Type": "application/json" },
      });
      swal("Done", "Campaign is broadcasting now", "success");
      await loadItems();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const archive = async (id) => {
    const ok = await swal({
      title: "Archive campaign?",
      text: "It will stop showing on the member banner.",
      icon: "warning",
      buttons: ["No", "Yes"],
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.post(`${apiUrl}/promotions/${id}/archive`, {}, {
        headers: { ...authHeader, "Content-Type": "application/json" },
      });
      await loadItems();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    const ok = await swal({
      title: "Delete campaign?",
      icon: "warning",
      buttons: ["No", "Yes"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`${apiUrl}/promotions/${id}`, { headers: authHeader });
      await loadItems();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const setCh = (k, v) =>
    setForm((f) => ({ ...f, channels: { ...f.channels, [k]: v } }));

  const channelChips = (c) =>
    [
      c?.inApp && "In-app",
      c?.email && "Email",
      c?.push && "Push",
    ]
      .filter(Boolean)
      .join(" · ") || "—";

  return (
    <>
      <SEO title="Promotions" />
      <div className="content-wrapper pt-5">
        <div
          className="d-flex mb-3 justify-content-between align-items-center flex-wrap"
          style={{ gap: 12 }}
        >
          <p className="card-title p-0 m-0">Campaign &amp; Event Notifications</p>
        </div>
        <Tabs
          variant="pill"
          accent="#c0392b"
          active={tab}
          onChange={setTab}
          tabs={{
            compose: { label: "Compose", render: "" },
            history: { label: "All Campaigns", render: "" },
          }}
        />

        {/* ============== Compose ============== */}
        {tab === "compose" && (() => {
          const meta = CATEGORY_META[form.category] || CATEGORY_META.announcement;
          return (
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">New Promotion</h5>
                <p className="small mb-0">
                  Broadcast a drive, camp, event, or announcement to all members —
                  shown as a dashboard banner and in their notifications.
                </p>
              </div>
              <div className="card-body">
                {/* ---------- Category chips ---------- */}
                <SectionLabel>Category</SectionLabel>
                {/* Red pill tabs, same style as the Requests blood/platelet tabs. */}
                <Tabs
                  variant="pill"
                  accent="#c0392b"
                  active={form.category}
                  onChange={(cat) => setForm({ ...form, category: cat })}
                  tabs={CATEGORIES.reduce((acc, c) => {
                    acc[c.value] = {
                      label: `${CATEGORY_META[c.value].icon} ${CATEGORY_META[c.value].label}`,
                      render: "",
                    };
                    return acc;
                  }, {})}
                />

                {/* ---------- Live preview (full width) ---------- */}
                <SectionLabel>Live Preview — member dashboard</SectionLabel>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    background: meta.grad,
                    color: "#fff",
                    borderRadius: 14,
                    padding: "18px 20px",
                    marginBottom: 24,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                  }}
                >
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt=""
                      style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255,255,255,0.6)" }}
                    />
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: "rgba(255,255,255,0.18)" }}>
                      {meta.icon}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.9 }}>
                      {meta.icon} {meta.label}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>
                      {form.title || "Your campaign title"}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.92, marginTop: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {form.body || "Your ad copy will appear here as members see it."}
                    </div>
                  </div>
                  {form.ctaLink && (
                    <span style={{ flexShrink: 0, background: "#fff", color: "#111", borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {form.ctaLabel || "Learn more"} →
                    </span>
                  )}
                </div>

                {/* ---------- Content ---------- */}
                <SectionLabel>Content</SectionLabel>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Title *</label>
                    <input
                      className="form-control"
                      maxLength={150}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Mega Blood Drive this Saturday!"
                    />
                    <small className="text-muted">{form.title.length}/150</small>
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
                      rows={3}
                      maxLength={500}
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      placeholder="Short, punchy ad copy that appears on the banner and notification."
                    />
                    <small className="text-muted">{form.body.length}/500</small>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Banner Image (optional)</label>
                    <input type="file" accept="image/*" className="form-control" onChange={uploadImage} disabled={uploading} />
                    {uploading && <small className="text-muted d-block mt-1">Uploading…</small>}
                    {form.imageUrl && (
                      <div className="d-flex align-items-center mt-2" style={{ gap: 8 }}>
                        <img src={form.imageUrl} alt="" style={{ height: 40, borderRadius: 6 }} />
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setForm({ ...form, image: null, imageUrl: "" })}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <hr className="my-4" />

                {/* ---------- Call to action ---------- */}
                <SectionLabel>Call To Action</SectionLabel>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Button Label</label>
                    <input
                      className="form-control"
                      maxLength={40}
                      value={form.ctaLabel}
                      onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
                      placeholder="e.g. Join now"
                    />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Link</label>
                    <input
                      className="form-control"
                      value={form.ctaLink}
                      onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                      placeholder="/donation-drives  or  https://…"
                    />
                    <small className="text-muted">In-app path (e.g. <code>/camps</code>) or full URL.</small>
                  </div>
                </div>

                <hr className="my-4" />

                {/* ---------- Delivery channels (full-width 3-col) ---------- */}
                <SectionLabel>Delivery Channels</SectionLabel>
                <div className="row g-3">
                  {[
                    { k: "inApp", label: "In-app", hint: "Dashboard banner + notification inbox" },
                    { k: "email", label: "Email blast", hint: "Promo email to every member" },
                    { k: "push", label: "Push notification", hint: "Mobile push to opted-in devices" },
                  ].map((ch) => (
                    <div className="col-md-4" key={ch.k}>
                      <label
                        htmlFor={`ch-${ch.k}`}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: "12px 14px",
                          height: "100%",
                          border: `1.5px solid ${form.channels[ch.k] ? "#C0392B" : "#E5E7EB"}`,
                          borderRadius: 10,
                          marginBottom: 0,
                          cursor: "pointer",
                          background: form.channels[ch.k] ? "rgba(192,57,43,0.04)" : "#fff",
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`ch-${ch.k}`}
                          checked={form.channels[ch.k]}
                          onChange={(e) => setCh(ch.k, e.target.checked)}
                          style={{ ...CHECKBOX_STYLE, marginTop: 2 }}
                        />
                        <span style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{ch.label}</span>
                          <span className="d-block text-muted" style={{ fontSize: 11.5 }}>{ch.hint}</span>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>

                <hr className="my-4" />

                {/* ---------- Schedule (full-width 3-col) ---------- */}
                <SectionLabel>Schedule</SectionLabel>
                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label
                      htmlFor="sendNowChk"
                      style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 0, minHeight: 44 }}
                    >
                      <input
                        type="checkbox"
                        id="sendNowChk"
                        checked={form.sendNow}
                        onChange={(e) => setForm({ ...form, sendNow: e.target.checked })}
                        style={CHECKBOX_STYLE}
                      />
                      <strong>Broadcast immediately</strong>
                    </label>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Or start at</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={form.startAt}
                      onChange={(e) => setForm({ ...form, startAt: e.target.value, sendNow: false })}
                      disabled={form.sendNow}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">End at (optional)</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={form.endAt}
                      onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                    />
                    <small className="text-muted">Banner hides after this; inbox copies expire too.</small>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button
                    className="btn btn-primary"
                    onClick={submit}
                    disabled={uploading}
                    style={{ minWidth: 220 }}
                  >
                    {form.sendNow ? "🚀 Broadcast Campaign" : "📅 Schedule Campaign"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ============== History ============== */}
        {tab === "history" && (
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center" style={{ gap: 12, flexWrap: "wrap" }}>
              <h5 className="mb-0">All Campaigns</h5>
              <select
                className="form-control"
                style={{ maxWidth: 200, color: "#111" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {["All", "draft", "scheduled", "active", "archived"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover-removed my-table">
                  <thead id="request-heading">
                    <tr>
                      <th className="align-left">Campaign</th>
                      <th className="align-left">Category</th>
                      <th className="align-left">Channels</th>
                      <th className="align-left">Status</th>
                      <th className="align-left">Reach / Clicks</th>
                      <th className="align-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={6} className="align-center"><p className="m-5 p-5 fs-4">No campaigns yet.</p></td></tr>
                    ) : items.map((c) => (
                      <tr key={c._id}>
                        <td className="align-left">
                          <div className="d-flex align-items-center" style={{ gap: 8 }}>
                            {c.image?.url && (
                              <img src={c.image.url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />
                            )}
                            <div>
                              <div className="fw-bold">{c.title}</div>
                              <div className="text-muted small" style={{ maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {c.body}
                              </div>
                              {c.source === "auto" && (
                                <span className="badge bg-info text-dark">auto</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="align-left text-capitalize">{(c.category || "").replace("_", " ")}</td>
                        <td className="align-left small">{channelChips(c.channels)}</td>
                        <td className="align-left">
                          <span style={statusBadge(c.status)}>{c.status}</span>
                        </td>
                        <td className="align-left small">
                          {c.stats?.recipients || 0} reached<br />
                          {c.stats?.clicks || 0} clicks · {c.stats?.impressions || 0} views
                        </td>
                        <td className="align-center">
                          {!c.dispatchedAt && (
                            <button className="btn btn-sm btn-success me-2" onClick={() => sendNow(c._id)}>Send Now</button>
                          )}
                          {c.status === "active" && (
                            <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => archive(c._id)}>Archive</button>
                          )}
                          <button className="btn btn-sm btn-outline-danger" onClick={() => remove(c._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Promotions;
