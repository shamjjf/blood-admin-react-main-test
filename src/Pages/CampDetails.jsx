import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import { useParams } from "react-router-dom";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const STATUS_OPTIONS = ["scheduled", "ongoing", "completed", "cancelled"];

const statusBadge = (status) => {
  const base = { padding: "4px 12px", borderRadius: 12, fontSize: 11, fontWeight: 700, color: "#fff" };
  if (status === "scheduled") return { ...base, background: "#0EA5E9" };
  if (status === "ongoing") return { ...base, background: "#16A34A" };
  if (status === "completed") return { ...base, background: "#6B7280" };
  if (status === "cancelled") return { ...base, background: "#DC2626" };
  return { ...base, background: "#94A3B8" };
};

const regBadge = (s) => {
  const base = { padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#fff" };
  if (s === "registered") return { ...base, background: "#F59E0B" };
  if (s === "attended") return { ...base, background: "#22C55E" };
  if (s === "no-show") return { ...base, background: "#EF4444" };
  if (s === "cancelled") return { ...base, background: "#6B7280" };
  return { ...base, background: "#94A3B8" };
};

const CampDetails = () => {
  const { id } = useParams();
  const { setLoading } = useContext(GlobalContext);
  const [camp, setCamp] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [counts, setCounts] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/camp/${id}`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      setCamp(res?.data?.data?.camp || null);
      setRegistrations(res?.data?.data?.registrations || []);
      setCounts(res?.data?.data?.counts || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const setRegStatus = async (regId, status) => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/camp/${id}/registration/${regId}`,
        { status },
        { headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" } }
      );
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to update", "error");
    } finally {
      setLoading(false);
    }
  };

  const setCampStatus = async (status) => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/camp/${id}`,
        { status },
        { headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" } }
      );
      swal("Updated", `Camp marked as ${status}`, "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to update", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!camp) return <div className="content-wrapper pt-5"><p>Loading…</p></div>;

  return (
    <>
      <SEO title="Camp Details" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-3">Camp Details</p>

        {/* Camp summary */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">{camp.organization?.name || camp.organizerName}</h5>
              <p className="small mb-0">{camp.location}</p>
            </div>
            <span style={statusBadge(camp.status)}>{camp.status}</span>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <div className="text-muted small">Date</div>
                <div className="fw-bold">{camp.venueDate ? new Date(camp.venueDate).toLocaleDateString() : "—"}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small">Time</div>
                <div className="fw-bold">{camp.venueTime || "—"}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small">Capacity</div>
                <div className="fw-bold">{camp.donorsExpected || "Unlimited"}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small">Organization</div>
                <div className="fw-bold">{camp.organization?.name || "—"}</div>
              </div>
              {camp.purpose && (
                <div className="col-md-12">
                  <div className="text-muted small">Purpose</div>
                  <div>{camp.purpose}</div>
                </div>
              )}
            </div>

            <hr />

            <div className="row g-3 mb-2">
              <div className="col-md-3">
                <div className="text-muted small">Registered</div>
                <div className="fs-3 fw-bold" style={{ color: "#F59E0B" }}>{counts.registered || 0}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small">Attended</div>
                <div className="fs-3 fw-bold" style={{ color: "#22C55E" }}>{counts.attended || 0}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small">No-show</div>
                <div className="fs-3 fw-bold" style={{ color: "#EF4444" }}>{counts["no-show"] || 0}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small">Cancelled</div>
                <div className="fs-3 fw-bold" style={{ color: "#6B7280" }}>{counts.cancelled || 0}</div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3 flex-wrap">
              {STATUS_OPTIONS.filter((s) => s !== camp.status).map((s) => (
                <button
                  key={s}
                  className="btn btn-sm btn-outline-primary text-capitalize"
                  onClick={() => setCampStatus(s)}
                >
                  Mark {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Registrations table */}
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Registrations ({registrations.length})</h5>
            <p className="small mb-0">Mark attendance below. Points get auto-awarded on first attendance.</p>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">Name</th>
                    <th className="align-left">Phone</th>
                    <th className="align-left">Blood Group</th>
                    <th className="align-left">Status</th>
                    <th className="align-left">Registered On</th>
                    <th className="align-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="align-center">
                        <p className="m-5 p-5 fs-4">No registrations yet.</p>
                      </td>
                    </tr>
                  ) : registrations.map((r) => (
                    <tr key={r._id}>
                      <td className="align-left">{r.user?.name || r.snapshot?.name || "—"}</td>
                      <td className="align-left">{r.user?.phone ? `+${r.user.phoneCode || ""} ${r.user.phone}` : r.snapshot?.phone || "—"}</td>
                      <td className="align-left">{r.user?.bloodGroup || r.snapshot?.bloodGroup || "—"}</td>
                      <td className="align-left">
                        <span style={regBadge(r.status)}>{r.status}</span>
                      </td>
                      <td className="align-left">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="align-center">
                        {r.status !== "attended" && (
                          <button className="btn btn-sm btn-success me-2" onClick={() => setRegStatus(r._id, "attended")}>
                            Attended
                          </button>
                        )}
                        {r.status !== "no-show" && r.status !== "attended" && (
                          <button className="btn btn-sm btn-danger me-2" onClick={() => setRegStatus(r._id, "no-show")}>
                            No-show
                          </button>
                        )}
                        {r.status === "attended" && (
                          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setRegStatus(r._id, "registered")}>
                            Unmark
                          </button>
                        )}
                        {(r.status === "registered" || r.status === "no-show") && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setRegStatus(r._id, "cancelled")}>
                            Cancel
                          </button>
                        )}
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

export default CampDetails;
