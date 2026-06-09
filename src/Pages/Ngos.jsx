import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import { Link } from "react-router-dom";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";
import EmptyState from "../Components/EmptyState";

// Admin workflow:
//   1. NGOs        — the full NGO account list. A sub-filter (Pending /
//      Approved / All) narrows the rows, and each row can be approved or
//      rejected inline without opening the detail page.
//   2. Docs Pending — an NGO uploaded verification docs that still need an
//      admin yay/nay (reviewed on the detail page).
//   3. hospitalRequests / donationDrives — different data sources rendered in
//      the same chrome.
// NGO Partners follows the app's red/white theme — every tab accent is the
// brand red (no green/blue/amber/teal/purple).
const BRAND_RED = "#c0392b";

const STATUS_TABS = [
  { key: "ngos",             label: "NGOs",              color: BRAND_RED, countKey: "all"              },
  { key: "docsPending",      label: "Documents",         color: BRAND_RED, countKey: "docsPending"      },
  { key: "hospitalRequests", label: "Hospital Requests", color: BRAND_RED, countKey: "hospitalRequests" },
  { key: "donationDrives",   label: "Donation Drives",   color: BRAND_RED, countKey: "donationDrives"   },
];

// Sub-filter buttons shown above the table when the NGOs tab is active.
// "All" leads, followed by the individual statuses.
const NGO_SUBSTATUS_TABS = [
  { key: "all",      label: "All",      color: BRAND_RED, countKey: "all"      },
  { key: "pending",  label: "Pending",  color: BRAND_RED, countKey: "pending"  },
  { key: "approved", label: "Approved", color: BRAND_RED, countKey: "approved" },
  { key: "rejected", label: "Rejected", color: BRAND_RED, countKey: "rejected" },
];

// Sub-filter buttons for the Documents tab — narrows by document review state.
const DOC_SUBSTATUS_TABS = [
  { key: "pending",  label: "Pending",  color: BRAND_RED, countKey: "docsPending"  },
  { key: "approved", label: "Approved", color: BRAND_RED, countKey: "docsApproved" },
  { key: "all",      label: "All",      color: BRAND_RED, countKey: "docsAll"      },
];

// Tag → accent color (for drive rows). Mirrors the NGO frontend.
const DRIVE_TAG_COLORS = {
  "EMERGENCY DRIVE": "#c0392b",
  FEATURED: "#b45309",
  UPCOMING: "#1d4ed8",
  RURAL: "#15803d",
};

// Sub-filter buttons shown above the table when the Donation Drives tab is
// active. Pending / Approved / All — rejected drives still appear under "All".
const DRIVE_SUBSTATUS_TABS = [
  { key: "pending",  label: "Pending",  color: "#c0392b" },
  { key: "approved", label: "Approved", color: "#c0392b" },
  { key: "all",      label: "All",      color: "#c0392b" },
];

// Sub-filter buttons for the Hospital Requests tab — narrows by review state.
const HOSP_SUBSTATUS_TABS = [
  { key: "pending",  label: "Pending",  color: BRAND_RED, countKey: "hospPending"  },
  { key: "approved", label: "Approved", color: BRAND_RED, countKey: "hospApproved" },
  { key: "all",      label: "All",      color: BRAND_RED, countKey: "hospAll"      },
];

// Pill cluster that summarises a row's document review state. Hidden when
// the NGO hasn't submitted anything yet — keeps the table calm for the
// pending-review tab where most rows have zero docs.
const DocSummary = ({ counts }) => {
  if (!counts || counts.total === 0) {
    return <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>;
  }
  const pill = (n, bg, color, title) =>
    n > 0 && (
      <span
        title={title}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 8px",
          borderRadius: 999,
          background: bg,
          color,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {n}
      </span>
    );
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {pill(counts.pending,  "#f3f4f6", "#6b7280", "Pending review")}
      {pill(counts.approved, "rgba(192,57,43,0.12)", "#c0392b", "Approved")}
      {pill(counts.rejected, "#f3f4f6", "#374151", "Rejected")}
      <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 2 }}>
        / {counts.total}
      </span>
    </div>
  );
};

const statusBadge = (status) => {
  const cfg = {
    pending:  { bg: "#f3f4f6", color: "#6b7280", label: "Pending" },
    approved: { bg: "rgba(192,57,43,0.12)", color: "#c0392b", label: "Approved" },
    rejected: { bg: "#f3f4f6", color: "#374151", label: "Rejected" },
    blocked:  { bg: "#f3f4f6", color: "#374151", label: "Blocked" },
  }[status] || {
    bg: "#f3f4f6",
    color: "#374151",
    label: status,
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.color,
        textTransform: "capitalize",
        letterSpacing: 0.3,
      }}
    >
      {cfg.label}
    </span>
  );
};

const Ngos = () => {
  const { setLoading } = useContext(GlobalContext);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState("ngos");
  const [searchText, setSearchText] = useState("");
  // Sub-filter for the NGOs tab (All / Pending / Approved / Rejected).
  const [ngoStatus, setNgoStatus] = useState("all");
  // Sub-filter for the Documents tab (Pending / Approved / All).
  const [docStatus, setDocStatus] = useState("pending");
  // Sub-filter for the Hospital Requests tab (Pending / Approved / All).
  const [hospStatus, setHospStatus] = useState("pending");
  // Sub-filter for the Donation Drives tab.
  const [driveStatus, setDriveStatus] = useState("pending");

  // Auxiliary loader for the Hospital Requests tab — separate endpoint and
  // separate row shape (hospitals vs NGOs). When the user is on any other
  // tab we fall back to the standard /ngos query.
  const load = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: sessionStorage.getItem("auth") };

      if (status === "hospitalRequests") {
        // Pull hospital connections for the chosen sub-status + counts. The
        // backend aggregate returns full counts regardless of the filter.
        const params = new URLSearchParams();
        if (hospStatus && hospStatus !== "all") params.set("status", hospStatus);
        if (searchText) params.set("searchText", searchText);
        const [hospRes, ngosRes, drivesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/ngo-hospitals?${params.toString()}`, { headers }),
          // We also re-fetch /ngos to keep the other tabs' counts fresh.
          axios.get(`${import.meta.env.VITE_API_URL}/ngos`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/donation-drives?status=pending`, { headers }),
        ]);
        const hospCounts = hospRes?.data?.data?.counts || {};
        const ngoCounts = ngosRes?.data?.data?.counts || {};
        const driveItems = drivesRes?.data?.data?.items || [];
        setItems(hospRes?.data?.data?.items || []);
        setCounts({
          ...ngoCounts,
          hospitalRequests: hospCounts.pending ?? 0,
          hospPending: hospCounts.pending ?? 0,
          hospApproved: hospCounts.approved ?? 0,
          hospAll: hospCounts.all ?? 0,
          donationDrives: driveItems.length,
        });
        return;
      }

      if (status === "donationDrives") {
        // Pull drives for the chosen sub-status, plus NGO counts so the other
        // tabs stay current.
        const driveParams = new URLSearchParams();
        if (driveStatus && driveStatus !== "all") driveParams.set("status", driveStatus);
        const [drivesRes, pendingDrivesRes, ngosRes, hospRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/donation-drives?${driveParams.toString()}`, { headers }),
          // Pending-drive count powers the tab badge regardless of sub-filter.
          axios.get(`${import.meta.env.VITE_API_URL}/donation-drives?status=pending`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/ngos`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/ngo-hospitals?status=pending`, { headers }),
        ]);
        const ngoCounts = ngosRes?.data?.data?.counts || {};
        const hospCounts = hospRes?.data?.data?.counts || {};
        const pendingDriveCount = (pendingDrivesRes?.data?.data?.items || []).length;
        setItems(drivesRes?.data?.data?.items || []);
        setCounts({
          ...ngoCounts,
          hospitalRequests: hospCounts.pending ?? 0,
          donationDrives: pendingDriveCount,
        });
        return;
      }

      const params = new URLSearchParams();
      // The NGOs tab filters by its own sub-status; other tabs (docsPending)
      // pass their key straight through. "all" means no status filter.
      const queryStatus = status === "ngos" ? ngoStatus : status;
      if (queryStatus && queryStatus !== "all") params.set("status", queryStatus);
      // Documents tab passes a doc-review sub-status alongside status=docsPending.
      if (status === "docsPending") params.set("docStatus", docStatus);
      if (searchText) params.set("searchText", searchText);
      const [ngosRes, hospRes, drivesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/ngos?${params.toString()}`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/ngo-hospitals?status=pending`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/donation-drives?status=pending`, { headers }),
      ]);
      const ngoCounts = ngosRes?.data?.data?.counts || {};
      const hospCounts = hospRes?.data?.data?.counts || {};
      const pendingDriveCount = (drivesRes?.data?.data?.items || []).length;
      setItems(ngosRes?.data?.data?.items || []);
      setCounts({
        ...ngoCounts,
        hospitalRequests: hospCounts.pending ?? 0,
        donationDrives: pendingDriveCount,
      });
    } catch (err) {
      console.error("load ngos failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Per-row NGO action: approve / reject straight from the list (no need to
  // open the detail page). Approval grants full panel access; rejection needs
  // a reason, which the NGO sees on its login screen.
  const reviewNgo = async (ngo, action) => {
    try {
      if (action === "approve") {
        const ok = await swal({
          title: `Approve "${ngo.name}"?`,
          text: "They'll get full access to their NGO panel.",
          icon: "info",
          buttons: ["Cancel", "Approve"],
        });
        if (!ok) return;
      }
      let reason = "";
      if (action === "reject") {
        reason = await swal({
          title: `Reject "${ngo.name}"?`,
          text: "Provide a reason — the NGO will see this on the login screen.",
          icon: "warning",
          content: { element: "input", attributes: { placeholder: "Reason for rejection" } },
          buttons: ["Cancel", "Reject"],
          dangerMode: true,
        });
        if (!reason) return;
      }
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/ngos/${ngo._id}/${action}`,
        action === "reject" ? { reason } : {},
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      load();
    } catch (err) {
      console.error("ngo review failed:", err);
      swal("Error", err?.response?.data?.error || "Action failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Per-row hospital action: approve or reject in one round-trip and refresh.
  const reviewHospital = async (id, newStatus) => {
    let note = "";
    if (newStatus === "rejected") {
      note = await swal({
        title: "Reject this hospital request?",
        text: "Add a note so the NGO knows why.",
        icon: "warning",
        content: { element: "input", attributes: { placeholder: "Reason" } },
        buttons: ["Cancel", "Reject"],
        dangerMode: true,
      });
      if (note === null) return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/ngo-hospitals/${id}/${
          newStatus === "approved" ? "approve" : "reject"
        }`,
        { note: note || "" },
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      load();
    } catch (err) {
      console.error("hospital review failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Per-row drive action: approve / reject / delete + refresh.
  const reviewDrive = async (drive, action) => {
    try {
      if (action === "approve") {
        const ok = await swal({
          title: `Approve "${drive.title}"?`,
          text: "It will become visible to all NGOs.",
          icon: "info",
          buttons: ["Cancel", "Approve"],
        });
        if (!ok) return;
      }
      let reason = "";
      if (action === "reject") {
        reason = await swal({
          title: `Reject "${drive.title}"?`,
          text: "Optional reason (sent to the NGO):",
          content: "input",
          buttons: ["Cancel", "Reject"],
          dangerMode: true,
        });
        if (reason === null) return;
      }
      if (action === "delete") {
        const ok = await swal({
          title: `Delete "${drive.title}"?`,
          text: "This permanently removes the drive.",
          icon: "warning",
          dangerMode: true,
          buttons: ["Cancel", "Delete"],
        });
        if (!ok) return;
      }

      setLoading(true);
      const headers = { Authorization: sessionStorage.getItem("auth") };
      if (action === "delete") {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/donation-drives/${drive._id}`,
          { headers }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/donation-drives/${drive._id}/${action}`,
          action === "reject" ? { reason: reason || "" } : {},
          { headers }
        );
      }
      load();
    } catch (err) {
      console.error("drive review failed:", err);
      swal("Error", err?.response?.data?.error || "Action failed", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, ngoStatus, docStatus, hospStatus, driveStatus]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <>
      <SEO title="NGO Partners" />
      <div className="content-wrapper">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
          <div>
            <p className="card-title p-0 m-0">NGO Partners</p>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Review and manage partner NGO accounts.
            </p>
          </div>
        </div>

        {/* Status tabs with counts */}
        <div
          style={{
            display: "flex",
            gap: 6,
            borderBottom: "1px solid #e5e7eb",
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = status === tab.key;
            const count = counts[tab.countKey] ?? 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatus(tab.key)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: isActive ? tab.color : "#6b7280",
                  borderBottom: `2px solid ${isActive ? tab.color : "transparent"}`,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {tab.label}
                <span
                  style={{
                    background: isActive ? tab.color : "#e5e7eb",
                    color: isActive ? "white" : "#6b7280",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 8px",
                    borderRadius: 999,
                    minWidth: 22,
                    textAlign: "center",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-filter for the NGOs tab (Pending / Approved / All) */}
        {status === "ngos" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {NGO_SUBSTATUS_TABS.map((s) => {
              const active = ngoStatus === s.key;
              const count = counts[s.countKey] ?? 0;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setNgoStatus(s.key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "1px solid",
                    borderColor: active ? s.color : "#e2e8f0",
                    background: active ? s.color : "white",
                    color: active ? "white" : "#475569",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.12s",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {s.label}
                  <span
                    style={{
                      background: active ? "rgba(255,255,255,0.25)" : "#e5e7eb",
                      color: active ? "white" : "#6b7280",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 999,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-filter for the Documents tab (Pending / Approved / All) */}
        {status === "docsPending" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {DOC_SUBSTATUS_TABS.map((s) => {
              const active = docStatus === s.key;
              const count = counts[s.countKey] ?? 0;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setDocStatus(s.key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "1px solid",
                    borderColor: active ? s.color : "#e2e8f0",
                    background: active ? s.color : "white",
                    color: active ? "white" : "#475569",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.12s",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {s.label}
                  <span
                    style={{
                      background: active ? "rgba(255,255,255,0.25)" : "#e5e7eb",
                      color: active ? "white" : "#6b7280",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 999,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-filter for the Hospital Requests tab (Pending / Approved / All) */}
        {status === "hospitalRequests" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {HOSP_SUBSTATUS_TABS.map((s) => {
              const active = hospStatus === s.key;
              const count = counts[s.countKey] ?? 0;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setHospStatus(s.key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "1px solid",
                    borderColor: active ? s.color : "#e2e8f0",
                    background: active ? s.color : "white",
                    color: active ? "white" : "#475569",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.12s",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {s.label}
                  <span
                    style={{
                      background: active ? "rgba(255,255,255,0.25)" : "#e5e7eb",
                      color: active ? "white" : "#6b7280",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 999,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-filter for donation drives (Pending / Approved / All) */}
        {status === "donationDrives" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {DRIVE_SUBSTATUS_TABS.map((s) => {
              const active = driveStatus === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setDriveStatus(s.key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "1px solid",
                    borderColor: active ? s.color : "#e2e8f0",
                    background: active ? s.color : "white",
                    color: active ? "white" : "#475569",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Search — hidden on the donation drives tab (not yet wired into
            the /donation-drives endpoint) */}
        {status !== "donationDrives" && (
        <form onSubmit={onSearchSubmit} className="mb-3" style={{ maxWidth: 360 }}>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search name, email, city…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button type="submit" className="btn btn-outline-secondary">
              <i className="ti ti-search"></i>
            </button>
          </div>
        </form>
        )}

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: 13,
              minWidth: 760,
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
          >
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {(status === "hospitalRequests"
                  ? ["Hospital", "From NGO", "Phone", "Doctor", "Email", "Submitted", "Actions"]
                  : status === "donationDrives"
                  ? ["Drive", "NGO", "Tag", "Date", "Goal", "Status", "Actions"]
                  : ["NGO", "Contact", "City", "Registered", "Documents", "Status", "Actions"]
                ).map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <EmptyState
                  colSpan={7}
                  icon="ti ti-heart-handshake"
                  title={
                    status === "hospitalRequests"
                      ? "No hospital requests in this view."
                      : status === "donationDrives"
                      ? "No drives in this bucket."
                      : status === "docsPending"
                      ? "No NGOs with documents in this view."
                      : "No NGOs in this view."
                  }
                />
              ) : status === "donationDrives" ? (
                items.map((d) => {
                  const accent = d.image || DRIVE_TAG_COLORS[d.tag] || "#c0392b";
                  return (
                    <tr key={d._id}>
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              width: 4,
                              alignSelf: "stretch",
                              borderRadius: 2,
                              background: accent,
                              minHeight: 28,
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700 }}>{d.title}</div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                              {d.location || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                          {d.ngoSummary?.name || d.organizer || "—"}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          {d.ngoSummary?.email || ""}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            letterSpacing: 0.7,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "white",
                            border: `1px solid ${accent}`,
                            color: accent,
                          }}
                        >
                          {d.tag}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                        {d.date || "—"}
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          {d.daysLeft
                            ? `in ${d.daysLeft} day${d.daysLeft === 1 ? "" : "s"}`
                            : "today / past"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                        <strong>{d.progress || 0}</strong>
                        <span style={{ color: "#9ca3af" }}> / {d.goal || 0}</span>
                      </td>
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                        {(() => {
                          const map = {
                            pending:  { bg: "#f3f4f6", color: "#6b7280", label: "Pending" },
                            approved: { bg: "rgba(192,57,43,0.12)", color: "#c0392b", label: "Approved" },
                            rejected: { bg: "#f3f4f6", color: "#374151", label: "Rejected" },
                          };
                          const s = map[d.status] || map.pending;
                          return (
                            <span
                              title={d.rejectionReason || ""}
                              style={{
                                display: "inline-block",
                                padding: "2px 9px",
                                fontSize: 10.5,
                                fontWeight: 800,
                                background: s.bg,
                                color: s.color,
                                borderRadius: 4,
                                letterSpacing: 0.5,
                              }}
                            >
                              {s.label.toUpperCase()}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          {d.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() => reviewDrive(d, "approve")}
                              className="btn btn-sm"
                              style={{ fontSize: 12.5, padding: "7px 15px", borderRadius: 6, background: "#9C0C0D", color: "#fff", border: "none", fontWeight: 600 }}
                            >
                              <i className="ti ti-check me-1"></i>Approve
                            </button>
                          )}
                          {d.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => reviewDrive(d, "reject")}
                              className="btn btn-sm"
                              style={{ fontSize: 12.5, padding: "7px 15px", borderRadius: 6, background: "#FDE3E1", color: "#C0392B", border: "1px solid #F3C2BE", fontWeight: 600 }}
                            >
                              <i className="ti ti-x me-1"></i>Reject
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => reviewDrive(d, "delete")}
                            className="btn btn-sm btn-outline-secondary"
                            style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5 }}
                            title="Delete drive"
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : status === "hospitalRequests" ? (
                items.map((h) => (
                  <tr key={h._id}>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", fontWeight: 700 }}>
                      {h.hospitalName}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <span
                        style={{
                          background: "rgba(192,57,43,0.12)",
                          color: "#C0392B",
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          marginRight: 4,
                        }}
                      >
                        NGO
                      </span>
                      <span style={{ color: "#6b7280", fontSize: 12 }}>
                        {h.ngo?.name || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      {h.phone || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      {h.doctorName || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      {h.email || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                      {h.createdAt ? new Date(h.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        {h.status && h.status !== "pending" && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              letterSpacing: 0.4,
                              padding: "2px 9px",
                              borderRadius: 999,
                              textTransform: "capitalize",
                              background: h.status === "approved" ? "rgba(192,57,43,0.12)" : "#f3f4f6",
                              color: h.status === "approved" ? "#c0392b" : "#374151",
                            }}
                          >
                            {h.status}
                          </span>
                        )}
                        {h.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => reviewHospital(h._id, "approved")}
                            className="btn btn-sm"
                            style={{ fontSize: 12.5, padding: "7px 15px", borderRadius: 6, background: "#9C0C0D", color: "#fff", border: "none", fontWeight: 600 }}
                          >
                            <i className="ti ti-check me-1"></i> Approve
                          </button>
                        )}
                        {h.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => reviewHospital(h._id, "rejected")}
                            className="btn btn-sm"
                            style={{ fontSize: 12.5, padding: "7px 15px", borderRadius: 6, background: "#FDE3E1", color: "#C0392B", border: "1px solid #F3C2BE", fontWeight: 600 }}
                          >
                            <i className="ti ti-x me-1"></i> Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                items.map((n) => (
                  <tr key={n._id}>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ fontWeight: 700 }}>{n.name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        {n.website || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <div>{n.email}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        {n.phone ? `${n.phoneCode || ""} ${n.phone}` : "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      {n.city || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                      {new Date(n.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <DocSummary counts={n.docCounts} />
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      {statusBadge(n.status)}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                      {status === "docsPending" ? (
                        // Uses lsa-btn-primary so the global ".content-wrapper a"
                        // red-text !important rule is excluded; we just override
                        // the background to a dark blue. White text comes from
                        // the class (also !important).
                        <Link
                          to={`/ngo/${n._id}`}
                          className="lsa-btn-primary"
                          style={{
                            fontSize: 11,
                            padding: "5px 12px",
                            borderRadius: 5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <i className="ti ti-file-search"></i>
                          Review Documents
                        </Link>
                      ) : (
                        <div style={{ display: "inline-flex", gap: 10, flexWrap: "nowrap", alignItems: "center" }}>
                          {n.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() => reviewNgo(n, "approve")}
                              className="btn btn-sm"
                              title="Approve"
                              aria-label="Approve"
                              style={{ fontSize: 15, padding: "7px 10px", borderRadius: 6, background: "#9C0C0D", color: "#fff", border: "none", fontWeight: 600, lineHeight: 1 }}
                            >
                              <i className="ti ti-check"></i>
                            </button>
                          )}
                          {n.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => reviewNgo(n, "reject")}
                              className="btn btn-sm"
                              title="Reject"
                              aria-label="Reject"
                              style={{ fontSize: 15, padding: "7px 10px", borderRadius: 6, background: "#FDE3E1", color: "#C0392B", border: "1px solid #F3C2BE", fontWeight: 600, lineHeight: 1 }}
                            >
                              <i className="ti ti-x"></i>
                            </button>
                          )}
                          <Link
                            to={`/ngo/${n._id}`}
                            className="btn btn-sm lsa-btn-view"
                            style={{ fontSize: 15, padding: "7px 10px", borderRadius: 6, fontWeight: 600, lineHeight: 1 }}
                            title="View details"
                            aria-label="View details"
                          >
                            <i className="ti ti-eye"></i>
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Ngos;
