import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { GlobalContext } from "../GlobalContext";
import SEO from "../SEO";

/*
============================================================================
  OLD VIEW — preserved for reference, commented out per request 2026-05.

  The page used to list ContributionRequests (the cause cards admins create),
  with a filter for vendor/direct/deliver requests and a 'Add Contribution
  Request' button. That UI now lives elsewhere; this page is being repurposed
  to show the donor submissions instead, mirroring the three Contribute tabs
  on the user side (Cause / Kind / Deliver).

  Imports kept above so re-enabling is just an uncomment.

  import { Link } from "react-router-dom";
  import Pagination from "../Components/Pagination";
  import PageDetails from "../Components/PageDetails";
  import ContributionFilter from "../Components/ContrubutionFilter";
  import AddContribution from "../Components/AddContribution";

  const Contribution = () => {
    const [contributions, setContributions] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [showAddContributionForm, setShowAddContributionForm] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const { setLoading } = useContext(GlobalContext);
    const [isLoading, setIsLoading] = useState(true);
    const [refresh, setRefresh] = useState(false);
    const [contributionType, setContributionType] = useState("All");
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
      const getData = async () => {
        const res = await axios.get(
          `${import.meta.env.VITE_API_CONTRI}/contributionreqadmin?contributionType=${contributionType}&searchText=${searchText}&currentPage=${currentPage}&limit=${limit}`
        );
        setTotalCount(res.data.totalCount);
        setContributions(res.data.requests);
      };
      getData();
    }, [contributionType, searchText, limit, currentPage, refresh]);

    return (
      <div className="content-wrapper">
        // ...full ContributionRequest table here...
      </div>
    );
  };
============================================================================
*/

// Visual config for the three tabs, matching the three user-side Contribute
// pages. `flag` is what we send to /contribution?type=...
const TABS = [
  {
    key: "direct",
    label: "Contribute to Cause",
    description: "Direct money donations made via Razorpay (auto-approved).",
    icon: "ti ti-heart-handshake",
    color: "#0EA5E9",
  },
  {
    key: "vendor",
    label: "Contribute in Kind",
    description: "Vendor / UPI proof submissions awaiting verification.",
    icon: "ti ti-qrcode",
    color: "#8B5CF6",
  },
  {
    key: "deliver",
    label: "Contribute in Kind & Deliver",
    description: "Donors sending items directly. Coordinate pickup / drop-off.",
    icon: "ti ti-truck-delivery",
    color: "#F59E0B",
  },
];

const statusPill = (status) => {
  const base = {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "capitalize",
    letterSpacing: 0.3,
  };
  if (status === "approved")
    return { ...base, background: "rgba(34,197,94,0.12)", color: "#16a34a" };
  if (status === "denied")
    return { ...base, background: "rgba(239,68,68,0.12)", color: "#dc2626" };
  if (status === "pending")
    return { ...base, background: "rgba(245,158,11,0.14)", color: "#b45309" };
  return { ...base, background: "#f3f4f6", color: "#6b7280" };
};

const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    <div style={{ lineHeight: 1.4 }}>
      <div style={{ fontWeight: 600 }}>{d.toLocaleDateString()}</div>
      <div style={{ fontSize: 11, color: "#6b7280" }}>
        {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
};

// Render uploaded proof files (UPI screenshots for vendor / receipts for
// deliver). Images get a clickable thumbnail; PDFs / other types get a labelled
// "View" pill. Falls back to "—" when the donor didn't attach anything.
const renderProofs = (row) => {
  const proofs = row.proofs || [];
  if (!proofs.length) {
    return <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>;
  }
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {proofs.map((p) => {
        if (!p || !p.url) return null;
        const isImage = (p.mime || "").startsWith("image/");
        if (isImage) {
          return (
            <a
              key={p._id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              title={p.name || "View screenshot"}
              style={{
                display: "block",
                width: 48,
                height: 48,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
              }}
            >
              <img
                src={p.url}
                alt={p.name || "proof"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </a>
          );
        }
        const isPdf = (p.mime || "").includes("pdf");
        return (
          <a
            key={p._id}
            href={p.url}
            target="_blank"
            rel="noreferrer"
            title={p.name || "View file"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              fontSize: 11,
              fontWeight: 600,
              color: "#374151",
              textDecoration: "none",
              maxWidth: 140,
            }}
          >
            <i
              className={isPdf ? "fa-solid fa-file-pdf" : "fa-solid fa-file"}
              style={{ color: isPdf ? "#dc2626" : "#6b7280" }}
            ></i>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {p.name || "File"}
            </span>
          </a>
        );
      })}
    </div>
  );
};

// Items / notes cell. For single-item rows we render the item inline; for
// multi-item rows we collapse to a "View N items" link that opens the full
// detail page (otherwise the row gets very tall and hard to scan).
const renderItemsOrNote = (row, onOpenDetail) => {
  if (row.sponsoredItems && row.sponsoredItems.length > 0) {
    if (row.sponsoredItems.length > 1) {
      return (
        <div>
          <button
            type="button"
            onClick={() => onOpenDetail(row)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 999,
              border: "1px solid #C0392B",
              background: "rgba(192,57,43,0.06)",
              color: "#C0392B",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <i className="ti ti-list-details"></i>
            View {row.sponsoredItems.length} items
            <i className="ti ti-arrow-right"></i>
          </button>
          {row.notes && (
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                fontStyle: "italic",
                marginTop: 6,
              }}
            >
              {row.notes}
            </div>
          )}
        </div>
      );
    }
    // Single item — keep inline so admin can scan without a click.
    const i = row.sponsoredItems[0];
    return (
      <div>
        <div style={{ fontSize: 12 }}>
          <span style={{ fontWeight: 600 }}>{i.itemName}</span>
          <span style={{ color: "#6b7280" }}> × {i.sponsorQuantity}</span>
        </div>
        {row.notes && (
          <div
            style={{
              fontSize: 11,
              color: "#6b7280",
              fontStyle: "italic",
              marginTop: 4,
            }}
          >
            {row.notes}
          </div>
        )}
      </div>
    );
  }
  if (row.isAmountOnly) {
    return (
      <span style={{ color: "#6b7280", fontSize: 12 }}>
        Amount-only{row.isRecurring ? " (monthly)" : ""}
      </span>
    );
  }
  if (row.notes) return <span style={{ fontSize: 12 }}>{row.notes}</span>;
  return <span style={{ color: "#9ca3af" }}>—</span>;
};

const Contribution = () => {
  const navigate = useNavigate();
  const { alert } = useContext(GlobalContext);

  const [activeTab, setActiveTab] = useState("direct");
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const fetchByType = async (type) => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_CONTRI}/contribution?type=${type}`
      );
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("failed to load contributions:", err);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchByType(activeTab);
  }, [activeTab, refreshTick]);

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_CONTRI}/contributionup/${id}`,
        { status: newStatus }
      );
      setRefreshTick((t) => t + 1);
      if (alert) alert("success", `Marked as ${newStatus}`);
    } catch (err) {
      console.error(err);
      if (alert) alert("error", "Failed to update status");
    }
  };

  // Client-side filtering on top of the type-filtered server payload.
  const filtered = rows.filter((row) => {
    if (statusFilter !== "all" && row.status !== statusFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      const donorName = (row.user?.name || "").toLowerCase();
      const donorEmail = (row.user?.email || "").toLowerCase();
      const itemNames = (row.sponsoredItems || [])
        .map((i) => i.itemName)
        .join(" ")
        .toLowerCase();
      const notes = (row.notes || "").toLowerCase();
      if (
        !donorName.includes(q) &&
        !donorEmail.includes(q) &&
        !itemNames.includes(q) &&
        !notes.includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  // Per-tab totals (computed over the unfiltered list so the chips reflect the
  // full server response rather than the current search/status slice).
  const counts = rows.reduce(
    (acc, r) => {
      acc.total += 1;
      acc[r.status] = (acc[r.status] || 0) + 1;
      acc.amount += Number(r.contributionAmount || 0);
      return acc;
    },
    { total: 0, pending: 0, approved: 0, denied: 0, amount: 0 }
  );

  const activeMeta = TABS.find((t) => t.key === activeTab);

  return (
    <>
      <SEO title="Contributions" />
      <div className="content-wrapper">
        <div className="d-flex mb-3 justify-content-between align-items-center flex-wrap">
          <div>
            <p className="card-title p-0 m-0">Contributions</p>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Donor submissions across the three Contribute flows.
            </p>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/vendor")}
              style={{ borderRadius: 5 }}
            >
              <i className="fa-solid fa-store me-2"></i>
              Manage Vendors
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => navigate("/donations-report")}
              style={{ borderRadius: 5 }}
            >
              <i className="fa-solid fa-chart-line me-2"></i>
              Donations Report
            </button>
          </div>
        </div>

        {/* ===== Tabs ===== */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {TABS.map((t) => {
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
                  ></i>
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
                <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4 }}>
                  {t.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* ===== Summary chips for active tab ===== */}
        <div
          className="card mb-3"
          style={{ border: `1px solid ${activeMeta?.color}33` }}
        >
          <div className="card-body" style={{ padding: "14px 18px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Total
                </div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {counts.total}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Total Amount
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: activeMeta?.color,
                  }}
                >
                  {fmtMoney(counts.amount)}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#b45309",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Pending
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#b45309" }}>
                  {counts.pending || 0}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#16a34a",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Approved
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#16a34a" }}>
                  {counts.approved || 0}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#dc2626",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Denied
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#dc2626" }}>
                  {counts.denied || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Filters + table ===== */}
        <div className="card">
          <div className="card-body">
            <div
              className="d-flex justify-content-between align-items-center mb-3 flex-wrap"
              style={{ gap: 10 }}
            >
              <div className="d-flex gap-2 flex-wrap">
                {["all", "pending", "approved", "denied"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      border:
                        statusFilter === s
                          ? "1.5px solid #111827"
                          : "1.5px solid #e5e7eb",
                      background: statusFilter === s ? "#111827" : "#fff",
                      color: statusFilter === s ? "#fff" : "#374151",
                      textTransform: "capitalize",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Search donor name / email / items / notes…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="form-control"
                style={{ maxWidth: 320 }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  fontSize: 13,
                  minWidth: 760,
                }}
              >
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {[
                      { label: "Donor", width: null },
                      // Amount hidden on the Deliver tab — donors give items,
                      // not money, so the column is always ₹0 there.
                      activeTab !== "deliver" && { label: "Amount", width: 110 },
                      // Items / Notes hidden on the Vendor (Kind) tab — UPI
                      // proofs rarely carry item lists, and notes show up
                      // alongside the proof thumbnail instead.
                      activeTab !== "vendor" && { label: "Items / Notes", width: null },
                      // Proofs only meaningful on vendor / deliver tabs.
                      activeTab !== "direct" && { label: "Proofs", width: 180 },
                      { label: "Date & Time", width: 140 },
                      { label: "Status", width: 110 },
                      { label: "Actions", width: 160 },
                    ].filter(Boolean).map((h) => (
                      <th
                        key={h.label}
                        style={{
                          padding: "12px 14px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          borderBottom: "1px solid #e5e7eb",
                          width: h.width || "auto",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Column count per tab (all 6 today):
                    //  direct  → Donor, Amount, Items/Notes, Date&Time, Status, Actions
                    //  vendor  → Donor, Amount, Proofs, Date&Time, Status, Actions
                    //  deliver → Donor, Items/Notes, Proofs, Date&Time, Status, Actions
                    const colCount = 6;
                    if (isLoading) {
                      return Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx}>
                          {Array.from({ length: colCount }).map((__, ci) => (
                            <td
                              key={ci}
                              style={{
                                padding: "12px 14px",
                                borderBottom: "1px solid #f3f4f6",
                              }}
                            >
                              <Skeleton height={20} />
                            </td>
                          ))}
                        </tr>
                      ));
                    }
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan={colCount}
                            style={{
                              padding: "40px 16px",
                              textAlign: "center",
                              color: "#6b7280",
                            }}
                          >
                            No contributions found for this filter.
                          </td>
                        </tr>
                      );
                    }
                    return null;
                  })()}
                  {!isLoading && filtered.length > 0 && (
                    filtered.map((row) => {
                      const isPending = row.status === "pending";
                      return (
                        <tr key={row._id}>
                          <td
                            style={{
                              padding: "12px 14px",
                              borderBottom: "1px solid #f3f4f6",
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>
                              {row.user?.name || "—"}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>
                              {row.user?.email || row.user?.phone || ""}
                            </div>
                          </td>
                          {activeTab !== "deliver" && (
                            <td
                              style={{
                                padding: "12px 14px",
                                borderBottom: "1px solid #f3f4f6",
                                fontWeight: 700,
                                color: "#111827",
                              }}
                            >
                              {fmtMoney(row.contributionAmount)}
                            </td>
                          )}
                          {activeTab !== "vendor" && (
                            <td
                              style={{
                                padding: "12px 14px",
                                borderBottom: "1px solid #f3f4f6",
                              }}
                            >
                              {renderItemsOrNote(row, (r) =>
                                navigate(`/contribution-item/${r._id}`, {
                                  state: { contribution: r },
                                })
                              )}
                            </td>
                          )}
                          {activeTab !== "direct" && (
                            <td
                              style={{
                                padding: "12px 14px",
                                borderBottom: "1px solid #f3f4f6",
                              }}
                            >
                              {renderProofs(row)}
                            </td>
                          )}
                          <td
                            style={{
                              padding: "12px 14px",
                              borderBottom: "1px solid #f3f4f6",
                            }}
                          >
                            {fmtDateTime(row.createdAt)}
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              borderBottom: "1px solid #f3f4f6",
                            }}
                          >
                            <span style={statusPill(row.status)}>
                              {row.status || "-"}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 14px",
                              borderBottom: "1px solid #f3f4f6",
                            }}
                          >
                            {isPending ? (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateStatus(row._id, "approved")
                                  }
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    border: "1px solid #16a34a",
                                    background: "#16a34a",
                                    color: "#fff",
                                    cursor: "pointer",
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateStatus(row._id, "denied")
                                  }
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    border: "1px solid #dc2626",
                                    background: "#fff",
                                    color: "#dc2626",
                                    cursor: "pointer",
                                  }}
                                >
                                  Deny
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: "#9ca3af", fontSize: 12 }}>
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contribution;
