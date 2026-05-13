import { useContext, useEffect, useState } from "react";
import axios from "axios";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";
import { downloadCsv } from "../utils/downloadCsv";

const statusBadge = (status) => {
  const base = { padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#fff", display: "inline-block" };
  if (status === "approved") return { ...base, background: "#22C55E" };
  if (status === "pending") return { ...base, background: "#F59E0B" };
  if (status === "denied") return { ...base, background: "#EF4444" };
  return { ...base, background: "#6B7280" };
};

const DonationsReport = () => {
  const { setLoading } = useContext(GlobalContext);
  const [report, setReport] = useState({ totals: {}, byMonth: [], byStatus: {} });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/donations-report?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setReport(res?.data?.data || { totals: {}, byMonth: [], byStatus: {} });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmtMoney = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
  const maxByMonth = report.byMonth.length
    ? Math.max(...report.byMonth.map((m) => m.amount || 0))
    : 0;

  return (
    <>
      <SEO title="Donations Report" />
      <div className="content-wrapper pt-5">
        <div className="d-flex mb-3 justify-content-between align-items-center flex-wrap" style={{ gap: 12 }}>
          <p className="card-title p-0 m-0">Monetary Donations Report</p>
          <button
            className="btn btn-outline-primary"
            onClick={() =>
              downloadCsv("/export/contributions", { startDate, endDate },
                `contributions-${new Date().toISOString().slice(0, 10)}.csv`)
            }
          >
            <i className="ti ti-download"></i> Export CSV
          </button>
        </div>

        {/* ===== Filters ===== */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <button className="btn btn-primary me-2" onClick={load}>Apply</button>
                <button className="btn btn-outline-secondary" onClick={() => { setStartDate(""); setEndDate(""); setTimeout(load, 0); }}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Totals ===== */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="text-muted small text-uppercase" style={{ letterSpacing: 0.5 }}>Total Amount</div>
                <div className="fs-3 fw-bold" style={{ color: "#0EA5E9" }}>{fmtMoney(report.totals.totalAmount)}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="text-muted small text-uppercase" style={{ letterSpacing: 0.5 }}>Total Donations</div>
                <div className="fs-3 fw-bold">{report.totals.totalContributions || 0}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="text-muted small text-uppercase" style={{ letterSpacing: 0.5 }}>Approved Amount</div>
                <div className="fs-3 fw-bold" style={{ color: "#22C55E" }}>{fmtMoney(report.totals.approvedAmount)}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="text-muted small text-uppercase" style={{ letterSpacing: 0.5 }}>Approved Count</div>
                <div className="fs-3 fw-bold" style={{ color: "#22C55E" }}>{report.totals.approvedContributions || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Breakdown by status ===== */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Breakdown by Status</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {["pending", "approved", "denied"].map((s) => {
                const row = report.byStatus[s] || { amount: 0, count: 0 };
                return (
                  <div key={s} className="col-md-4">
                    <div style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 14 }}>
                      <span style={statusBadge(s)}>{s}</span>
                      <div className="mt-2 fs-4 fw-bold">{fmtMoney(row.amount)}</div>
                      <div className="text-muted small">{row.count} contribution(s)</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===== Monthly trend ===== */}
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Monthly Trend</h5>
            <p className="small mb-0">Donations grouped by month within your filter range.</p>
          </div>
          <div className="card-body">
            {report.byMonth.length === 0 ? (
              <p className="m-0 text-muted">No donations in this range.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover-removed my-table">
                  <thead id="request-heading">
                    <tr>
                      <th className="align-left">Month</th>
                      <th className="align-left">Amount</th>
                      <th className="align-left">Count</th>
                      <th className="align-left">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byMonth.map((row) => {
                      const pct = maxByMonth > 0 ? (row.amount / maxByMonth) * 100 : 0;
                      return (
                        <tr key={row.month}>
                          <td className="align-left fw-bold">{row.month}</td>
                          <td className="align-left">{fmtMoney(row.amount)}</td>
                          <td className="align-left">{row.count}</td>
                          <td className="align-left" style={{ minWidth: 220 }}>
                            <div style={{
                              height: 10,
                              background: "#F3F4F6",
                              borderRadius: 5,
                              overflow: "hidden",
                            }}>
                              <div style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: "#0EA5E9",
                              }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DonationsReport;
