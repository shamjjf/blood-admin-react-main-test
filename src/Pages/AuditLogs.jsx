import { useContext, useEffect, useState } from "react";
import axios from "axios";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const AuditLogs = () => {
  const { setLoading } = useContext(GlobalContext);
  const [items, setItems] = useState([]);
  const [actions, setActions] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  // filters
  const [actionFilter, setActionFilter] = useState("All");
  const [adminEmail, setAdminEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // expanded row state — show full metadata JSON on click
  const [expanded, setExpanded] = useState(null);

  const loadActions = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/audit-actions`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      setActions(res?.data?.data?.actions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("n", pageSize);
      params.set("p", page);
      if (actionFilter !== "All") params.set("action", actionFilter);
      if (adminEmail) params.set("adminEmail", adminEmail);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/audit-logs?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setItems(res?.data?.data?.items || []);
      setCount(res?.data?.data?.count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadActions(); }, []);
  useEffect(() => { load(); }, [page, actionFilter, adminEmail, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <>
      <SEO title="Audit Logs" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-3">Audit Logs</p>

        {/* ===== Filters ===== */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: 0.5 }}>Action</label>
                <select
                  className="form-control"
                  style={{ height: 40 }}
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                >
                  <option value="All">All actions</option>
                  {actions.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: 0.5 }}>Admin Email</label>
                <input
                  className="form-control"
                  style={{ height: 40 }}
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  onBlur={() => { setPage(1); load(); }}
                  placeholder="search by email…"
                />
              </div>
              <div className="col-6 col-md-3 col-lg-2">
                <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: 0.5 }}>Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ height: 40 }}
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                />
              </div>
              <div className="col-6 col-md-3 col-lg-2">
                <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: 0.5 }}>End Date</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ height: 40 }}
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                />
              </div>
              <div className="col-12 col-lg-2 text-end">
                <button
                  className="btn btn-outline-secondary w-100"
                  style={{ height: 40 }}
                  onClick={() => {
                    setActionFilter("All"); setAdminEmail(""); setStartDate(""); setEndDate(""); setPage(1);
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Table ===== */}
        <div className="card">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{count} event(s)</h5>
            <small>Most recent first</small>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">When</th>
                    <th className="align-left">Admin</th>
                    <th className="align-left">Action</th>
                    <th className="align-left">Target</th>
                    <th className="align-left">IP</th>
                    <th className="align-center">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="align-center"><p className="m-5 p-5 fs-4">No logged events.</p></td></tr>
                  ) : items.map((it) => (
                    <>
                      <tr key={it._id}>
                        <td className="align-left">
                          <div>{new Date(it.createdAt).toLocaleDateString()}</div>
                          <div className="text-muted small">{new Date(it.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="align-left">
                          <div className="fw-bold small">{it.adminEmail || "—"}</div>
                        </td>
                        <td className="align-left">
                          <code style={{ background: "#F3F4F6", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>
                            {it.action}
                          </code>
                        </td>
                        <td className="align-left">
                          {it.targetType ? (
                            <div>
                              <div className="fw-bold small">{it.targetType}</div>
                              <div className="text-muted small" style={{ fontFamily: "monospace" }}>{it.targetId || "—"}</div>
                            </div>
                          ) : <span className="text-muted small">—</span>}
                        </td>
                        <td className="align-left text-muted small">{it.ip || "—"}</td>
                        <td className="align-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setExpanded(expanded === it._id ? null : it._id)}
                          >
                            {expanded === it._id ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {expanded === it._id && (
                        <tr>
                          <td colSpan={6} style={{ background: "#F9FAFB" }}>
                            <pre style={{
                              margin: 0, padding: 12, fontSize: 12,
                              background: "#FFF", borderRadius: 6, border: "1px solid #E5E7EB",
                            }}>{JSON.stringify(it.metadata || {}, null, 2)}</pre>
                            <div className="text-muted small mt-2">
                              User-Agent: <code>{it.userAgent || "—"}</code>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-between mt-3">
                <div className="text-muted small">Page {page} of {totalPages}</div>
                <div>
                  <button
                    className="btn btn-sm btn-outline-secondary me-2"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuditLogs;
