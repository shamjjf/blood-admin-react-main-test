/**
 * Admin Volunteer 101 — submissions review.
 *
 *   Two tabs (Beginner / Advanced) list TrainingCompletion submissions made
 *   by volunteers via the client Beginner page. For each row the admin sees:
 *     - volunteer (name + email)
 *     - task title + the admin-defined approvalCriteria
 *     - the volunteer's own description
 *     - uploaded proofs (images / videos / PDFs)
 *     - per-tab pending/approved/rejected status filter
 *
 *   Approving flips status="approved" → counts toward the Trainee badge
 *   (beginner) or Certified Volunteer badge (advanced). Rejecting requires a
 *   reason and notifies the volunteer so they can resubmit.
 *
 *   Note: this page used to manage Onboarding slides. That model still lives
 *   on the backend; if slide management is needed again, restore from git.
 */

import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import EmptyState from "../Components/EmptyState";
import { GlobalContext } from "../GlobalContext";

// Tabs are rendered as card-style buttons matching the admin Contributions
// page (icon + label + description + colored active border).
const LEVELS = [
  {
    key: "beginner",
    label: "Beginner",
    description:
      "Volunteer 101 — the 7 starter tasks. Approve any 5 to award the Trainee badge.",
    icon: "ti ti-school",
    color: "#C0392B",
  },
  {
    key: "advanced",
    label: "Advanced",
    description:
      "Post-Trainee modules. Approvals feed the Certified Volunteer badge.",
    icon: "ti ti-medal",
    color: "#C0392B",
  },
];
const STATUSES = [
  { key: "pending", label: "Pending review", color: "#C0392B" },
  { key: "approved", label: "Approved", color: "#C0392B" },
  { key: "rejected", label: "Rejected", color: "#C0392B" },
];

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "—");

const ProofThumb = ({ proof }) => {
  if (!proof) return null;
  const mime = proof.mime || "";
  if (mime.startsWith("image/")) {
    return (
      <a href={proof.url} target="_blank" rel="noopener noreferrer">
        <img
          src={proof.url}
          alt={proof.name || "proof"}
          style={{
            width: 96,
            height: 96,
            objectFit: "cover",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
          }}
        />
      </a>
    );
  }
  if (mime.startsWith("video/")) {
    // Inline <video> with controls — admin can scrub through the clip.
    return (
      <video
        src={proof.url}
        controls
        style={{
          width: 180,
          height: 120,
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          background: "#000",
        }}
      />
    );
  }
  return (
    <a
      href={proof.url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-sm btn-outline-secondary"
    >
      <i className="ti ti-paperclip me-1" />
      {proof.name || "file"}
    </a>
  );
};

const Onboarding = () => {
  const { setLoading } = useContext(GlobalContext);
  const [activeTab, setActiveTab] = useState("beginner");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [submissions, setSubmissions] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [expanded, setExpanded] = useState({}); // submissionId -> bool
  const [expandedUser, setExpandedUser] = useState({}); // userId -> bool
  const [rejectDraft, setRejectDraft] = useState({}); // submissionId -> reason string

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("level", activeTab);
      if (statusFilter) params.append("status", statusFilter);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/volunteer101/submissions?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setSubmissions(res?.data?.data?.submissions || []);
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
  }, [activeTab, statusFilter]);

  const review = async (sub, decision) => {
    const reason = (rejectDraft[sub._id] || "").trim();
    if (decision === "rejected" && !reason) {
      return swal(
        "Reason required",
        "Tell the volunteer what to fix before resubmitting.",
        "warning"
      );
    }
    const ok = await swal({
      title:
        decision === "approved"
          ? `Approve "${sub.module?.title || "this task"}"?`
          : `Reject "${sub.module?.title || "this task"}"?`,
      text:
        decision === "approved"
          ? "The submission will count toward this volunteer's badge progress."
          : `The volunteer will be asked to resubmit with this feedback:\n\n${reason}`,
      icon: decision === "approved" ? "success" : "warning",
      buttons: ["Cancel", decision === "approved" ? "Approve" : "Reject"],
      dangerMode: decision === "rejected",
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/volunteer101/submissions/${sub._id}/review`,
        { decision, rejectionReason: reason },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
            "Content-Type": "application/json",
          },
        }
      );
      swal(
        "Done",
        decision === "approved" ? "Submission approved" : "Submission rejected",
        "success"
      );
      // Clear the local draft for this row before reloading.
      setRejectDraft((d) => {
        const copy = { ...d };
        delete copy[sub._id];
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

  const headerSubtitle = useMemo(
    () =>
      activeTab === "beginner"
        ? "Beginner tasks — Volunteer 101. Approve any 5 of 7 to award the Trainee badge."
        : "Advanced tasks — post-Trainee training. Approvals feed the Certified Volunteer badge.",
    [activeTab]
  );

  return (
    <>
      <SEO title="Volunteer 101" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-1">Volunteer 101 — Submissions</p>
        <p className="text-muted small mb-3">{headerSubtitle}</p>

        {/* Beginner / Advanced — card-tab style copied from Contributions. */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {LEVELS.map((t) => {
            const active = t.key === activeTab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                style={{
                  flex: "1 1 220px",
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: active
                    ? `2px solid ${t.color}`
                    : "2px solid transparent",
                  background: active ? `${t.color}10` : "#FFFFFF",
                  boxShadow: active
                    ? "0 4px 14px rgba(0,0,0,0.05)"
                    : "0 1px 3px rgba(0,0,0,0.04)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <i
                    className={t.icon}
                    style={{ fontSize: 20, color: t.color }}
                  />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#111827",
                    }}
                  >
                    {t.label}
                  </span>
                </div>
                <div
                  style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4 }}
                >
                  {t.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Status sub-tabs with counts */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`btn btn-sm ${
                statusFilter === s.key ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setStatusFilter(s.key)}
            >
              {s.label}{" "}
              <span
                className="badge ms-1"
                style={{
                  background: s.color,
                  color: "#fff",
                }}
              >
                {counts[s.key] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Two-level list: outer row per VOLUNTEER, click to expand and see */}
        {/* every module that user submitted. This way a volunteer who      */}
        {/* batch-submitted 5 modules is one entry, not 5.                  */}
        {(() => {
          const groups = new Map();
          for (const sub of submissions) {
            const uid = String(sub.user?._id || "unknown");
            if (!groups.has(uid)) {
              groups.set(uid, {
                userId: uid,
                user: sub.user,
                items: [],
                latestAt: sub.submittedAt,
              });
            }
            const g = groups.get(uid);
            g.items.push(sub);
            if (sub.submittedAt && (!g.latestAt || sub.submittedAt > g.latestAt)) {
              g.latestAt = sub.submittedAt;
            }
          }
          // Sort users by most recent submission first.
          const userGroups = Array.from(groups.values()).sort((a, b) => {
            const da = a.latestAt ? new Date(a.latestAt).getTime() : 0;
            const db = b.latestAt ? new Date(b.latestAt).getTime() : 0;
            return db - da;
          });
          if (userGroups.length === 0) {
            return (
              <div className="card">
                <div className="card-body">
                  <EmptyState
                    icon="ti ti-school"
                    title={`No ${statusFilter} submissions in this tab.`}
                  />
                </div>
              </div>
            );
          }
          return (
            <div className="card">
              <div className="card-body">
                {userGroups.map((g) => {
                  const userOpen = !!expandedUser[g.userId];
                  const fullName = [g.user?.firstName, g.user?.lastName]
                    .filter(Boolean)
                    .join(" ")
                    .trim();
                  const displayName =
                    fullName || g.user?.email || "Unknown volunteer";
                  // Per-status counts within this user's submissions (within
                  // the active sub-tab — they're all the same status, but
                  // count tasks across modules for the summary line).
                  const totalTasks = g.items.reduce(
                    (n, s) => n + (s.taskItems?.length || 0),
                    0
                  );
                  return (
                    <div
                      key={g.userId}
                      className="border rounded mb-3"
                      style={{ background: "#fff" }}
                    >
                      {/* Outer row — one per volunteer. */}
                      <div
                        className="d-flex flex-wrap align-items-center gap-2 p-3"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setExpandedUser((e) => ({
                            ...e,
                            [g.userId]: !e[g.userId],
                          }))
                        }
                      >
                        {/* Avatar circle with initials */}
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            background: "#FFF5F5",
                            color: "#C0392B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          {(fullName || g.user?.email || "?")
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((p) => (p[0] || "").toUpperCase())
                            .join("") || "?"}
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-bold">{displayName}</div>
                          <div className="small text-muted">
                            {g.user?.email}
                            {g.user?.email ? " • " : ""}
                            {g.items.length} module
                            {g.items.length === 1 ? "" : "s"}{" "}
                            {statusFilter === "pending"
                              ? "pending review"
                              : statusFilter}
                            {totalTasks
                              ? ` • ${totalTasks} task${
                                  totalTasks === 1 ? "" : "s"
                                } completed`
                              : ""}{" "}
                            • last activity {fmtDate(g.latestAt)}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#FFFFFF",
                            background:
                              (
                                STATUSES.find((s) => s.key === statusFilter) ||
                                STATUSES[0]
                              ).color,
                          }}
                        >
                          {g.items.length}
                        </span>
                        <i
                          className={`ti ${
                            userOpen ? "ti-chevron-up" : "ti-chevron-down"
                          }`}
                        />
                      </div>

                      {/* Drilldown — each module the user submitted. */}
                      {userOpen && (
                        <div
                          className="border-top p-3"
                          style={{ background: "#F9FAFB" }}
                        >
                          {g.items.map((sub) => {
                            const isOpen = !!expanded[sub._id];
                            const statusMeta =
                              STATUSES.find((s) => s.key === sub.status) ||
                              STATUSES[0];
                            return (
                              <div
                                key={sub._id}
                                className="border rounded mb-3"
                                style={{ background: "#FFFFFF" }}
                              >
                                <div
                                  className="d-flex flex-wrap align-items-start gap-2 p-3"
                                  style={{ cursor: "pointer" }}
                                  onClick={() =>
                                    setExpanded((e) => ({
                                      ...e,
                                      [sub._id]: !e[sub._id],
                                    }))
                                  }
                                >
                                  <div className="flex-grow-1">
                                    <div className="fw-bold">
                                      {sub.module?.title || "Untitled task"}
                                    </div>
                                    <div className="small text-muted">
                                      submitted {fmtDate(sub.submittedAt)}
                                      {sub.taskItems?.length ? (
                                        <>
                                          {" "}
                                          • {sub.taskItems.length} task
                                          {sub.taskItems.length === 1
                                            ? ""
                                            : "s"}{" "}
                                          completed
                                        </>
                                      ) : sub.proofs?.length ? (
                                        <> • {sub.proofs.length} proof(s)</>
                                      ) : null}
                                      {sub.testScore?.total > 0 ? (
                                        <>
                                          {" "}
                                          • test {sub.testScore.correct}/
                                          {sub.testScore.total} (
                                          {sub.testScore.percent}%)
                                        </>
                                      ) : null}
                                    </div>
                                  </div>
                                  <span
                                    style={{
                                      padding: "3px 10px",
                                      borderRadius: 10,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: "#FFFFFF",
                                      background: statusMeta.color,
                                    }}
                                  >
                                    {statusMeta.label}
                                  </span>
                                  <i
                                    className={`ti ${
                                      isOpen
                                        ? "ti-chevron-up"
                                        : "ti-chevron-down"
                                    }`}
                                  />
                                </div>

                    {isOpen && (
                      <div
                        className="border-top p-3"
                        style={{ background: "#f9fafb" }}
                      >
                        {sub.module?.approvalCriteria ? (
                          <div className="mb-3">
                            <div className="small text-muted fw-bold">
                              Approval criteria
                            </div>
                            <div style={{ whiteSpace: "pre-wrap" }}>
                              {sub.module.approvalCriteria}
                            </div>
                          </div>
                        ) : null}

                        {/* New per-task view (volunteer ticks tasks → each */}
                        {/* gets its own description + uploads). */}
                        {sub.taskItems?.length ? (
                          <div className="mb-3">
                            <div className="small text-muted fw-bold mb-2">
                              Completed tasks ({sub.taskItems.length})
                            </div>
                            {sub.taskItems.map((ti, idx) => (
                              <div
                                key={`${ti.taskId}-${idx}`}
                                className="border rounded p-3 mb-2"
                                style={{ background: "#FFFFFF" }}
                              >
                                <div className="fw-bold mb-1">
                                  {ti.label || "Task"}
                                </div>
                                <div
                                  className="small mb-2"
                                  style={{ whiteSpace: "pre-wrap" }}
                                >
                                  {ti.description || (
                                    <em className="text-muted">
                                      — no description —
                                    </em>
                                  )}
                                </div>
                                {ti.proofs?.length ? (
                                  <div className="d-flex flex-wrap gap-2">
                                    {ti.proofs.map((p) => (
                                      <ProofThumb key={p._id} proof={p} />
                                    ))}
                                  </div>
                                ) : (
                                  <div
                                    className="small text-muted"
                                    style={{ fontStyle: "italic" }}
                                  >
                                    No proofs uploaded for this task.
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Legacy single-description view for submissions
                          // made before the per-task UI shipped.
                          <>
                            <div className="mb-3">
                              <div className="small text-muted fw-bold">
                                Volunteer&apos;s description
                              </div>
                              <div style={{ whiteSpace: "pre-wrap" }}>
                                {sub.description || (
                                  <em className="text-muted">
                                    — no description —
                                  </em>
                                )}
                              </div>
                            </div>
                            {sub.proofs?.length ? (
                              <div className="mb-3">
                                <div className="small text-muted fw-bold mb-1">
                                  Uploaded proofs ({sub.proofs.length})
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                  {sub.proofs.map((p) => (
                                    <ProofThumb key={p._id} proof={p} />
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </>
                        )}

                        {/* Test answers + score — advanced modules only. */}
                        {sub.testAnswers?.length ? (
                          <div className="mb-3">
                            <div
                              className="fw-bold mb-2 d-flex align-items-center gap-2"
                              style={{
                                fontSize: 15,
                                color: "#374151",
                              }}
                            >
                              <span>Test answers</span>
                              <span
                                style={{
                                  padding: "3px 10px",
                                  borderRadius: 999,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#FFFFFF",
                                  background:
                                    (sub.testScore?.percent || 0) >=
                                    (sub.module?.test?.passingScorePercent || 60)
                                      ? "#C0392B"
                                      : "#C0392B",
                                }}
                              >
                                {sub.testScore?.correct ?? 0}/
                                {sub.testScore?.total ?? 0} ·{" "}
                                {sub.testScore?.percent ?? 0}%
                              </span>
                            </div>
                            {sub.testAnswers.map((a, idx) => {
                              const q = (sub.module?.test?.questions || []).find(
                                (qq) => String(qq._id) === String(a.questionId)
                              );
                              const chosen =
                                q && a.selectedOption >= 0
                                  ? q.options[a.selectedOption]
                                  : "(no answer)";
                              const correctAnswer =
                                q && Number.isFinite(q.correctOption)
                                  ? q.options[q.correctOption]
                                  : null;
                              return (
                                <div
                                  key={`${a.questionId}-${idx}`}
                                  className="border rounded p-3 mb-2"
                                  style={{
                                    background: "#FFFFFF",
                                    fontSize: 15,
                                  }}
                                >
                                  <div
                                    className="fw-bold"
                                    style={{
                                      fontSize: 15,
                                      lineHeight: 1.5,
                                      marginBottom: 6,
                                    }}
                                  >
                                    Q{idx + 1}. {a.questionText || q?.question}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      lineHeight: 1.5,
                                      color: a.isCorrect ? "#C0392B" : "#991B1B",
                                      fontWeight: 500,
                                    }}
                                  >
                                    <i
                                      className={`ti ${
                                        a.isCorrect ? "ti-check" : "ti-x"
                                      } me-1`}
                                    />
                                    Chose: {chosen}
                                  </div>
                                  {!a.isCorrect && correctAnswer ? (
                                    <div
                                      className="text-muted"
                                      style={{
                                        marginLeft: 22,
                                        marginTop: 4,
                                        fontSize: 13.5,
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      Correct: {correctAnswer}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        {sub.status === "rejected" && sub.rejectionReason ? (
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
                              {sub.rejectionReason}
                            </div>
                          </div>
                        ) : null}

                        {sub.status === "pending" ? (
                          <>
                            <div className="mb-2">
                              <label className="form-label small fw-bold">
                                Rejection reason (required to reject)
                              </label>
                              <textarea
                                className="form-control"
                                rows={2}
                                value={rejectDraft[sub._id] || ""}
                                onChange={(e) =>
                                  setRejectDraft((d) => ({
                                    ...d,
                                    [sub._id]: e.target.value,
                                  }))
                                }
                                placeholder="What does the volunteer need to fix?"
                              />
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-primary"
                                onClick={() => review(sub, "approved")}
                              >
                                <i className="ti ti-check me-1" />
                                Approve
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => review(sub, "rejected")}
                              >
                                <i className="ti ti-x me-1" />
                                Reject
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="small text-muted">
                            Reviewed {fmtDate(sub.reviewedAt)}
                            {sub.reviewedBy?.name
                              ? ` by ${sub.reviewedBy.name}`
                              : ""}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
};

export default Onboarding;
