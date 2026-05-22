/**
 * Admin → Operations → Influencer review.
 *
 *   Two top-level sections:
 *     1. Profiles — list Influencer applications with status sub-tabs
 *        (Pending / Approved / Rejected) and approve/reject flow.
 *     2. Awareness Posts — admin-side composer + manager for posts that
 *        run under the influencer programme. Posts are dummy/client-side
 *        for now; backend will follow.
 */
import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const TABS = [
  { key: "pending", label: "Pending review", color: "#F59E0B" },
  { key: "approved", label: "Approved", color: "#22C55E" },
  { key: "rejected", label: "Rejected", color: "#EF4444" },
];

const TOP_TABS = [
  { key: "profiles", label: "Profiles", icon: "ti ti-users" },
  { key: "posts", label: "Awareness Posts", icon: "ti ti-news" },
];

const PLATFORM_META = {
  instagram: { label: "Instagram", icon: "ti ti-brand-instagram", color: "#E1306C" },
  youtube: { label: "YouTube", icon: "ti ti-brand-youtube", color: "#FF0000" },
  twitter: { label: "Twitter / X", icon: "ti ti-brand-twitter", color: "#1DA1F2" },
  facebook: { label: "Facebook", icon: "ti ti-brand-facebook", color: "#1877F2" },
  linkedin: { label: "LinkedIn", icon: "ti ti-brand-linkedin", color: "#0A66C2" },
  threads: { label: "Threads", icon: "ti ti-brand-threads", color: "#000000" },
  other: { label: "Other", icon: "ti ti-link", color: "#6B7280" },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "—");

const Influencer = () => {
  const { setLoading } = useContext(GlobalContext);
  const [topTab, setTopTab] = useState("profiles");
  const [activeTab, setActiveTab] = useState("pending");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [expanded, setExpanded] = useState({}); // influencerId -> bool
  const [blockDraft, setBlockDraft] = useState({}); // influencerId -> reason
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("status", activeTab);
      if (search.trim()) params.append("search", search.trim());
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/influencers?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setRows(res?.data?.data?.influencers || []);
      setCounts(
        res?.data?.data?.counts || { pending: 0, approved: 0, rejected: 0 }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const review = async (inf, decision) => {
    const reason = (blockDraft[inf._id] || "").trim();
    if (decision === "rejected" && !reason) {
      return swal(
        "Reason required",
        "Tell the influencer why their profile was rejected.",
        "warning"
      );
    }
    const ok = await swal({
      title:
        decision === "approved"
          ? `Approve ${inf.user?.name || "this influencer"}?`
          : `Reject ${inf.user?.name || "this influencer"}?`,
      text:
        decision === "approved"
          ? "They'll appear on the public influencer leaderboard and receive a confirmation notification."
          : `They'll receive a notification with this reason:\n\n${reason}`,
      icon: decision === "approved" ? "success" : "warning",
      buttons: ["Cancel", decision === "approved" ? "Approve" : "Reject"],
      dangerMode: decision === "rejected",
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/influencers/${inf._id}/review`,
        {
          decision,
          rejectedReason: reason,
        },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
            "Content-Type": "application/json",
          },
        }
      );
      swal(
        "Done",
        decision === "approved"
          ? "Influencer approved"
          : "Influencer rejected",
        "success"
      );
      setBlockDraft((d) => {
        const copy = { ...d };
        delete copy[inf._id];
        return copy;
      });
      await load();
    } catch (err) {
      swal(
        "Error",
        err?.response?.data?.error || "Could not save review",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const activeColor =
    TABS.find((t) => t.key === activeTab)?.color || "#6B7280";

  return (
    <>
      <SEO title="Influencers" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-1">Influencers</p>
        <p className="text-muted small mb-3">
          Review applications, approve verified influencers, and manage the
          awareness post programme.
        </p>

        {/* Top-level tabs: Profiles | Awareness Posts */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          {TOP_TABS.map((t) => {
            const active = topTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTopTab(t.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: `1.5px solid ${active ? "#1E40AF" : "#E5E7EB"}`,
                  background: active ? "#1E40AF" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#374151",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "background 120ms, color 120ms",
                }}
              >
                <i className={t.icon} />
                {t.label}
              </button>
            );
          })}
        </div>

        {topTab === "posts" ? (
          <AwarenessPostsPanel />
        ) : (
        <div>
        {/* Status sub-tabs */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`btn ${
                activeTab === t.key ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setActiveTab(t.key)}
              style={{ fontWeight: 600, padding: "8px 18px" }}
            >
              {t.label}{" "}
              <span
                className="badge ms-1"
                style={{ background: t.color, color: "#fff" }}
              >
                {counts[t.key] || 0}
              </span>
            </button>
          ))}
          <input
            type="search"
            className="form-control ms-auto"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
            style={{ maxWidth: 280 }}
          />
        </div>

        <div className="card">
          <div className="card-body">
            {rows.length === 0 ? (
              <p className="m-5 p-5 fs-4 text-center text-muted">
                No {activeTab} influencers.
              </p>
            ) : (
              rows.map((inf) => {
                const isOpen = !!expanded[inf._id];
                const handles = inf.socialHandles || [];
                const pendingHandles = handles.filter(
                  (h) => (h.status || "pending") === "pending"
                ).length;
                return (
                  <div
                    key={inf._id}
                    className="border rounded mb-3"
                    style={{ background: "#fff" }}
                  >
                    <div
                      className="d-flex flex-wrap align-items-center gap-2 p-3"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setExpanded((e) => ({ ...e, [inf._id]: !e[inf._id] }))
                      }
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: "#EFF6FF",
                          color: "#1E40AF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {(inf.user?.name || "?")
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((p) => (p[0] || "").toUpperCase())
                          .join("") || "?"}
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold">
                          {inf.user?.name || "Unknown"}
                        </div>
                        <div className="small text-muted">
                          {inf.user?.email}
                          {inf.niche ? ` • ${inf.niche}` : ""}
                          {inf.audienceSize
                            ? ` • ${inf.audienceSize.toLocaleString()} audience`
                            : ""}
                          {" • applied "}
                          {fmtDate(inf.appliedAt || inf.createdAt)}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#FFFFFF",
                          background: activeColor,
                        }}
                      >
                        {handles.length} link{handles.length === 1 ? "" : "s"}
                      </span>
                      {pendingHandles > 0 && (
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#92400E",
                            background: "#FEF3C7",
                            border: "1px solid #FCD34D",
                          }}
                          title="New social links waiting for your review"
                        >
                          {pendingHandles} pending link
                          {pendingHandles === 1 ? "" : "s"}
                        </span>
                      )}
                      <i
                        className={`ti ${
                          isOpen ? "ti-chevron-up" : "ti-chevron-down"
                        }`}
                      />
                    </div>

                    {isOpen && (
                      <div
                        className="border-top p-3"
                        style={{ background: "#F9FAFB" }}
                      >
                        {inf.bio && (
                          <div className="mb-3">
                            <div className="small text-muted fw-bold">
                              Bio
                            </div>
                            <div style={{ whiteSpace: "pre-wrap" }}>
                              {inf.bio}
                            </div>
                          </div>
                        )}

                        <div className="mb-3">
                          <div
                            className="fw-bold mb-2"
                            style={{ fontSize: 14 }}
                          >
                            Submitted social profile links
                          </div>
                          {handles.length === 0 ? (
                            <p className="text-muted small m-0">
                              No social links provided.
                            </p>
                          ) : (
                            <div className="d-flex flex-column gap-2">
                              {handles.map((h, idx) => {
                                const meta =
                                  PLATFORM_META[h.platform] ||
                                  PLATFORM_META.other;
                                const url = h.url || h.handle;
                                const handleId = h._id || String(idx);
                                const hStatus = h.status || "pending";
                                const statusPillMeta = {
                                  pending: {
                                    label: "Pending review",
                                    color: "#92400E",
                                    bg: "#FEF3C7",
                                    border: "#FCD34D",
                                  },
                                  approved: {
                                    label: "Approved",
                                    color: "#166534",
                                    bg: "#DCFCE7",
                                    border: "#86EFAC",
                                  },
                                  rejected: {
                                    label: "Rejected",
                                    color: "#991B1B",
                                    bg: "#FEE2E2",
                                    border: "#FCA5A5",
                                  },
                                }[hStatus];
                                return (
                                  <div
                                    key={handleId}
                                    className="border rounded"
                                    style={{
                                      background: "#FFFFFF",
                                      borderColor:
                                        hStatus === "pending"
                                          ? "#FCD34D"
                                          : undefined,
                                    }}
                                  >
                                    <div className="d-flex align-items-center gap-2 flex-wrap p-2">
                                      <i
                                        className={meta.icon}
                                        style={{
                                          fontSize: 18,
                                          color: meta.color,
                                          flexShrink: 0,
                                        }}
                                      />
                                      <div
                                        className="fw-bold"
                                        style={{
                                          minWidth: 110,
                                          flexShrink: 0,
                                        }}
                                      >
                                        {meta.label}
                                      </div>
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          flex: 1,
                                          minWidth: 180,
                                          wordBreak: "break-all",
                                          color: "#1E40AF",
                                        }}
                                      >
                                        {url}
                                      </a>
                                      <span
                                        style={{
                                          padding: "3px 10px",
                                          borderRadius: 999,
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: statusPillMeta.color,
                                          background: statusPillMeta.bg,
                                          border: `1px solid ${statusPillMeta.border}`,
                                          whiteSpace: "nowrap",
                                          flexShrink: 0,
                                        }}
                                      >
                                        {statusPillMeta.label}
                                      </span>
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline-secondary"
                                        title="Open in new tab"
                                        style={{ flexShrink: 0 }}
                                      >
                                        <i className="ti ti-external-link" />
                                      </a>
                                    </div>

                                    {/* Rejected reason callout (per-handle
                                        rejection is no longer wired through
                                        a button — admins approve/block the
                                        whole profile from the bottom). */}
                                    {hStatus === "rejected" && h.rejectedReason && (
                                      <div
                                        className="border-top p-2 small"
                                        style={{
                                          background: "#FEF2F2",
                                          color: "#7F1D1D",
                                          whiteSpace: "pre-wrap",
                                        }}
                                      >
                                        <strong>Rejection reason:</strong>{" "}
                                        {h.rejectedReason}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {(inf.status === "rejected" || inf.status === "blocked") &&
                          inf.blockedReason && (
                          <div className="mb-3">
                            <div className="small text-muted fw-bold">
                              Previous rejection reason
                            </div>
                            <div
                              className="border rounded p-2"
                              style={{
                                background: "#fff",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {inf.blockedReason}
                            </div>
                          </div>
                        )}

                        {inf.status === "pending" ? (
                          <>
                            <div className="mb-2">
                              <label className="form-label small fw-bold">
                                Reject reason (required to reject)
                              </label>
                              <textarea
                                className="form-control"
                                rows={2}
                                value={blockDraft[inf._id] || ""}
                                onChange={(e) =>
                                  setBlockDraft((d) => ({
                                    ...d,
                                    [inf._id]: e.target.value,
                                  }))
                                }
                                placeholder="What's wrong with this application?"
                              />
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-success"
                                onClick={() => review(inf, "approved")}
                              >
                                <i className="ti ti-check me-1" />
                                Approve
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => review(inf, "rejected")}
                              >
                                <i className="ti ti-x me-1" />
                                Reject
                              </button>
                            </div>
                          </>
                        ) : inf.status === "approved" ? (
                          <div className="d-flex gap-2 align-items-center small text-muted">
                            <span>
                              ✓ Approved {fmtDate(inf.approvedAt)}
                              {inf.approvedBy?.name
                                ? ` by ${inf.approvedBy.name}`
                                : ""}
                            </span>
                            <button
                              className="btn btn-outline-danger ms-auto"
                              onClick={() => {
                                setBlockDraft((d) => ({
                                  ...d,
                                  [inf._id]:
                                    d[inf._id] ||
                                    "Profile no longer meets community guidelines.",
                                }));
                                review(inf, "rejected");
                              }}
                            >
                              Reject this influencer
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex gap-2 align-items-center small text-muted">
                            <span>Currently rejected.</span>
                            <button
                              className="btn btn-outline-success ms-auto"
                              onClick={() => review(inf, "approved")}
                            >
                              Re-approve
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        </div>
        )}
      </div>
    </>
  );
};

// ─── Awareness Posts admin panel ───────────────────────────────────────────
const POST_PLATFORMS = [
  { name: "Instagram", icon: "ti ti-brand-instagram", color: "#E1306C" },
  { name: "Facebook", icon: "ti ti-brand-facebook", color: "#1877F2" },
  { name: "Twitter / X", icon: "ti ti-brand-twitter", color: "#1DA1F2" },
  { name: "LinkedIn", icon: "ti ti-brand-linkedin", color: "#0A66C2" },
  { name: "YouTube", icon: "ti ti-brand-youtube", color: "#FF0000" },
];

// Helper to render the initials avatar for an influencer.
const initialsOf = (name) =>
  String(name || "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => (p[0] || "").toUpperCase())
    .join("") || "?";

// Draft was removed — every new post auto-starts as "scheduled" and
// auto-promotes to "published" once all assignees finish.
const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
];

const STATUS_META = {
  scheduled: { label: "Scheduled", color: "#B45309", bg: "#FEF3C7" },
  published: { label: "Published", color: "#15803D", bg: "#DCFCE7" },
};

const AwarenessPostsPanel = () => {
  const { setLoading } = useContext(GlobalContext);
  const [posts, setPosts] = useState([]);
  const [roster, setRoster] = useState([]);
  const [counts, setCountsState] = useState({
    all: 0,
    scheduled: 0,
    published: 0,
  });
  const [filter, setFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [platforms, setPlatforms] = useState(["Instagram"]);
  const [assignees, setAssignees] = useState([]);
  const [schedule, setSchedule] = useState("");

  const togglePlatform = (p) =>
    setPlatforms((arr) =>
      arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]
    );
  const toggleAssignee = (id) =>
    setAssignees((arr) =>
      arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
    );

  // Fetch posts + roster from the backend.
  const loadRoster = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/awareness-posts/influencer-roster`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setRoster(res?.data?.data?.influencers || []);
    } catch (err) {
      console.error("roster load failed:", err);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (assigneeFilter !== "all") params.append("assignee", assigneeFilter);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/awareness-posts?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setPosts(res?.data?.data?.posts || []);
      setCountsState(
        res?.data?.data?.counts || {
          all: 0,
          scheduled: 0,
          published: 0,
        }
      );
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Could not load posts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, assigneeFilter]);

  // Server-side filter already applied, so just use posts as-is.
  const list = posts;

  const submit = async () => {
    if (!title.trim() || !body.trim() || platforms.length === 0) return;
    if (assignees.length === 0) {
      return swal(
        "Pick an influencer",
        "Assign this post to at least one influencer before scheduling.",
        "warning"
      );
    }
    try {
      setLoading(true);
      // Always "scheduled" — the post auto-promotes to "published" once
      // every assignee finishes (see backend awarenessPost.js).
      await axios.post(
        `${import.meta.env.VITE_API_URL}/awareness-posts`,
        {
          title: title.trim(),
          body: body.trim(),
          platforms,
          assignees,
          scheduledFor: schedule || undefined,
        },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
            "Content-Type": "application/json",
          },
        }
      );
      setTitle("");
      setBody("");
      setSchedule("");
      setPlatforms(["Instagram"]);
      setAssignees([]);
      await loadPosts();
      swal(
        "Done",
        `Scheduled and assigned to ${assignees.length} influencer${
          assignees.length === 1 ? "" : "s"
        }`,
        "success"
      );
    } catch (err) {
      swal(
        "Error",
        err?.response?.data?.error || "Could not save post",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const removePost = async (id) => {
    const ok = await swal({
      title: "Remove post?",
      text: "Assigned influencers will lose access to this post.",
      icon: "warning",
      buttons: ["Cancel", "Remove"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/awareness-posts/${id}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      await loadPosts();
    } catch (err) {
      swal(
        "Error",
        err?.response?.data?.error || "Could not remove post",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const FieldHeader = ({ label, hint }) => (
    <div className="d-flex justify-content-between align-items-end mb-1">
      <label className="form-label fw-bold m-0">{label}</label>
      {hint ? <small className="text-muted">{hint}</small> : null}
    </div>
  );

  return (
    <>
      {/* ─── Composer ────────────────────────────────────────────── */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="mb-3">
            <i className="ti ti-news me-2" style={{ color: "#1E40AF" }} />
            New awareness post
          </h5>

          <div className="mb-3">
            <FieldHeader label="Title" hint={`${title.length} / 120`} />
            <input
              className="form-control"
              placeholder="e.g. Why O- donors save lives"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="mb-3">
            <FieldHeader label="Body" hint={`${body.length} / 500`} />
            <textarea
              className="form-control"
              rows={5}
              placeholder="Write the awareness message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-7">
              <FieldHeader
                label="Platforms"
                hint={`${platforms.length} selected`}
              />
              <div className="d-flex flex-wrap gap-2">
                {POST_PLATFORMS.map((p) => {
                  const on = platforms.includes(p.name);
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => togglePlatform(p.name)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 14px",
                        borderRadius: 999,
                        border: `1.5px solid ${
                          on ? p.color : "#E5E7EB"
                        }`,
                        background: on ? `${p.color}1f` : "#FFFFFF",
                        color: on ? p.color : "#374151",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        lineHeight: 1.2,
                      }}
                    >
                      <i className={p.icon} style={{ fontSize: 14 }} />
                      {p.name}
                      {on && (
                        <i
                          className="ti ti-check"
                          style={{ fontSize: 14 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="col-md-5">
              <FieldHeader label="Schedule for" hint="Leave blank to publish now" />
              <input
                className="form-control"
                type="datetime-local"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
              />
            </div>
          </div>

          {/* Assign to influencer(s) — required to publish/schedule */}
          <div className="mb-3">
            <FieldHeader
              label="Assign to influencer(s)"
              hint={`${assignees.length} of ${roster.length} selected`}
            />
            <div className="d-flex flex-wrap gap-2">
              {roster.map((u) => {
                const on = assignees.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAssignee(u.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: `1.5px solid ${on ? u.color : "#E5E7EB"}`,
                      background: on ? `${u.color}1f` : "#FFFFFF",
                      color: on ? u.color : "#374151",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      lineHeight: 1.2,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: on ? u.color : "#E5E7EB",
                        color: on ? "#FFFFFF" : "#6B7280",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {initialsOf(u.name)}
                    </span>
                    {u.name}
                    {on && (
                      <i className="ti ti-check" style={{ fontSize: 14 }} />
                    )}
                  </button>
                );
              })}
            </div>
            {assignees.length > 0 && (
              <div className="small text-muted mt-2">
                <i className="ti ti-info-circle me-1" />
                {assignees.length === roster.length
                  ? "All influencers will receive this post"
                  : `${assignees.length} influencer${
                      assignees.length === 1 ? "" : "s"
                    } will receive this post in their "Assigned Posts" inbox`}
              </div>
            )}
          </div>

          <div
            className="d-flex justify-content-end gap-2 mt-3 pt-3"
            style={{ borderTop: "1px solid #F3F4F6" }}
          >
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                !title.trim() ||
                !body.trim() ||
                platforms.length === 0 ||
                assignees.length === 0
              }
              onClick={submit}
              style={{ fontWeight: 600, padding: "8px 20px" }}
            >
              <i className="ti ti-send me-1" />
              Schedule post
            </button>
          </div>
        </div>
      </div>

      {/* ─── Filter bar ──────────────────────────────────────────── */}
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        {STATUS_FILTERS.map((s) => {
          const active = filter === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setFilter(s.key)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: `1.5px solid ${active ? "#1E40AF" : "#E5E7EB"}`,
                background: active ? "#EFF6FF" : "#FFFFFF",
                color: active ? "#1E40AF" : "#374151",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {s.label}
              <span
                className="ms-2"
                style={{
                  background: active ? "#1E40AF" : "#E5E7EB",
                  color: active ? "#FFFFFF" : "#374151",
                  borderRadius: 999,
                  padding: "1px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {counts[s.key]}
              </span>
            </button>
          );
        })}

        {/* Filter by assigned influencer */}
        <div
          className="ms-auto d-flex align-items-center gap-2"
          style={{ minWidth: 220 }}
        >
          <i className="ti ti-user-search" style={{ color: "#6B7280" }} />
          <select
            className="form-select"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            style={{ maxWidth: 220 }}
          >
            <option value="all">All influencers</option>
            {roster.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Posts list ─────────────────────────────────────────── */}
      <div className="card">
        <div className="card-body">
          {list.length === 0 ? (
            <p className="m-5 p-5 fs-4 text-center text-muted">
              No posts in this view.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 12,
              }}
            >
              {list.map((p) => {
                // Tab-aware pill: when viewing the Published tab, show
                // "Published"; when viewing Scheduled show "Scheduled".
                // For the "All" view fall back to the stored post status.
                const tabStatus =
                  filter === "scheduled" || filter === "published"
                    ? filter
                    : p.status;
                const meta = STATUS_META[tabStatus] || STATUS_META.scheduled;

                // Which assignees show on this card depends on the tab:
                //   Scheduled tab → only assignees still in flight
                //                   (pending / acknowledged)
                //   Published tab → only assignees who actually published
                //   All tab      → show everyone
                const visibleAssignees = (p.assignees || []).filter((a) => {
                  if (filter === "published") return a.state === "published";
                  if (filter === "scheduled")
                    return (
                      a.state === "pending" || a.state === "acknowledged"
                    );
                  return true;
                });
                // Rejected callouts surface only in Scheduled or All —
                // a rejected assignee never produces a published copy, so
                // they're irrelevant to the Published tab.
                const visibleRejections =
                  filter === "published"
                    ? []
                    : (p.assignees || []).filter(
                        (a) => a.state === "rejected"
                      );

                return (
                  <div
                    key={p._id}
                    className="border rounded p-3"
                    style={{ background: "#FFFFFF", minWidth: 0 }}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2 flex-wrap">
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          color: meta.color,
                          background: meta.bg,
                        }}
                      >
                        {meta.label}
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => removePost(p._id)}
                        title="Remove this post"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 38,
                          height: 38,
                          padding: 0,
                          borderRadius: 8,
                          fontSize: 20,
                          flexShrink: 0,
                        }}
                      >
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                    <div
                      className="fw-bold mb-1"
                      style={{ fontSize: 15, lineHeight: 1.3 }}
                    >
                      {p.title}
                    </div>
                    <div
                      className="small text-muted mb-2"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {p.body}
                    </div>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {p.platforms.map((name) => {
                        const m =
                          POST_PLATFORMS.find((x) => x.name === name) ||
                          POST_PLATFORMS[0];
                        return (
                          <span
                            key={name}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: `${m.color}1f`,
                              color: m.color,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            <i className={m.icon} style={{ fontSize: 11 }} />
                            {name}
                          </span>
                        );
                      })}
                    </div>

                    {/* Assigned-to row: small avatar stack + names */}
                    <div
                      className="d-flex align-items-center gap-2 mb-2 pt-2"
                      style={{ borderTop: "1px solid #F3F4F6" }}
                    >
                      <i
                        className="ti ti-user-check"
                        style={{ color: "#6B7280", fontSize: 14 }}
                      />
                      {(() => {
                        // Only the assignees relevant to the current tab —
                        // see visibleAssignees computed above the return.
                        const assigned = visibleAssignees
                          .map((a) => {
                            const uid = a.user?._id || a.user;
                            const meta = roster.find((u) => u.id === String(uid));
                            return {
                              ...(meta || {
                                id: String(uid),
                                name: a.user?.name || "Influencer",
                                color: "#6B7280",
                              }),
                              state: a.state,
                              rejectedReason: a.rejectedReason,
                              rejectedAt: a.rejectedAt,
                            };
                          })
                          .filter(Boolean);
                        if (assigned.length === 0) {
                          const emptyLabel =
                            filter === "published"
                              ? "No published yet"
                              : filter === "scheduled"
                              ? "Everyone has finished"
                              : "Not assigned yet";
                          return (
                            <span
                              className="small text-muted"
                              style={{ fontStyle: "italic" }}
                            >
                              {emptyLabel}
                            </span>
                          );
                        }
                        const shown = assigned.slice(0, 3);
                        const extra = assigned.length - shown.length;
                        return (
                          <>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {shown.map((u, i) => (
                                <span
                                  key={u.id}
                                  title={u.name}
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    background: u.color,
                                    color: "#FFFFFF",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    border: "2px solid #FFFFFF",
                                    marginLeft: i === 0 ? 0 : -8,
                                  }}
                                >
                                  {initialsOf(u.name)}
                                </span>
                              ))}
                              {extra > 0 && (
                                <span
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    background: "#E5E7EB",
                                    color: "#374151",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    border: "2px solid #FFFFFF",
                                    marginLeft: -8,
                                  }}
                                >
                                  +{extra}
                                </span>
                              )}
                            </div>
                            <span
                              className="small text-muted"
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                minWidth: 0,
                              }}
                            >
                              {assigned.length === 1
                                ? assigned[0].name
                                : `${assigned.length} influencers`}
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    {/* Rejection callouts — one row per influencer who said
                        no. Hidden on the Published tab (rejected ≠ published). */}
                    {visibleRejections.map((a) => {
                        const uid = a.user?._id || a.user;
                        const meta = roster.find(
                          (u) => u.id === String(uid)
                        );
                        const name = meta?.name || a.user?.name || "Influencer";
                        return (
                          <div
                            key={String(uid)}
                            className="rounded p-2 mb-2"
                            style={{
                              background: "#FEF2F2",
                              border: "1px solid #FCA5A5",
                            }}
                          >
                            <div
                              className="d-flex align-items-center gap-2 mb-1"
                              style={{ color: "#991B1B", fontSize: 12, fontWeight: 700 }}
                            >
                              <i className="ti ti-circle-x" />
                              {name} rejected this post
                              {a.rejectedAt && (
                                <span
                                  className="ms-auto small"
                                  style={{ fontWeight: 400, color: "#6B7280" }}
                                >
                                  {new Date(a.rejectedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div
                              className="small"
                              style={{
                                color: "#7F1D1D",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {a.rejectedReason || "(no reason provided)"}
                            </div>
                          </div>
                        );
                      })}

                    <div
                      className="small text-muted pt-2"
                      style={{ borderTop: "1px solid #F3F4F6" }}
                    >
                      <i className="ti ti-calendar me-1" />
                      {p.scheduledFor
                        ? new Date(p.scheduledFor).toLocaleString()
                        : "Not scheduled"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Influencer;
