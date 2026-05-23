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
  { key: "campaigns", label: "Campaigns", icon: "ti ti-flag" },
  { key: "drives", label: "Drives", icon: "ti ti-droplet" },
  { key: "rewards", label: "Rewards", icon: "ti ti-trophy" },
  { key: "mediakit", label: "Media Kit", icon: "ti ti-photo" },
];

const PLATFORM_META = {
  instagram: { label: "Instagram", icon: "ti ti-brand-instagram", color: "#E1306C" },
  youtube: { label: "YouTube", icon: "ti ti-brand-youtube", color: "#FF0000" },
  twitter: { label: "Twitter / X", icon: "ti ti-brand-twitter", color: "#1DA1F2" },
  facebook: { label: "Facebook", icon: "ti ti-brand-facebook", color: "#1877F2" },
  linkedin: { label: "LinkedIn", icon: "ti ti-brand-linkedin", color: "#0A66C2" },
  tiktok: { label: "TikTok", icon: "ti ti-brand-tiktok", color: "#000000" },
  threads: { label: "Threads", icon: "ti ti-brand-threads", color: "#000000" },
  snapchat: { label: "Snapchat", icon: "ti ti-brand-snapchat", color: "#FFFC00" },
  pinterest: { label: "Pinterest", icon: "ti ti-brand-pinterest", color: "#E60023" },
  whatsapp: { label: "WhatsApp", icon: "ti ti-brand-whatsapp", color: "#25D366" },
  telegram: { label: "Telegram", icon: "ti ti-brand-telegram", color: "#0088CC" },
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
  // Referral stats fetched lazily when admin expands a row.
  // influencerId -> { loading, error, stats }
  const [referrals, setReferrals] = useState({});
  // Per-member expand state for the joined-members list. Keyed by the
  // member's _id; click a row to toggle its contribution panel open.
  const [memberOpen, setMemberOpen] = useState({});
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

        {/* Top-level tabs — segmented pill bar. On mobile the buttons
            fill the available width evenly (flex: 1 1 0) so two-line
            labels (e.g. "Awareness Posts") still fit without horizontal
            scroll. The active pill uses the brand red gradient + soft
            shadow so it's clearly elevated above the inactive ones. */}
        <div
          className="d-flex flex-wrap gap-2 mb-3"
          style={{
            background: "#F3F4F6",
            padding: 6,
            borderRadius: 14,
            border: "1px solid #E5E7EB",
          }}
        >
          {TOP_TABS.map((t) => {
            const active = topTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTopTab(t.key)}
                style={{
                  flex: "1 1 140px",
                  minWidth: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: active
                    ? "linear-gradient(135deg, #FECACA 0%, #FCA5A5 100%)"
                    : "transparent",
                  color: active ? "#7F1D1D" : "#374151",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: active
                    ? "0 4px 12px rgba(252,165,165,.35)"
                    : "none",
                  transition:
                    "background 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 120ms ease",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    e.currentTarget.style.background = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <i className={t.icon} style={{ fontSize: 16 }} />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {topTab === "posts" ? (
          <AwarenessPostsPanel />
        ) : topTab === "campaigns" ? (
          <CampaignsPanel />
        ) : topTab === "drives" ? (
          <DrivesAdminPanel />
        ) : topTab === "rewards" ? (
          <RewardsAdminPanel />
        ) : topTab === "mediakit" ? (
          <MediaKitAdminPanel />
        ) : (
        <div>
        {/* Status sub-tabs — soft pastel pill bar. Each status uses its
            own color (amber pending, green approved, red rejected) so
            admin can tell at a glance which queue they're in. The whole
            row reflows below the search input on mobile. */}
        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <div
            className="d-flex flex-wrap gap-2"
            style={{ flex: "1 1 auto" }}
          >
            {TABS.map((t) => {
              const active = activeTab === t.key;
              // Per-status palette: { bg/border for inactive,
              // gradient + shadow for active }.
              const palette = {
                pending: {
                  text: "#92400E",
                  bgIdle: "#FFFFFF",
                  borderIdle: "#FDE68A",
                  bgActive:
                    "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                  borderActive: "#FCD34D",
                  shadow: "rgba(252, 211, 77, .35)",
                },
                approved: {
                  text: "#14532D",
                  bgIdle: "#FFFFFF",
                  borderIdle: "#BBF7D0",
                  bgActive:
                    "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)",
                  borderActive: "#86EFAC",
                  shadow: "rgba(134, 239, 172, .35)",
                },
                rejected: {
                  text: "#991B1B",
                  bgIdle: "#FFFFFF",
                  borderIdle: "#FCA5A5",
                  bgActive:
                    "linear-gradient(135deg, #FECACA 0%, #FCA5A5 100%)",
                  borderActive: "#F87171",
                  shadow: "rgba(248, 113, 113, .35)",
                },
              }[t.key];
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 16px",
                    borderRadius: 999,
                    border: `1.5px solid ${
                      active ? palette.borderActive : palette.borderIdle
                    }`,
                    background: active ? palette.bgActive : palette.bgIdle,
                    color: palette.text,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: active
                      ? `0 4px 12px ${palette.shadow}`
                      : "none",
                    transition:
                      "background 150ms ease, border-color 150ms ease, transform 120ms ease, box-shadow 150ms ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!active)
                      e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {t.label}
                  <span
                    style={{
                      background: active
                        ? "rgba(255,255,255,.55)"
                        : palette.text,
                      color: active ? palette.text : "#FFFFFF",
                      padding: "1px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      minWidth: 22,
                      textAlign: "center",
                    }}
                  >
                    {counts[t.key] || 0}
                  </span>
                </button>
              );
            })}
          </div>
          <input
            type="search"
            className="form-control ms-md-auto"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
            style={{ maxWidth: 280, flex: "1 1 200px" }}
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
                      onClick={() => {
                        const wasOpen = !!expanded[inf._id];
                        setExpanded((e) => ({
                          ...e,
                          [inf._id]: !e[inf._id],
                        }));
                        // Fetch the influencer's referral stats the first
                        // time the row opens; subsequent opens reuse cache.
                        if (!wasOpen && !referrals[inf._id]) {
                          setReferrals((r) => ({
                            ...r,
                            [inf._id]: { loading: true },
                          }));
                          axios
                            .get(
                              `${import.meta.env.VITE_API_URL}/influencers/${inf._id}/referrals`,
                              {
                                headers: {
                                  Authorization:
                                    sessionStorage.getItem("auth"),
                                },
                              }
                            )
                            .then((res) =>
                              setReferrals((r) => ({
                                ...r,
                                [inf._id]: {
                                  loading: false,
                                  stats: res?.data?.data,
                                },
                              }))
                            )
                            .catch((err) =>
                              setReferrals((r) => ({
                                ...r,
                                [inf._id]: {
                                  loading: false,
                                  error:
                                    err?.response?.data?.error ||
                                    "Could not load referrals",
                                },
                              }))
                            );
                        }
                      }}
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

                        {/* Joined members — list of users who signed up
                            with this influencer's referral link. Fetched
                            lazily the first time the row is expanded. */}
                        <div className="mb-3">
                          <div
                            className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2"
                          >
                            <div className="fw-bold" style={{ fontSize: 14 }}>
                              Joined members{" "}
                              {referrals[inf._id]?.stats?.members && (
                                <span
                                  className="ms-2"
                                  style={{
                                    background: "#1E40AF",
                                    color: "#FFFFFF",
                                    padding: "2px 8px",
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  {referrals[inf._id].stats.members.length}
                                </span>
                              )}
                            </div>
                            {referrals[inf._id]?.stats?.referralCode && (
                              <span className="small text-muted">
                                Referral code:{" "}
                                <code>
                                  {referrals[inf._id].stats.referralCode}
                                </code>
                              </span>
                            )}
                          </div>
                          {referrals[inf._id]?.loading ? (
                            <p className="text-muted small m-0">
                              Loading joined members…
                            </p>
                          ) : referrals[inf._id]?.error ? (
                            <p className="text-danger small m-0">
                              {referrals[inf._id].error}
                            </p>
                          ) : (
                            (() => {
                              const members =
                                referrals[inf._id]?.stats?.members || [];
                              if (members.length === 0) {
                                return (
                                  <p className="text-muted small m-0">
                                    No one has joined through this
                                    influencer's referral link yet.
                                  </p>
                                );
                              }
                              return (
                                <div
                                  className="d-flex flex-column gap-1"
                                  style={{
                                    maxHeight: 320,
                                    overflowY: "auto",
                                  }}
                                >
                                  {members.map((m) => {
                                    const c = m.contributions;
                                    const hasContrib = !!(c && c.count > 0);
                                    const isOpen = !!memberOpen[m._id];
                                    return (
                                    <div
                                      key={m._id}
                                      className="border rounded"
                                      style={{
                                        background: "#FFFFFF",
                                        fontSize: 13,
                                      }}
                                    >
                                      <div
                                        className="d-flex align-items-center gap-2 p-2"
                                        style={{
                                          cursor: hasContrib
                                            ? "pointer"
                                            : "default",
                                        }}
                                        onClick={() => {
                                          if (!hasContrib) return;
                                          setMemberOpen((s) => ({
                                            ...s,
                                            [m._id]: !s[m._id],
                                          }));
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: "50%",
                                            background: "#EFF6FF",
                                            color: "#1E40AF",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: 700,
                                            fontSize: 11,
                                            flexShrink: 0,
                                          }}
                                        >
                                          {(m.name || "?")
                                            .charAt(0)
                                            .toUpperCase()}
                                        </div>
                                        <div
                                          className="flex-grow-1"
                                          style={{ minWidth: 0 }}
                                        >
                                          <div className="fw-bold">
                                            {m.name || "—"}
                                          </div>
                                          <div className="small text-muted">
                                            {m.email || ""}
                                            {m.phone ? ` · ${m.phone}` : ""}
                                            {m.bloodGroup
                                              ? ` · ${m.bloodGroup}`
                                              : ""}
                                            {" · joined "}
                                            {m.joinedAt
                                              ? new Date(
                                                  m.joinedAt
                                                ).toLocaleDateString()
                                              : "—"}
                                          </div>
                                        </div>
                                        {m.isDonor && (
                                          <span
                                            style={{
                                              padding: "2px 8px",
                                              borderRadius: 999,
                                              fontSize: 10,
                                              fontWeight: 700,
                                              color: "#15803D",
                                              background: "#DCFCE7",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            Active donor
                                          </span>
                                        )}
                                        {hasContrib && (
                                          <span
                                            style={{
                                              padding: "2px 8px",
                                              borderRadius: 999,
                                              fontSize: 10,
                                              fontWeight: 700,
                                              color: "#92400E",
                                              background: "#FEF3C7",
                                              whiteSpace: "nowrap",
                                            }}
                                            title="Click row to view contributions"
                                          >
                                            <i className="ti ti-heart-handshake me-1" />
                                            {c.count}
                                          </span>
                                        )}
                                        {hasContrib && (
                                          <i
                                            className={`ti ${
                                              isOpen
                                                ? "ti-chevron-up"
                                                : "ti-chevron-down"
                                            }`}
                                            style={{
                                              color: "#6B7280",
                                              fontSize: 16,
                                            }}
                                          />
                                        )}
                                      </div>

                                      {/* Approved-contributions roll-up.
                                          Only renders when the member row
                                          has been expanded by the admin. */}
                                      {hasContrib && isOpen && (
                                        <div
                                          className="border-top p-2"
                                          style={{ background: "#F9FAFB" }}
                                        >
                                          <div
                                            className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1"
                                          >
                                            <div
                                              className="fw-bold"
                                              style={{
                                                fontSize: 12,
                                                color: "#15803D",
                                              }}
                                            >
                                              <i className="ti ti-heart-handshake me-1" />
                                              {c.count} approved contribution{c.count === 1 ? "" : "s"}
                                              {c.totalAmount > 0 && (
                                                <span style={{ marginLeft: 6 }}>
                                                  · ₹{c.totalAmount.toLocaleString()}
                                                </span>
                                              )}
                                            </div>
                                            <div className="small text-muted">
                                              {c.types.direct > 0 && (
                                                <span style={{ marginRight: 6 }}>
                                                  To Cause: {c.types.direct}
                                                </span>
                                              )}
                                              {c.types.vendor > 0 && (
                                                <span style={{ marginRight: 6 }}>
                                                  Kind-Vendor: {c.types.vendor}
                                                </span>
                                              )}
                                              {c.types.deliver > 0 && (
                                                <span>
                                                  Kind-Deliver: {c.types.deliver}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="d-flex flex-column gap-1">
                                            {c.recent.map((row) => {
                                              const typeMeta = {
                                                direct: { label: "Cause", color: "#15803D", bg: "#DCFCE7" },
                                                vendor: { label: "Kind · Vendor", color: "#B45309", bg: "#FEF3C7" },
                                                deliver: { label: "Kind · Deliver", color: "#1E40AF", bg: "#DBEAFE" },
                                              }[row.type] || { label: row.type, color: "#374151", bg: "#E5E7EB" };
                                              const itemsLabel = (row.items || [])
                                                .map((it) => `${it.itemName} ×${it.quantity}`)
                                                .join(", ");
                                              return (
                                                <div
                                                  key={row._id}
                                                  className="d-flex align-items-center gap-2"
                                                  style={{ fontSize: 12 }}
                                                >
                                                  <span
                                                    style={{
                                                      padding: "2px 8px",
                                                      borderRadius: 999,
                                                      fontSize: 10,
                                                      fontWeight: 700,
                                                      color: typeMeta.color,
                                                      background: typeMeta.bg,
                                                      whiteSpace: "nowrap",
                                                      flexShrink: 0,
                                                    }}
                                                  >
                                                    {typeMeta.label}
                                                  </span>
                                                  <span
                                                    className="flex-grow-1"
                                                    style={{
                                                      color: "#111827",
                                                      whiteSpace: "nowrap",
                                                      overflow: "hidden",
                                                      textOverflow: "ellipsis",
                                                    }}
                                                  >
                                                    {row.amount > 0
                                                      ? `₹${row.amount.toLocaleString()}`
                                                      : ""}
                                                    {row.amount > 0 && itemsLabel ? " · " : ""}
                                                    {itemsLabel}
                                                  </span>
                                                  <span
                                                    className="small text-muted"
                                                    style={{ flexShrink: 0 }}
                                                  >
                                                    {row.createdAt
                                                      ? new Date(row.createdAt).toLocaleDateString()
                                                      : ""}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    );
                                  })}
                                </div>
                              );
                            })()
                          )}
                        </div>

                        {/* Media kit moved to its own top-level tab —
                            see the "Media Kit" tab above. */}

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
// Keep this list in sync with PLATFORMS in routes/admin/awarenessPost.js
// on the backend (and with ASSIGNED_POST_PLATFORMS in the influencer
// client's InfluencerSection.jsx).
const POST_PLATFORMS = [
  { name: "Instagram", icon: "ti ti-brand-instagram", color: "#E1306C" },
  { name: "YouTube", icon: "ti ti-brand-youtube", color: "#FF0000" },
  { name: "Facebook", icon: "ti ti-brand-facebook", color: "#1877F2" },
  { name: "Twitter / X", icon: "ti ti-brand-twitter", color: "#1DA1F2" },
  { name: "LinkedIn", icon: "ti ti-brand-linkedin", color: "#0A66C2" },
  { name: "TikTok", icon: "ti ti-brand-tiktok", color: "#000000" },
  { name: "Threads", icon: "ti ti-brand-threads", color: "#000000" },
  { name: "Snapchat", icon: "ti ti-brand-snapchat", color: "#FFFC00" },
  { name: "Pinterest", icon: "ti ti-brand-pinterest", color: "#E60023" },
  { name: "WhatsApp", icon: "ti ti-brand-whatsapp", color: "#25D366" },
  { name: "Telegram", icon: "ti ti-brand-telegram", color: "#0088CC" },
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
  // Uploaded attachments — each entry is { file: <fileObjectId>, kind,
  // name, mime, size, url, uploading? } shape so we can render the
  // upload-in-progress state and the finished thumb/link from the same
  // array.
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Map a mime string to one of the schema's enum buckets.
  const inferKind = (mime) => {
    const m = String(mime || "").toLowerCase();
    if (m.startsWith("image/")) return "image";
    if (m.startsWith("video/")) return "video";
    if (m === "application/pdf") return "pdf";
    return "other";
  };

  // Upload via the existing presigned-S3 flow (/upload-test then PUT to
  // S3 then /upload-ack to undormant the FileObject). Append every
  // successful file to the attachments[] array as it lands.
  const handleFilesSelected = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    // VITE_API_URL ends with "/admin" for the admin app, but /upload-test
    // and /upload-ack live one level higher at /api directly. Strip the
    // trailing /admin so the upload endpoints resolve correctly.
    const apiRoot = (import.meta.env.VITE_API_URL || "").replace(
      /\/admin\/?$/,
      ""
    );

    setUploading(true);
    for (const f of Array.from(fileList)) {
      try {
        // 1. Ask the server for a presigned POST.
        const sigRes = await axios.post(
          `${apiRoot}/upload-test`,
          { name: f.name, mime: f.type || "application/octet-stream", size: f.size },
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
              "Content-Type": "application/json",
            },
          }
        );
        const presigned = sigRes?.data?.data;
        const finalUrl = sigRes?.data?.url;
        if (!presigned?.url || !presigned?.fields) {
          throw new Error("Bad presigned response");
        }
        // 2. POST the file to S3 with the returned form fields.
        const form = new FormData();
        Object.entries(presigned.fields).forEach(([k, v]) =>
          form.append(k, v)
        );
        form.append("file", f);
        await fetch(presigned.url, { method: "POST", body: form });
        // 3. Ack the upload so the FileObject leaves the "dormant" state.
        await axios.post(
          `${apiRoot}/upload-ack`,
          { fid: presigned._id },
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
              "Content-Type": "application/json",
            },
          }
        );
        setAttachments((arr) => [
          ...arr,
          {
            file: presigned._id,
            kind: inferKind(f.type),
            name: f.name,
            mime: f.type,
            size: f.size,
            url: finalUrl,
          },
        ]);
      } catch (err) {
        swal(
          "Upload failed",
          err?.response?.data?.error || err?.message || "Try again",
          "error"
        );
      }
    }
    setUploading(false);
  };

  const removeAttachment = (idx) =>
    setAttachments((arr) => arr.filter((_, i) => i !== idx));

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
          attachments: attachments.map((a) => ({
            file: a.file,
            kind: a.kind,
          })),
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
      setAttachments([]);
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

          {/* Attachments — image / video / PDF. Each file is uploaded to
              S3 via the existing presigned flow immediately; the post
              just stores their FileObject _ids on submit. */}
          <div className="mb-3">
            <FieldHeader
              label="Attachments"
              hint={
                attachments.length === 0
                  ? "Optional — image, video, or PDF"
                  : `${attachments.length} file${
                      attachments.length === 1 ? "" : "s"
                    }`
              }
            />
            <label
              htmlFor="awareness-files"
              style={{
                display: "block",
                border: "2px dashed #CBD5E1",
                borderRadius: 10,
                padding: "16px",
                background: "#F8FAFC",
                color: "#475569",
                fontSize: 13,
                textAlign: "center",
                cursor: uploading ? "wait" : "pointer",
                marginBottom: attachments.length > 0 ? 12 : 0,
              }}
            >
              <i className="ti ti-cloud-upload" style={{ fontSize: 22 }} />{" "}
              {uploading
                ? "Uploading…"
                : "Click to add image, video, or PDF files"}
              <input
                id="awareness-files"
                type="file"
                multiple
                accept="image/*,video/*,application/pdf"
                disabled={uploading}
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.target.value = "";
                }}
                style={{ display: "none" }}
              />
            </label>
            {attachments.length > 0 && (
              <div className="d-flex flex-column gap-2">
                {attachments.map((a, idx) => {
                  const icon =
                    a.kind === "image"
                      ? "ti ti-photo"
                      : a.kind === "video"
                      ? "ti ti-video"
                      : a.kind === "pdf"
                      ? "ti ti-file-text"
                      : "ti ti-file";
                  const color =
                    a.kind === "image"
                      ? "#0EA5E9"
                      : a.kind === "video"
                      ? "#7C3AED"
                      : a.kind === "pdf"
                      ? "#DC2626"
                      : "#6B7280";
                  return (
                    <div
                      key={idx}
                      className="d-flex align-items-center gap-2 border rounded p-2"
                      style={{ background: "#FFFFFF", fontSize: 13 }}
                    >
                      <i
                        className={icon}
                        style={{ fontSize: 20, color, flexShrink: 0 }}
                      />
                      <div
                        className="flex-grow-1"
                        style={{
                          minWidth: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#111827",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          {a.name}
                        </a>
                        <span
                          className="small text-muted ms-2"
                          style={{ fontWeight: 400 }}
                        >
                          {a.size
                            ? `${(a.size / 1024).toFixed(1)} KB`
                            : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeAttachment(idx)}
                        title="Remove"
                        style={{ flexShrink: 0 }}
                      >
                        <i className="ti ti-x" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
          className="ms-md-auto d-flex align-items-center gap-2"
          style={{ flex: "1 1 200px", minWidth: 0 }}
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

                    {/* Live links per influencer — one block per assignee
                        who's marked the post published AND pasted at
                        least one platformPublications row with a URL.
                        Lets admin click straight through to the actual
                        Instagram / YouTube / etc. post. */}
                    {(() => {
                      const livePublishers = (p.assignees || []).filter(
                        (a) =>
                          a.state === "published" &&
                          ((a.platformPublications || []).some(
                            (pp) => pp.liveLink
                          ) ||
                            a.liveLink)
                      );
                      if (livePublishers.length === 0) return null;
                      // Respect the tab — hide on Scheduled (those rows
                      // aren't published).
                      if (filter === "scheduled") return null;
                      return (
                        <div className="mb-2">
                          {livePublishers.map((a) => {
                            const uid = a.user?._id || a.user;
                            const meta = roster.find(
                              (u) => u.id === String(uid)
                            );
                            const name =
                              meta?.name || a.user?.name || "Influencer";
                            const color = meta?.color || "#15803D";
                            const rows =
                              (a.platformPublications || []).filter(
                                (pp) => pp.liveLink
                              ).length > 0
                                ? (a.platformPublications || []).filter(
                                    (pp) => pp.liveLink
                                  )
                                : a.liveLink
                                ? [
                                    {
                                      platform:
                                        a.publishedPlatform || "Other",
                                      liveLink: a.liveLink,
                                    },
                                  ]
                                : [];
                            return (
                              <div
                                key={String(uid)}
                                className="rounded p-2 mb-2"
                                style={{
                                  background: "#F0FDF4",
                                  border: "1px solid #BBF7D0",
                                }}
                              >
                                <div
                                  className="d-flex align-items-center gap-2 mb-2"
                                  style={{
                                    color,
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 18,
                                      height: 18,
                                      borderRadius: "50%",
                                      background: color,
                                      color: "#FFFFFF",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 9,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {initialsOf(name)}
                                  </span>
                                  {name} — live on{" "}
                                  {rows.length} platform
                                  {rows.length === 1 ? "" : "s"}
                                  {a.publishedAt && (
                                    <span
                                      className="ms-auto small"
                                      style={{
                                        fontWeight: 400,
                                        color: "#6B7280",
                                      }}
                                    >
                                      {new Date(a.publishedAt).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <div className="d-flex flex-column gap-1">
                                  {rows.map((pp) => {
                                    const m =
                                      POST_PLATFORMS.find(
                                        (x) => x.name === pp.platform
                                      ) || {
                                        icon: "ti ti-link",
                                        color: "#6B7280",
                                      };
                                    return (
                                      <a
                                        key={pp.platform}
                                        href={pp.liveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 6,
                                          padding: "4px 8px",
                                          borderRadius: 6,
                                          background: "#FFFFFF",
                                          border: "1px solid #E5E7EB",
                                          textDecoration: "none",
                                          color: "#111827",
                                          fontSize: 12,
                                        }}
                                      >
                                        <span
                                          style={{
                                            padding: "2px 6px",
                                            borderRadius: 4,
                                            background: `${m.color}1f`,
                                            color: m.color,
                                            fontWeight: 700,
                                            fontSize: 10,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 3,
                                            flexShrink: 0,
                                          }}
                                        >
                                          <i
                                            className={m.icon}
                                            style={{ fontSize: 11 }}
                                          />
                                          {pp.platform}
                                        </span>
                                        <span
                                          style={{
                                            color: "#3B82F6",
                                            wordBreak: "break-all",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            flex: 1,
                                          }}
                                        >
                                          {pp.liveLink}
                                        </span>
                                        <i
                                          className="ti ti-external-link"
                                          style={{
                                            color: "#3B82F6",
                                            flexShrink: 0,
                                          }}
                                        />
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

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

                    {/* Admin can re-download any attached asset. */}
                    {Array.isArray(p.attachments) &&
                      p.attachments.length > 0 && (
                        <div className="d-flex flex-wrap gap-1 mb-2">
                          {p.attachments.map((a, ai) => {
                            const f = a.file || {};
                            const icon =
                              a.kind === "image"
                                ? "ti ti-photo"
                                : a.kind === "video"
                                ? "ti ti-video"
                                : a.kind === "pdf"
                                ? "ti ti-file-text"
                                : "ti ti-paperclip";
                            return (
                              <a
                                key={ai}
                                href={f.url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "3px 10px",
                                  borderRadius: 999,
                                  background: "#F1F5F9",
                                  color: "#0F172A",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  textDecoration: "none",
                                  maxWidth: 200,
                                  overflow: "hidden",
                                  whiteSpace: "nowrap",
                                  textOverflow: "ellipsis",
                                }}
                                title={f.name || a.kind}
                              >
                                <i className={icon} />
                                {f.name || a.kind}
                              </a>
                            );
                          })}
                        </div>
                      )}

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

// ─── Campaigns admin panel ────────────────────────────────────────────────
//
//   Lists every BloodCamp (admin- and NGO-created). Each row expands to
//   show the influencer participants only — registrations from users
//   without an Influencer profile are filtered out client-side.
//
//   Backend endpoints reused:
//     GET /admin/camps         — list with per-camp registration counts
//     GET /admin/camp/:id      — full detail, including populated
//                                user.influencer so we can filter for
//                                influencer participants here
const CAMP_PHASE_META = {
  scheduled: { label: "Scheduled", color: "#B45309", bg: "#FEF3C7" },
  ongoing: { label: "Ongoing", color: "#15803D", bg: "#DCFCE7" },
  completed: { label: "Completed", color: "#1F2937", bg: "#E5E7EB" },
  cancelled: { label: "Cancelled", color: "#991B1B", bg: "#FEE2E2" },
};

const REG_STATUS_META = {
  registered: { label: "Registered", color: "#1E40AF", bg: "#DBEAFE" },
  attended: { label: "Attended", color: "#15803D", bg: "#DCFCE7" },
  "no-show": { label: "No show", color: "#991B1B", bg: "#FEE2E2" },
  cancelled: { label: "Cancelled", color: "#6B7280", bg: "#E5E7EB" },
};

const CampaignsPanel = () => {
  const { setLoading } = useContext(GlobalContext);
  const [camps, setCamps] = useState([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expanded, setExpanded] = useState({}); // campId -> { loading, regs }

  const loadCamps = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("n", "50");
      params.append("p", "1");
      if (search.trim()) params.append("searchText", search.trim());
      if (statusFilter !== "All") params.append("status", statusFilter);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/camps?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setCamps(res?.data?.data?.camps || []);
      setCount(res?.data?.data?.count || 0);
    } catch (err) {
      swal(
        "Error",
        err?.response?.data?.error || "Could not load campaigns",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCamps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadDetail = async (campId) => {
    setExpanded((e) => ({
      ...e,
      [campId]: { ...(e[campId] || {}), loading: true },
    }));
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/camp/${campId}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      const regs = (res?.data?.data?.registrations || []).filter(
        // Influencer-only: must have a populated `influencer` ObjectId.
        (r) => r.user && r.user.influencer
      );
      setExpanded((e) => ({
        ...e,
        [campId]: { loading: false, regs },
      }));
    } catch (err) {
      setExpanded((e) => ({
        ...e,
        [campId]: {
          loading: false,
          regs: [],
          error:
            err?.response?.data?.error || "Could not load participants",
        },
      }));
    }
  };

  const toggleExpand = (campId) => {
    const open = !!expanded[campId];
    if (open) {
      setExpanded((e) => {
        const copy = { ...e };
        delete copy[campId];
        return copy;
      });
    } else {
      loadDetail(campId);
    }
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        {["All", "scheduled", "ongoing", "completed", "cancelled"].map((s) => {
          const active = statusFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: `1.5px solid ${active ? "#1E40AF" : "#E5E7EB"}`,
                background: active ? "#EFF6FF" : "#FFFFFF",
                color: active ? "#1E40AF" : "#374151",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {s === "All" ? "All" : s}
            </button>
          );
        })}
        <input
          type="search"
          className="form-control ms-md-auto"
          placeholder="Search organizer name…"
          style={{ maxWidth: 280, flex: "1 1 200px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadCamps();
          }}
        />
      </div>

      <div className="card">
        <div className="card-body">
          {camps.length === 0 ? (
            <p className="m-5 p-5 fs-4 text-center text-muted">
              No campaigns found.
            </p>
          ) : (
            <>
              <div className="small text-muted mb-2">
                {count} campaign{count === 1 ? "" : "s"}
              </div>
              {camps.map((c) => {
                const isOpen = !!expanded[c._id];
                const phase = CAMP_PHASE_META[c.status] || CAMP_PHASE_META.scheduled;
                const title =
                  c.organization?.name || c.organizerName || "Campaign";
                const source = c.ngoCreator
                  ? `NGO${c.ngoCreator?.name ? ` · ${c.ngoCreator.name}` : ""}`
                  : "Admin team";
                const totalReg = c.counts?.registered || 0;
                const totalAttended = c.counts?.attended || 0;
                return (
                  <div
                    key={c._id}
                    className="border rounded mb-3"
                    style={{ background: "#fff" }}
                  >
                    <div
                      className="d-flex flex-wrap align-items-center gap-2 p-3"
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleExpand(c._id)}
                    >
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          color: phase.color,
                          background: phase.bg,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {phase.label}
                      </span>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="fw-bold">{title}</div>
                        <div className="small text-muted">
                          by {source}
                          {c.venueDate
                            ? ` • ${new Date(c.venueDate).toLocaleDateString()}`
                            : ""}
                          {c.venueTime ? ` ${c.venueTime}` : ""}
                          {c.location ? ` • ${c.location}` : ""}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#FFFFFF",
                          background: "#1E40AF",
                        }}
                        title="Total registrations"
                      >
                        {totalReg} registered
                      </span>
                      {totalAttended > 0 && (
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#15803D",
                            background: "#DCFCE7",
                          }}
                          title="Attended at the camp"
                        >
                          {totalAttended} attended
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
                        <div
                          className="fw-bold mb-2"
                          style={{ fontSize: 14 }}
                        >
                          Influencers who joined
                        </div>
                        {expanded[c._id]?.loading ? (
                          <p className="text-muted small m-0">Loading…</p>
                        ) : expanded[c._id]?.error ? (
                          <p className="text-danger small m-0">
                            {expanded[c._id].error}
                          </p>
                        ) : (expanded[c._id]?.regs || []).length === 0 ? (
                          <p className="text-muted small m-0">
                            No influencer participants yet.
                          </p>
                        ) : (
                          <div className="d-flex flex-column gap-2">
                            {expanded[c._id].regs.map((r) => {
                              const u = r.user || {};
                              const reg =
                                REG_STATUS_META[r.status] ||
                                REG_STATUS_META.registered;
                              return (
                                <div
                                  key={r._id}
                                  className="d-flex align-items-center gap-2 border rounded p-2 flex-wrap"
                                  style={{ background: "#FFFFFF" }}
                                >
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: "50%",
                                      background: "#EFF6FF",
                                      color: "#1E40AF",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: 700,
                                      fontSize: 14,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {initialsOf(u.name)}
                                  </div>
                                  <div
                                    className="flex-grow-1"
                                    style={{ minWidth: 180 }}
                                  >
                                    <div className="fw-bold">
                                      {u.name || "Influencer"}
                                    </div>
                                    <div className="small text-muted">
                                      {u.email || "—"}
                                      {u.phone
                                        ? ` • +${u.phoneCode || ""} ${u.phone}`
                                        : ""}
                                      {u.bloodGroup
                                        ? ` • ${u.bloodGroup}`
                                        : ""}
                                    </div>
                                  </div>
                                  <span
                                    style={{
                                      padding: "3px 10px",
                                      borderRadius: 999,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: reg.color,
                                      background: reg.bg,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {reg.label}
                                  </span>
                                  <span className="small text-muted">
                                    {r.createdAt
                                      ? new Date(
                                          r.createdAt
                                        ).toLocaleString()
                                      : ""}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Rewards admin panel ──────────────────────────────────────────────────
//
//   Two sub-sections inside the new "Rewards" top tab:
//     • Badges — CRUD list + "Seed 10 default badges" button
//     • Certificates — template uploader + list
//
//   Both reuse the existing /upload-test presigned-S3 flow for files
//   and the /admin/influencer-rewards/* endpoints we just added.

const CRITERIA_OPTIONS = [
  { key: "referrals_count", label: "Referrals brought in" },
  { key: "posts_published", label: "Awareness posts published" },
  { key: "live_sessions_count", label: "Live sessions hosted" },
  {
    key: "approved_contributions_referred",
    label: "Approved contributions from referrals",
  },
  { key: "manual", label: "Manual / admin-awarded only" },
];

// ─── DRIVES ADMIN PANEL ───────────────────────────────────────────────────
//
//   Two-pane layout: left side lists every approved influencer with a
//   quick summary (registered / attended / promoted / promo reach), and
//   the right pane shows the selected influencer's drive activity
//   broken into Registrations + Promotions.
//
//   Data sources:
//     GET /admin/influencers/drives-summary        — left roster
//     GET /admin/influencers/:id/drives            — right detail
//
// NGO drive approval lives in NGO Partners → Donation Drives (not here).
// This tab focuses on per-influencer activity: who promoted what drive,
// who joined which, and the totals admin uses to spot stars.
const DrivesAdminPanel = () => {
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadingRoster(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/influencers/drives-summary`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      })
      .then((r) => {
        if (cancelled) return;
        const list = r?.data?.data?.influencers || [];
        setRoster(list);
        if (list.length > 0 && !selectedId) setSelectedId(list[0].influencerId);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoadingRoster(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    axios
      .get(
        `${import.meta.env.VITE_API_URL}/influencers/${selectedId}/drives`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      )
      .then((r) => !cancelled && setDetail(r?.data?.data || null))
      .catch(() => !cancelled && setDetail(null))
      .finally(() => !cancelled && setLoadingDetail(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filteredRoster = roster.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.name || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.niche || "").toLowerCase().includes(q)
    );
  });

  const selected = roster.find((r) => r.influencerId === selectedId);

  return (
    <div className="row g-3">
      {/* Roster */}
      <div className="col-12 col-lg-4">
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #F3F4F6" }}>
            <input
              type="search"
              className="form-control form-control-sm"
              placeholder="Search influencer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loadingRoster ? (
            <div className="text-center text-muted small p-4">Loading…</div>
          ) : filteredRoster.length === 0 ? (
            <div className="text-center text-muted small p-4">
              No approved influencers yet.
            </div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {filteredRoster.map((r) => {
                const active = r.influencerId === selectedId;
                return (
                  <button
                    key={r.influencerId}
                    type="button"
                    onClick={() => setSelectedId(r.influencerId)}
                    style={{
                      width: "100%",
                      display: "block",
                      textAlign: "left",
                      border: "none",
                      padding: "10px 14px",
                      background: active ? "#EEF2FF" : "transparent",
                      borderBottom: "1px solid #F3F4F6",
                      cursor: "pointer",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div style={{ minWidth: 0 }}>
                        <div
                          className="fw-bold"
                          style={{
                            color: active ? "#3730A3" : "#111827",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {r.name}
                        </div>
                        <div className="small text-muted">{r.niche || r.email}</div>
                      </div>
                      <div className="text-end small" style={{ flexShrink: 0 }}>
                        <div style={{ color: "#15803D", fontWeight: 700 }}>
                          {r.promoted} promo
                        </div>
                        <div style={{ color: "#1E40AF" }}>
                          {r.registered} reg
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="col-12 col-lg-8">
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: 16,
            minHeight: 200,
          }}
        >
          {!selected ? (
            <div className="text-center text-muted">Pick an influencer to see their drive activity.</div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-3">
                <div>
                  <h4 className="m-0">{selected.name}</h4>
                  <div className="small text-muted">{selected.email}</div>
                </div>
                <div className="d-flex gap-3 flex-wrap">
                  {[
                    { label: "Registered", value: selected.registered, color: "#1E40AF" },
                    { label: "Attended", value: selected.attended, color: "#15803D" },
                    { label: "Promoted", value: selected.promoted, color: "#6D28D9" },
                    { label: "Promo reach", value: selected.promoReach, color: "#EC4899" },
                  ].map((s) => (
                    <div key={s.label} className="text-end">
                      <div
                        style={{ fontSize: 20, fontWeight: 700, color: s.color }}
                      >
                        {(s.value || 0).toLocaleString()}
                      </div>
                      <div className="small text-muted">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {loadingDetail ? (
                <div className="text-center text-muted small p-3">Loading…</div>
              ) : (
                <>
                  {/* Promotions */}
                  <h6 className="mt-3 mb-2">
                    <i
                      className="ti ti-megaphone me-1"
                      style={{ color: "#6D28D9" }}
                    />
                    Promotions ({detail?.promotions?.length || 0})
                  </h6>
                  {(detail?.promotions || []).length === 0 ? (
                    <div className="small text-muted mb-3">
                      Hasn't promoted any drives yet.
                    </div>
                  ) : (
                    <div className="table-responsive mb-4">
                      <table className="table table-sm" style={{ fontSize: 13 }}>
                        <thead>
                          <tr>
                            <th>Drive</th>
                            <th>Source</th>
                            <th>Platform</th>
                            <th className="text-end">Reach</th>
                            <th className="text-end">Clicks</th>
                            <th>Link</th>
                            <th>When</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detail?.promotions || []).map((p) => (
                            <tr key={p._id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{p.campName}</div>
                                <div className="small text-muted">{p.venue}</div>
                              </td>
                              <td>
                                <span
                                  style={{
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background:
                                      p.source === "NGO" ? "#EFF6FF" : "#F5F3FF",
                                    color: p.source === "NGO" ? "#1E40AF" : "#6D28D9",
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  {p.source}
                                </span>
                              </td>
                              <td>{p.platform || "—"}</td>
                              <td className="text-end">
                                {(p.reach || 0).toLocaleString()}
                              </td>
                              <td className="text-end">
                                {(p.clicks || 0).toLocaleString()}
                              </td>
                              <td>
                                {p.shareUrl ? (
                                  <a
                                    href={p.shareUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Open
                                  </a>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td>{fmtDate(p.promotedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Registrations */}
                  <h6 className="mt-3 mb-2">
                    <i
                      className="ti ti-clipboard-check me-1"
                      style={{ color: "#15803D" }}
                    />
                    Registrations ({detail?.registrations?.length || 0})
                  </h6>
                  {(detail?.registrations || []).length === 0 ? (
                    <div className="small text-muted">
                      Hasn't registered for any drives.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm" style={{ fontSize: 13 }}>
                        <thead>
                          <tr>
                            <th>Drive</th>
                            <th>Source</th>
                            <th>Status</th>
                            <th>Venue date</th>
                            <th>Attended at</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detail?.registrations || []).map((r) => (
                            <tr key={r._id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{r.campName}</div>
                                <div className="small text-muted">{r.venue}</div>
                              </td>
                              <td>
                                <span
                                  style={{
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background:
                                      r.source === "NGO" ? "#EFF6FF" : "#F5F3FF",
                                    color: r.source === "NGO" ? "#1E40AF" : "#6D28D9",
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  {r.source}
                                </span>
                              </td>
                              <td>
                                <span
                                  style={{
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background:
                                      r.status === "attended"
                                        ? "#DCFCE7"
                                        : r.status === "no-show"
                                        ? "#FEE2E2"
                                        : r.status === "cancelled"
                                        ? "#F3F4F6"
                                        : "#EFF6FF",
                                    color:
                                      r.status === "attended"
                                        ? "#15803D"
                                        : r.status === "no-show"
                                        ? "#991B1B"
                                        : r.status === "cancelled"
                                        ? "#6B7280"
                                        : "#1E40AF",
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td>{r.venueDate ? new Date(r.venueDate).toLocaleDateString() : "—"}</td>
                              <td>{fmtDate(r.attendedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const RewardsAdminPanel = () => {
  const { setLoading } = useContext(GlobalContext);
  const [section, setSection] = useState("badges"); // "badges" | "certs"

  // ─── badges state ─────────────────────────────────────────────
  const [badges, setBadges] = useState([]);
  const [editingBadge, setEditingBadge] = useState(null);
  const [badgeForm, setBadgeForm] = useState({
    name: "",
    icon: "🏆",
    description: "",
    criteriaType: "referrals_count",
    criteriaValue: 10,
    points: 100,
    isActive: true,
  });
  const resetBadgeForm = () => {
    setBadgeForm({
      name: "",
      icon: "🏆",
      description: "",
      criteriaType: "referrals_count",
      criteriaValue: 10,
      points: 100,
      isActive: true,
    });
    setEditingBadge(null);
  };

  const loadBadges = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/influencer-rewards/badges`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setBadges(res?.data?.data?.badges || []);
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Could not load badges", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveBadge = async () => {
    if (!badgeForm.name.trim()) {
      return swal("Name required", "", "warning");
    }
    try {
      setLoading(true);
      if (editingBadge) {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/influencer-rewards/badges/${editingBadge._id}`,
          badgeForm,
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/influencer-rewards/badges`,
          badgeForm,
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
              "Content-Type": "application/json",
            },
          }
        );
      }
      resetBadgeForm();
      await loadBadges();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Could not save badge", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteBadge = async (id) => {
    const ok = await swal({
      title: "Delete this badge?",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/influencer-rewards/badges/${id}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      await loadBadges();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Could not delete", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── certificates state ───────────────────────────────────────
  const [certs, setCerts] = useState([]);
  const [certForm, setCertForm] = useState({
    name: "",
    description: "",
    templateFile: "",
    templateMeta: null,
    nameSize: 28,
    nameX: "",
    nameY: "",
  });
  const [certUploading, setCertUploading] = useState(false);
  const resetCertForm = () =>
    setCertForm({
      name: "",
      description: "",
      templateFile: "",
      templateMeta: null,
      nameSize: 28,
      nameX: "",
      nameY: "",
    });

  const loadCerts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/influencer-rewards/certificates`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setCerts(res?.data?.data?.certificates || []);
    } catch (err) {
      swal(
        "Error",
        err?.response?.data?.error || "Could not load certificates",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Same presigned-S3 flow we already use for awareness-post attachments.
  const uploadCertTemplate = async (file) => {
    if (!file) return;
    const apiRoot = (import.meta.env.VITE_API_URL || "").replace(
      /\/admin\/?$/,
      ""
    );
    setCertUploading(true);
    try {
      const sigRes = await axios.post(
        `${apiRoot}/upload-test`,
        {
          name: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
        },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
            "Content-Type": "application/json",
          },
        }
      );
      const presigned = sigRes?.data?.data;
      if (!presigned?.url || !presigned?.fields)
        throw new Error("Bad presigned response");
      const form = new FormData();
      Object.entries(presigned.fields).forEach(([k, v]) =>
        form.append(k, v)
      );
      form.append("file", file);
      await fetch(presigned.url, { method: "POST", body: form });
      await axios.post(
        `${apiRoot}/upload-ack`,
        { fid: presigned._id },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
            "Content-Type": "application/json",
          },
        }
      );
      setCertForm((f) => ({
        ...f,
        templateFile: presigned._id,
        templateMeta: {
          name: file.name,
          mime: file.type,
          size: file.size,
          url: sigRes?.data?.url,
        },
      }));
    } catch (err) {
      swal(
        "Upload failed",
        err?.response?.data?.error || err?.message || "Try again",
        "error"
      );
    } finally {
      setCertUploading(false);
    }
  };

  const saveCert = async () => {
    if (!certForm.name.trim())
      return swal("Name required", "", "warning");
    if (!certForm.templateFile)
      return swal("Upload a template first", "", "warning");
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/influencer-rewards/certificates`,
        {
          name: certForm.name.trim(),
          description: certForm.description.trim(),
          templateFile: certForm.templateFile,
          nameSize: Number(certForm.nameSize) || 28,
          nameX: certForm.nameX === "" ? null : Number(certForm.nameX),
          nameY: certForm.nameY === "" ? null : Number(certForm.nameY),
        },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
            "Content-Type": "application/json",
          },
        }
      );
      resetCertForm();
      await loadCerts();
    } catch (err) {
      swal(
        "Error",
        err?.response?.data?.error || "Could not save certificate",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteCert = async (id) => {
    const ok = await swal({
      title: "Delete this certificate?",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/influencer-rewards/certificates/${id}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      await loadCerts();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Could not delete", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
    loadCerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* sub-section toggle */}
      <div
        className="d-flex flex-wrap gap-2 align-items-center mb-3"
        style={{
          background: "#F3F4F6",
          padding: 6,
          borderRadius: 12,
          border: "1px solid #E5E7EB",
        }}
      >
        {[
          { key: "badges", label: "Badges", icon: "ti ti-award" },
          { key: "certs", label: "Certificates", icon: "ti ti-certificate" },
        ].map((s) => {
          const active = section === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSection(s.key)}
              style={{
                flex: "1 1 140px",
                padding: "9px 16px",
                borderRadius: 10,
                border: "none",
                background: active
                  ? "linear-gradient(135deg, #FECACA 0%, #FCA5A5 100%)"
                  : "transparent",
                color: active ? "#7F1D1D" : "#374151",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <i className={s.icon} />
              {s.label}
            </button>
          );
        })}
      </div>

      {section === "badges" && (
        <>
          {/* composer */}
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="mb-3">
                <i className="ti ti-award me-2" style={{ color: "#F59E0B" }} />
                {editingBadge ? "Edit badge" : "Create a badge"}
              </h5>
              <div className="row g-3">
                <div className="col-md-1">
                  <label className="form-label fw-bold small">Icon</label>
                  <input
                    type="text"
                    className="form-control text-center"
                    value={badgeForm.icon}
                    maxLength={3}
                    onChange={(e) =>
                      setBadgeForm({ ...badgeForm, icon: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label fw-bold small">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 10 Referrals"
                    value={badgeForm.name}
                    onChange={(e) =>
                      setBadgeForm({ ...badgeForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small">Criteria type</label>
                  <select
                    className="form-select"
                    value={badgeForm.criteriaType}
                    onChange={(e) =>
                      setBadgeForm({
                        ...badgeForm,
                        criteriaType: e.target.value,
                      })
                    }
                  >
                    {CRITERIA_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small">Target</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    value={badgeForm.criteriaValue}
                    onChange={(e) =>
                      setBadgeForm({
                        ...badgeForm,
                        criteriaValue: Number(e.target.value),
                      })
                    }
                    disabled={badgeForm.criteriaType === "manual"}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small">Points</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    value={badgeForm.points}
                    onChange={(e) =>
                      setBadgeForm({
                        ...badgeForm,
                        points: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-md-9">
                  <label className="form-label fw-bold small">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Optional short description"
                    value={badgeForm.description}
                    onChange={(e) =>
                      setBadgeForm({
                        ...badgeForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div
                className="d-flex justify-content-end gap-2 mt-3 pt-3"
                style={{ borderTop: "1px solid #F3F4F6" }}
              >
                {editingBadge && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={resetBadgeForm}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveBadge}
                >
                  <i
                    className={`ti ${
                      editingBadge ? "ti-device-floppy" : "ti-plus"
                    } me-1`}
                  />
                  {editingBadge ? "Save changes" : "Add badge"}
                </button>
              </div>
            </div>
          </div>

          {/* list */}
          <div className="card">
            <div className="card-body">
              {badges.length === 0 ? (
                <p className="m-5 p-5 fs-4 text-center text-muted">
                  No badges yet. Use the composer above to add one.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 12,
                  }}
                >
                  {badges.map((b) => (
                    <div
                      key={b._id}
                      className="border rounded p-3"
                      style={{ background: "#FFFFFF" }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span style={{ fontSize: 28 }}>{b.icon}</span>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="fw-bold">{b.name}</div>
                          <div className="small text-muted">
                            {b.criteriaType === "manual"
                              ? "Manual"
                              : `${
                                  CRITERIA_OPTIONS.find(
                                    (o) => o.key === b.criteriaType
                                  )?.label || b.criteriaType
                                } · target ${b.criteriaValue}`}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#92400E",
                            background: "#FEF3C7",
                          }}
                        >
                          {b.points} pts
                        </span>
                      </div>
                      {b.description && (
                        <div className="small text-muted mb-2">
                          {b.description}
                        </div>
                      )}
                      <div
                        className="d-flex gap-2 mt-2 pt-2"
                        style={{ borderTop: "1px solid #F3F4F6" }}
                      >
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => {
                            setEditingBadge(b);
                            setBadgeForm({
                              name: b.name,
                              icon: b.icon,
                              description: b.description || "",
                              criteriaType: b.criteriaType,
                              criteriaValue: b.criteriaValue,
                              points: b.points,
                              isActive: b.isActive,
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <i className="ti ti-edit me-1" /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm ms-auto"
                          onClick={() => deleteBadge(b._id)}
                        >
                          <i className="ti ti-trash me-1" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {section === "certs" && (
        <>
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="mb-3">
                <i
                  className="ti ti-certificate me-2"
                  style={{ color: "#F59E0B" }}
                />
                Upload a certificate template
              </h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Certified Influencer 2026"
                    value={certForm.name}
                    onChange={(e) =>
                      setCertForm({ ...certForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Optional"
                    value={certForm.description}
                    onChange={(e) =>
                      setCertForm({
                        ...certForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-bold small">
                    Template file (PNG, JPG, or PDF)
                  </label>
                  <label
                    htmlFor="cert-file"
                    style={{
                      display: "block",
                      border: "2px dashed #CBD5E1",
                      borderRadius: 10,
                      padding: "16px",
                      background: "#F8FAFC",
                      color: "#475569",
                      fontSize: 13,
                      textAlign: "center",
                      cursor: certUploading ? "wait" : "pointer",
                    }}
                  >
                    <i
                      className="ti ti-cloud-upload"
                      style={{ fontSize: 22 }}
                    />{" "}
                    {certUploading
                      ? "Uploading…"
                      : certForm.templateMeta
                      ? `Uploaded: ${certForm.templateMeta.name}`
                      : "Click to upload a certificate template"}
                    <input
                      id="cert-file"
                      type="file"
                      accept="image/png,image/jpeg,application/pdf"
                      disabled={certUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadCertTemplate(f);
                        e.target.value = "";
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                  <small className="text-muted">
                    Leave X blank to center the name horizontally. Y is
                    measured from the bottom of the page (PDF points).
                  </small>
                </div>

                {/* Admin-controlled name placement on the certificate. */}
                <div className="col-md-4">
                  <label className="form-label fw-bold small">
                    Font size (pt)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min={6}
                    max={200}
                    value={certForm.nameSize}
                    onChange={(e) =>
                      setCertForm({
                        ...certForm,
                        nameSize: e.target.value,
                      })
                    }
                    placeholder="28"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold small">
                    X (from left, pt)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={certForm.nameX}
                    onChange={(e) =>
                      setCertForm({ ...certForm, nameX: e.target.value })
                    }
                    placeholder="Leave blank to center"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold small">
                    Y (from bottom, pt)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={certForm.nameY}
                    onChange={(e) =>
                      setCertForm({ ...certForm, nameY: e.target.value })
                    }
                    placeholder="e.g. 400"
                  />
                </div>
              </div>
              <div
                className="d-flex justify-content-end gap-2 mt-3 pt-3"
                style={{ borderTop: "1px solid #F3F4F6" }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveCert}
                >
                  <i className="ti ti-plus me-1" /> Add certificate
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              {certs.length === 0 ? (
                <p className="m-5 p-5 fs-4 text-center text-muted">
                  No certificate templates uploaded yet.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 12,
                  }}
                >
                  {certs.map((c) => (
                    <div
                      key={c._id}
                      className="border rounded p-3"
                      style={{ background: "#FFFFFF" }}
                    >
                      <div className="d-flex align-items-start gap-2 mb-2">
                        <i
                          className="ti ti-certificate"
                          style={{ fontSize: 28, color: "#F59E0B" }}
                        />
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="fw-bold">{c.name}</div>
                          {c.description && (
                            <div className="small text-muted">
                              {c.description}
                            </div>
                          )}
                          {c.templateFile?.name && (
                            <a
                              href={c.templateFile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="small"
                              style={{ wordBreak: "break-all" }}
                            >
                              {c.templateFile.name}
                            </a>
                          )}
                          <div
                            className="small text-muted mt-1"
                            style={{ fontFamily: "monospace" }}
                          >
                            size: {c.nameSize || 28}pt · X:{" "}
                            {c.nameX === null || c.nameX === undefined
                              ? "center"
                              : c.nameX}{" "}
                            · Y:{" "}
                            {c.nameY === null || c.nameY === undefined
                              ? "auto"
                              : c.nameY}
                          </div>
                        </div>
                      </div>
                      <div
                        className="d-flex gap-2 mt-2 pt-2"
                        style={{ borderTop: "1px solid #F3F4F6" }}
                      >
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm ms-auto"
                          onClick={() => deleteCert(c._id)}
                        >
                          <i className="ti ti-trash me-1" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Admin Media Kit panel ────────────────────────────────────────────────
//
//   Browse every approved influencer's media kit from one place. Lists
//   all approved influencers across the top with a search box; clicking
//   one loads their kit (profile / approved socials / audience snapshot
//   / uploaded portfolio + published posts) on the right.
//
//   Reuses GET /admin/influencers?status=approved and
//   GET /admin/influencers/:id/media-kit (both already exist).

const SOCIAL_META_ADMIN = {
  instagram: { label: "Instagram", icon: "ti ti-brand-instagram", color: "#E1306C" },
  youtube: { label: "YouTube", icon: "ti ti-brand-youtube", color: "#FF0000" },
  twitter: { label: "Twitter / X", icon: "ti ti-brand-twitter", color: "#1DA1F2" },
  facebook: { label: "Facebook", icon: "ti ti-brand-facebook", color: "#1877F2" },
  linkedin: { label: "LinkedIn", icon: "ti ti-brand-linkedin", color: "#0A66C2" },
  threads: { label: "Threads", icon: "ti ti-brand-threads", color: "#000000" },
  other: { label: "Other", icon: "ti ti-link", color: "#6B7280" },
};

const MediaKitAdminPanel = () => {
  const { setLoading } = useContext(GlobalContext);
  const [list, setList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [kit, setKit] = useState(null);
  const [kitLoading, setKitLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadList = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("status", "approved");
      params.append("limit", "100");
      if (search.trim()) params.append("search", search.trim());
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/influencers?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      const rows = res?.data?.data?.influencers || [];
      setList(rows);
      if (!selectedId && rows.length > 0) {
        setSelectedId(rows[0]._id);
      }
    } catch (err) {
      swal(
        "Error",
        err?.response?.data?.error || "Could not load influencers",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadKit = async (id) => {
    if (!id) return;
    setKitLoading(true);
    setKit(null);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/influencers/${id}/media-kit`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setKit(res?.data?.data || null);
    } catch (err) {
      swal(
        "Error",
        err?.response?.data?.error || "Could not load media kit",
        "error"
      );
    } finally {
      setKitLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) loadKit(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const filtered = list.filter((row) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (row.user?.name || "").toLowerCase().includes(q) ||
      (row.user?.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="row g-3">
      {/* LEFT — influencer roster */}
      <div className="col-lg-4">
        <div className="card" style={{ position: "sticky", top: 8 }}>
          <div className="card-body">
            <input
              type="search"
              className="form-control mb-3"
              placeholder="Search approved influencers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div
              className="d-flex flex-column gap-1"
              style={{ maxHeight: "65vh", overflowY: "auto" }}
            >
              {filtered.length === 0 ? (
                <p className="text-muted small text-center my-4">
                  No approved influencers found.
                </p>
              ) : (
                filtered.map((row) => {
                  const u = row.user || {};
                  const active = selectedId === row._id;
                  return (
                    <button
                      key={row._id}
                      type="button"
                      onClick={() => setSelectedId(row._id)}
                      style={{
                        textAlign: "left",
                        border: `1px solid ${
                          active ? "#FCA5A5" : "#E5E7EB"
                        }`,
                        background: active ? "#FEF2F2" : "#FFFFFF",
                        borderRadius: 10,
                        padding: 10,
                        cursor: "pointer",
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "#EFF6FF",
                          color: "#1E40AF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {initialsOf(u.name)}
                      </div>
                      <div
                        className="flex-grow-1"
                        style={{ minWidth: 0 }}
                      >
                        <div className="fw-bold">
                          {u.name || "Influencer"}
                        </div>
                        <div
                          className="small text-muted"
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.niche || u.email || ""}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — selected influencer's media kit */}
      <div className="col-lg-8">
        {!selectedId ? (
          <div className="card">
            <div className="card-body text-center text-muted py-5">
              Select an influencer on the left to view their media kit.
            </div>
          </div>
        ) : kitLoading ? (
          <div className="card">
            <div className="card-body text-center text-muted py-5">
              Loading media kit…
            </div>
          </div>
        ) : !kit ? (
          <div className="card">
            <div className="card-body text-center text-muted py-5">
              No media kit available.
            </div>
          </div>
        ) : (
          <>
            {/* Hero / Profile */}
            <div
              className="card mb-3"
              style={{
                background:
                  "linear-gradient(135deg, #FEE2E2 0%, #FECACA 60%, #FCA5A5 100%)",
                border: "1px solid #FCA5A5",
              }}
            >
              <div className="card-body d-flex flex-wrap align-items-center" style={{ gap: 20 }}>
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #B91C1C, #F87171)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 30,
                    border: "4px solid #FFFFFF",
                    overflow: "hidden",
                    backgroundImage: kit.profile?.avatar
                      ? `url("${kit.profile.avatar}")`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    flexShrink: 0,
                  }}
                >
                  {!kit.profile?.avatar && initialsOf(kit.profile?.name)}
                </div>
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#7F1D1D",
                      lineHeight: 1.2,
                    }}
                  >
                    {kit.profile?.name || "—"}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#991B1B",
                      marginTop: 4,
                    }}
                  >
                    {kit.profile?.niche || "Influencer"}
                    {kit.profile?.audienceSize > 0
                      ? ` · ${kit.profile.audienceSize.toLocaleString()} audience`
                      : ""}
                  </div>
                  {kit.profile?.bio && (
                    <p
                      className="mt-2 mb-0 small"
                      style={{ color: "#7F1D1D" }}
                    >
                      {kit.profile.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Audience snapshot */}
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="mb-3">Audience snapshot</h5>
                <div className="d-flex flex-wrap gap-2">
                  {[
                    {
                      label: "Published posts",
                      value: kit.audience?.publishedPosts || 0,
                    },
                    {
                      label: "Total reach",
                      value: kit.audience?.totalReach || 0,
                    },
                    {
                      label: "Referrals",
                      value: kit.audience?.referralsCount || 0,
                    },
                    {
                      label: "Contributions",
                      value: kit.audience?.approvedContributions || 0,
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        flex: "1 1 130px",
                        background: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        borderRadius: 10,
                        padding: "10px 12px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        className="small text-muted"
                        style={{ fontWeight: 600 }}
                      >
                        {s.label}
                      </div>
                      <div
                        className="fw-bold"
                        style={{ fontSize: 20, color: "#111827" }}
                      >
                        {Number(s.value).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Approved socials */}
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="mb-3">Approved social profiles</h5>
                {(kit.social || []).length === 0 ? (
                  <p className="text-muted small m-0">
                    No approved social links.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {kit.social.map((s, i) => {
                      const meta =
                        SOCIAL_META_ADMIN[s.platform] ||
                        SOCIAL_META_ADMIN.other;
                      return (
                        <div
                          key={`${s.platform}-${i}`}
                          className="d-flex align-items-center gap-2 border rounded p-2"
                          style={{ background: "#FFFFFF" }}
                        >
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
                            style={{ minWidth: 110, flexShrink: 0 }}
                          >
                            {meta.label}
                          </div>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flex: 1,
                              wordBreak: "break-all",
                              color: "#1E40AF",
                            }}
                          >
                            {s.url}
                          </a>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-secondary btn-sm"
                            title="Open"
                          >
                            <i className="ti ti-external-link" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded portfolio */}
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="mb-3">
                  Uploaded portfolio (
                  {(kit.uploadedPortfolio || []).length})
                </h5>
                {(kit.uploadedPortfolio || []).length === 0 ? (
                  <p className="text-muted small m-0">
                    No portfolio items uploaded yet.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {kit.uploadedPortfolio.map((it) => (
                      <a
                        key={it._id}
                        href={it.file?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          position: "relative",
                          aspectRatio: "1 / 1",
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#F3F4F6",
                          display: "block",
                        }}
                        title={
                          it.kind === "video" ? "Reel" : "Photo"
                        }
                      >
                        {it.kind === "video" ? (
                          <video
                            src={it.file?.url}
                            muted
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <img
                            src={it.file?.url}
                            alt={it.file?.name || ""}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <span
                          style={{
                            position: "absolute",
                            bottom: 6,
                            left: 6,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "rgba(0,0,0,0.6)",
                            color: "#FFFFFF",
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {it.kind === "video" ? "Reel" : "Photo"}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Published-post portfolio */}
            <div className="card">
              <div className="card-body">
                <h5 className="mb-3">
                  Published posts ({(kit.portfolio || []).length})
                </h5>
                {(kit.portfolio || []).length === 0 ? (
                  <p className="text-muted small m-0">
                    No awareness posts published yet.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {kit.portfolio.map((p) => {
                      const firstImg = (p.attachments || []).find(
                        (a) => a.kind === "image" && a.file
                      );
                      return (
                        <div
                          key={p._id}
                          style={{
                            border: "1px solid #F3F4F6",
                            borderRadius: 10,
                            overflow: "hidden",
                            background: "#FFFFFF",
                          }}
                        >
                          {firstImg ? (
                            <img
                              src={firstImg.file.url}
                              alt={p.title}
                              style={{
                                width: "100%",
                                height: 120,
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                height: 120,
                                background:
                                  "linear-gradient(135deg, #FEE2E2, #F5F3FF)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#7C3AED",
                                fontSize: 32,
                              }}
                            >
                              <i className="ti ti-news" />
                            </div>
                          )}
                          <div style={{ padding: 10 }}>
                            <div
                              className="fw-bold"
                              style={{
                                fontSize: 13,
                                lineHeight: 1.3,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {p.title}
                            </div>
                            <div className="small text-muted">
                              {p.reach > 0
                                ? `${p.reach.toLocaleString()} reach`
                                : "Reach pending"}
                              {p.publishedAt
                                ? ` · ${new Date(
                                    p.publishedAt
                                  ).toLocaleDateString()}`
                                : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Influencer;
