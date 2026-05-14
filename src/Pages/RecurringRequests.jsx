import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const PATIENT_CONDITIONS = [
  "normal",
  "thalassemia",
  "leukemia",
  "hemophilia",
  "sickle_cell",
  "kidney_failure",
  "cancer",
  "trauma",
  "surgery",
  "other",
];

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const daysUntil = (d) => {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.round(diff / (24 * 60 * 60 * 1000));
};

const RecurringRequests = () => {
  const { setLoading } = useContext(GlobalContext);
  const [requests, setRequests] = useState([]);
  const [filterCondition, setFilterCondition] = useState("");
  const [filterDue, setFilterDue] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/recurring-requests`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setRequests(res?.data?.data?.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRecurring = async (r) => {
    if (r.recurringEnabled) {
      const ok = await swal({
        title: `Disable recurring schedule?`,
        text: `Future auto-instances will stop being created for this request.`,
        icon: "warning",
        buttons: ["Cancel", "Disable"],
        dangerMode: true,
      });
      if (!ok) return;
      try {
        setLoading(true);
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/request/${r._id}/special-handling`,
          { recurringEnabled: false },
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
              "Content-Type": "application/json",
            },
          }
        );
        await load();
      } catch (err) {
        swal("Error", err?.response?.data?.error || "Failed to disable", "error");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Enabling — ask for interval days
    const daysStr = await swal({
      text: "How often (in days) should this request auto-recur? (1 to 365)",
      content: { element: "input", attributes: { type: "number", min: 1, max: 365, value: "30" } },
      buttons: ["Cancel", "Enable"],
    });
    if (daysStr === null) return;
    const days = Number(daysStr);
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      swal("Error", "Please enter a number between 1 and 365", "error");
      return;
    }
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/request/${r._id}/special-handling`,
        { recurringEnabled: true, recurringIntervalDays: days },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
            "Content-Type": "application/json",
          },
        }
      );
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to enable", "error");
    } finally {
      setLoading(false);
    }
  };

  // Client-side filters
  const filtered = requests.filter((r) => {
    if (filterCondition && r.patientCondition !== filterCondition) return false;
    if (filterDue === "overdue") {
      const dd = daysUntil(r.nextRecurrenceAt);
      if (dd === null || dd > 0) return false;
    } else if (filterDue === "week") {
      const dd = daysUntil(r.nextRecurrenceAt);
      if (dd === null || dd < 0 || dd > 7) return false;
    }
    return true;
  });

  return (
    <>
      <SEO title="Recurring Requests" />
      <div className="content-wrapper pt-5">
        <div className="d-flex align-items-center mb-3">
          <p className="card-title p-0 m-0">Recurring & Chronic Requests</p>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <small className="text-muted d-block mb-2">
              Shows requests that are either flagged as <strong>recurring</strong> (auto-create
              future instances at a fixed interval) or have a chronic <strong>patient condition</strong>
              (Thalassemia, Leukemia, etc.) which typically need ongoing support.
            </small>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <select
                className="form-select form-select-sm"
                style={{ maxWidth: 200 }}
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
              >
                <option value="">All conditions</option>
                {PATIENT_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <select
                className="form-select form-select-sm"
                style={{ maxWidth: 180 }}
                value={filterDue}
                onChange={(e) => setFilterDue(e.target.value)}
              >
                <option value="">All due dates</option>
                <option value="overdue">Overdue</option>
                <option value="week">Due in 7 days</option>
              </select>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary ms-auto"
                onClick={load}
              >
                <i className="ti ti-refresh me-1"></i> Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              <div className="table-responsive">
                <table className="table table-hover-removed my-table">
                  <thead id="request-heading">
                    <tr>
                      <th className="align-left">Recipient</th>
                      <th className="align-left">Blood Group</th>
                      <th className="align-left">Type</th>
                      <th className="align-left">Condition</th>
                      <th className="align-left">Status</th>
                      <th className="align-left">Recurring</th>
                      <th className="align-left">Interval</th>
                      <th className="align-left">Next Due</th>
                      <th className="align-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="align-center">
                          <p className="m-5 p-5 fs-4">
                            {requests.length === 0
                              ? "No recurring or chronic requests yet."
                              : "No matches for the selected filters."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r) => {
                        const dd = daysUntil(r.nextRecurrenceAt);
                        const ddLabel =
                          dd === null
                            ? "—"
                            : dd < 0
                            ? `${Math.abs(dd)} day(s) overdue`
                            : dd === 0
                            ? "Today"
                            : `In ${dd} day(s)`;
                        return (
                          <tr key={r._id}>
                            <td className="align-left">
                              <div className="fw-bold">
                                {r.recipient?.name || "—"}
                              </div>
                              <small className="text-muted">
                                {r.recipient?.email || r.recipient?.phone || ""}
                              </small>
                            </td>
                            <td className="align-left">{r.bloodGroup || "—"}</td>
                            <td className="align-left">{r.type || "—"}</td>
                            <td className="align-left">
                              {r.patientCondition && r.patientCondition !== "normal" ? (
                                <span
                                  style={{
                                    padding: "3px 10px",
                                    borderRadius: 10,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#FFFFFF",
                                    background: "#9333EA",
                                  }}
                                >
                                  {r.patientCondition.replace(/_/g, " ")}
                                </span>
                              ) : (
                                <em className="text-muted">normal</em>
                              )}
                            </td>
                            <td className="align-left">{r.status || "—"}</td>
                            <td className="align-left">
                              <span
                                style={{
                                  padding: "3px 10px",
                                  borderRadius: 10,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#FFFFFF",
                                  background: r.recurringEnabled
                                    ? "#22C55E"
                                    : "#6B7280",
                                }}
                              >
                                {r.recurringEnabled ? "On" : "Off"}
                              </span>
                            </td>
                            <td className="align-left">
                              {r.recurringEnabled
                                ? `${r.recurringIntervalDays || 0} day(s)`
                                : "—"}
                            </td>
                            <td className="align-left">
                              {r.recurringEnabled ? (
                                <>
                                  <div>{formatDate(r.nextRecurrenceAt)}</div>
                                  <small
                                    className={
                                      dd !== null && dd < 0
                                        ? "text-danger fw-bold"
                                        : "text-muted"
                                    }
                                  >
                                    {ddLabel}
                                  </small>
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="align-center">
                              <Link
                                to={`/request/${r._id}`}
                                className="btn btn-sm btn-outline-primary me-2"
                              >
                                Details
                              </Link>
                              <button
                                className={`btn btn-sm ${
                                  r.recurringEnabled
                                    ? "btn-outline-secondary"
                                    : "btn-outline-success"
                                }`}
                                onClick={() => toggleRecurring(r)}
                              >
                                {r.recurringEnabled ? "Disable" : "Enable"}
                              </button>
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
      </div>
    </>
  );
};

export default RecurringRequests;
