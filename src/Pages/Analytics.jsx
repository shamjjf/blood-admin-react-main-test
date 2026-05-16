import { useContext, useEffect, useState } from "react";
import axios from "axios";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const fmt = (n) => (Number(n) || 0).toLocaleString("en-IN");
const fmtMoney = (n) => `₹${fmt(n)}`;

const Section = ({ title, children }) => (
  <div className="card mb-4">
    <div className="card-header bg-primary text-white">
      <h5 className="mb-0">{title}</h5>
    </div>
    <div className="card-body">{children}</div>
  </div>
);

const Stat = ({ label, value, color = "#0EA5E9", sub = "" }) => (
  <div className="card h-100">
    <div
      className="card-body"
      style={{
        minHeight: 110,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "16px 18px",
      }}
    >
      <div
        className="text-muted text-uppercase"
        style={{ fontSize: 11, letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}
      >
        {label}
      </div>
      <div style={{ color, fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="text-muted small mt-1">{sub}</div>}
    </div>
  </div>
);

const Bar = ({ label, count, max, color }) => {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="d-flex align-items-center mb-2" style={{ gap: 10 }}>
      <div style={{ width: 110, fontWeight: 600, fontSize: 13 }}>{label}</div>
      <div style={{ flex: 1, height: 14, background: "#F3F4F6", borderRadius: 7, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color || "#0EA5E9" }} />
      </div>
      <div style={{ width: 60, textAlign: "right", fontWeight: 700 }}>{fmt(count)}</div>
    </div>
  );
};

const Analytics = () => {
  const { setLoading } = useContext(GlobalContext);
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/analytics?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setData(res?.data?.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const maxBG = data?.charts?.requestsByBG?.length
    ? Math.max(...data.charts.requestsByBG.map((r) => r.count))
    : 0;
  const maxMonth = data?.charts?.donationsByMonth?.length
    ? Math.max(...data.charts.donationsByMonth.map((r) => r.count))
    : 0;

  return (
    <>
      <SEO title="Analytics & Reports" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-3">Analytics & Reports</p>

        {/* Date range */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-6 col-md-3">
                <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: 0.5 }}>Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ height: 40 }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: 0.5 }}>End Date</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ height: 40 }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-6 d-flex gap-2">
                <button className="btn btn-primary" style={{ height: 40 }} onClick={load}>Apply</button>
                <button
                  className="btn btn-outline-secondary"
                  style={{ height: 40 }}
                  onClick={() => { setStartDate(""); setEndDate(""); setTimeout(load, 0); }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {!data ? (
          <p className="m-0 text-muted">Loading…</p>
        ) : (
          <>
            {/* ===== Users ===== */}
            <Section title="Users">
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-5 g-3">
                <div className="col"><Stat label="Total Active" value={fmt(data.users.total)} color="#0EA5E9" /></div>
                <div className="col"><Stat label="Donors" value={fmt(data.users.donors)} color="#16A34A" /></div>
                <div className="col"><Stat label="Patients" value={fmt(data.users.patients)} color="#F97316" /></div>
                <div className="col"><Stat label="Volunteers" value={fmt(data.users.volunteers)} color="#EAB308" /></div>
                <div className="col"><Stat label="Deactivated" value={fmt(data.users.deactivated)} color="#6B7280" /></div>
              </div>
            </Section>

            {/* ===== Requests ===== */}
            <Section title="Blood Requests">
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-5 g-3">
                <div className="col"><Stat label="Total" value={fmt(data.requests.total)} color="#0EA5E9" /></div>
                <div className="col"><Stat label="Open" value={fmt(data.requests.open)} color="#22C55E" /></div>
                <div className="col"><Stat label="Fulfilled" value={fmt(data.requests.fulfilled)} color="#16A34A" /></div>
                <div className="col"><Stat label="Cancelled" value={fmt(data.requests.cancelled)} color="#EF4444" /></div>
                <div className="col"><Stat label="Critical" value={fmt(data.requests.critical)} color="#DC2626" /></div>
              </div>

              {data.charts.requestsByBG.length > 0 && (
                <>
                  <hr />
                  <h6 className="mb-3">Requests by Blood Group</h6>
                  {data.charts.requestsByBG.map((r) => (
                    <Bar key={r._id} label={r._id} count={r.count} max={maxBG} color="#C0392B" />
                  ))}
                </>
              )}
            </Section>

            {/* ===== Donations ===== */}
            <Section title="Donations">
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-3">
                <div className="col"><Stat label="Total Records" value={fmt(data.donations.total)} color="#0EA5E9" /></div>
                <div className="col"><Stat label="Approved" value={fmt(data.donations.approved)} color="#22C55E" /></div>
                <div className="col"><Stat label="Invited" value={fmt(data.donations.invited)} color="#F59E0B" /></div>
                <div className="col"><Stat label="Rejected" value={fmt(data.donations.rejected)} color="#EF4444" /></div>
              </div>

              {data.charts.donationsByMonth.length > 0 && (
                <>
                  <hr />
                  <h6 className="mb-3">Approved Donations by Month</h6>
                  {data.charts.donationsByMonth.map((r) => (
                    <Bar key={r.month} label={r.month} count={r.count} max={maxMonth} color="#16A34A" />
                  ))}
                </>
              )}
            </Section>

            {/* ===== Camps ===== */}
            <Section title="Camps & Drives">
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-5 g-3">
                <div className="col"><Stat label="Total Camps" value={fmt(data.camps.total)} color="#0EA5E9" /></div>
                <div className="col"><Stat label="Scheduled" value={fmt(data.camps.scheduled)} color="#0EA5E9" /></div>
                <div className="col"><Stat label="Completed" value={fmt(data.camps.completed)} color="#22C55E" /></div>
                <div className="col"><Stat label="Registrations" value={fmt(data.camps.registrations)} color="#F59E0B" /></div>
                <div className="col"><Stat label="Attended" value={fmt(data.camps.attended)} color="#16A34A" /></div>
              </div>
            </Section>

            {/* ===== Contributions ===== */}
            <Section title="Monetary Contributions">
              <div className="row row-cols-1 row-cols-md-2 g-3">
                <div className="col"><Stat label="Total Amount" value={fmtMoney(data.contributions.amount)} color="#0EA5E9" /></div>
                <div className="col"><Stat label="Number of Contributions" value={fmt(data.contributions.count)} color="#7C3AED" /></div>
              </div>
            </Section>

            {/* ===== Points ===== */}
            <Section title="Rewards">
              <div className="row g-3">
                <div className="col-12">
                  <Stat label="Total Points Awarded (in this period)" value={fmt(data.pointsAwarded)} color="#EAB308" />
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    </>
  );
};

export default Analytics;
