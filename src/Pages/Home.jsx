import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import SEO from "../SEO";

/* ─────────────────────────────────────────────
   SVG DONUT — exact match to reference HTML
───────────────────────────────────────────── */
const DonutChart = ({ segments, total, label }) => {
  const R = 40;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;
  const arcs = segments.map((s) => {
    const dash = (s.pct / 100) * CIRC;
    const arc = { ...s, dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      {/* SVG */}
      <div style={{ position: "relative", flexShrink: 0, width: 110, height: 110 }}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={R} fill="none" stroke="#f0f0f0" strokeWidth="14" />
          {arcs.map((a, i) => (
            <circle key={i} cx="55" cy="55" r={R} fill="none"
              stroke={a.color} strokeWidth="14"
              strokeDasharray={`${a.dash} ${CIRC - a.dash}`}
              strokeDashoffset={CIRC / 4 - a.offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s ease" }} />
          ))}
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ fontFamily: "var(--f-display)", fontSize: 22, fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.5px", marginTop: 2 }}>{label}</div>
        </div>
      </div>
      {/* Legend */}
      <div style={{ flex: 1 }}>
        {segments.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px 0", borderBottom: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              {s.name}
            </div>
            <div style={{ fontFamily: "var(--f-display)", fontSize: 13, fontWeight: 700, color: s.pct === 0 ? "var(--muted2)" : "var(--dark)" }}>
              {s.isCount ? s.val : `${Math.round(s.pct)}%`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   BAR CHART — exact match to reference HTML
───────────────────────────────────────────── */
const BarChart = ({ rows }) => {
  const maxVal = Math.max(...rows.map((r) => r.val), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", width: 70, flexShrink: 0, textAlign: "right", fontWeight: 500 }}>{r.label}</div>
          <div style={{ flex: 1, height: 8, background: "#EEE9E4", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: r.color,
              width: `${(r.val / maxVal) * 100}%`,
              transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
          <div style={{ fontFamily: "var(--f-display)", fontSize: 11, fontWeight: 700, color: "var(--dark)", width: 24, textAlign: "right", flexShrink: 0 }}>{r.val}</div>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   CHART CARD WRAPPER
───────────────────────────────────────────── */
const ChartCard = ({ title, sub, tag, tagColor, children }) => (
  <div style={{
    background: "var(--white)", borderRadius: "var(--r)",
    border: "1px solid var(--border)", boxShadow: "var(--shadow)", overflow: "hidden",
  }}>
    <div style={{
      padding: "16px 18px", display: "flex", alignItems: "center",
      justifyContent: "space-between", borderBottom: "1px solid var(--border)",
    }}>
      <div>
        <div style={{ fontFamily: "var(--f-display)", fontSize: 14, fontWeight: 700, color: "var(--dark)" }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{sub}</div>
      </div>
      {tag && (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
          fontFamily: "var(--f-display)",
          background: tagColor === "red" ? "var(--red-pale)" : tagColor === "blue" ? "var(--blue-bg)" : tagColor === "amber" ? "var(--amber-bg)" : tagColor === "green" ? "var(--green-bg)" : tagColor === "purple" ? "var(--purple-bg)" : "#EEE9E4",
          color: tagColor === "red" ? "var(--red)" : tagColor === "blue" ? "var(--blue)" : tagColor === "amber" ? "var(--amber)" : tagColor === "green" ? "var(--green)" : tagColor === "purple" ? "var(--purple)" : "var(--muted)",
        }}>{tag}</span>
      )}
    </div>
    {children}
  </div>
);

/* ─────────────────────────────────────────────
   ACTIVITY ICON
───────────────────────────────────────────── */
const ActIcon = ({ color, icon }) => {
  const bg = { red: "var(--red-pale)", green: "var(--green-bg)", blue: "var(--blue-bg)", amber: "var(--amber-bg)" };
  const cl = { red: "var(--red)", green: "var(--green)", blue: "var(--blue)", amber: "var(--amber)" };
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: bg[color] || bg.blue, color: cl[color] || cl.blue,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, flexShrink: 0, marginTop: 2,
    }}>
      <i className={icon} />
    </div>
  );
};

/* ─────────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────────── */
const Home = () => {
  const [statData, setStatData] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const auth = { headers: { Authorization: sessionStorage.getItem("auth") } };

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, usersRes, reqRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/stats`, auth),
          axios.get(`${import.meta.env.VITE_API_URL}/users?n=5&p=1`, auth),
          axios.get(`${import.meta.env.VITE_API_URL}/requests?n=5&p=1&type=Blood`, auth),
        ]);
        setStatData(statsRes.data);
        setRecentUsers(usersRes.data?.users || []);
        setRecentRequests(reqRes.data?.data || []);
      } catch (e) { console.log(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="content-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--red)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>Loading dashboard…</div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const s = statData || {};
  const totalBlood = (s.bloodRequestCountCrit ?? 0) + (s.bloodRequestCountNoCrit ?? 0);
  const totalPlatelet = (s.plateletRequestCountCrit ?? 0) + (s.plateletRequestCountNoCrit ?? 0);
  const totalTasks = (s.openTasks ?? 0) + (s.closeTasks ?? 0);
  const totalUsers = s.userCount || 0;
  const totalSpecial = s.specialUserCount || 0;

  /* ── DONUT SEGMENTS ── */
  const bloodSegs = totalBlood === 0 ? [] : [
    { name: "Critical",     color: "#C0392B", pct: (s.bloodRequestCountCrit / totalBlood) * 100 },
    { name: "Not Critical", color: "#FDDBD7", pct: (s.bloodRequestCountNoCrit / totalBlood) * 100 },
  ];
  const plateletSegs = totalPlatelet === 0 ? [] : [
    { name: "Critical",     color: "#1d4ed8", pct: (s.plateletRequestCountCrit / totalPlatelet) * 100 },
    { name: "Not Critical", color: "#BFDBFE", pct: (s.plateletRequestCountNoCrit / totalPlatelet) * 100 },
  ];
  const genderSegs = totalUsers === 0 ? [] : [
    { name: "Male",        color: "#3b82f6", pct: ((s.maleUser || 0) / totalUsers) * 100 },
    { name: "Female",      color: "#ec4899", pct: ((s.femaleUser || 0) / totalUsers) * 100 },
    { name: "Other",       color: "#a855f7", pct: ((s.otherUser || 0) / totalUsers) * 100 },
    { name: "Unspecified", color: "#E5E7EB", pct: ((totalUsers - ((s.maleUser||0)+(s.femaleUser||0)+(s.otherUser||0))) / totalUsers) * 100 },
  ];
  const taskSegs = totalTasks === 0 ? [] : [
    { name: "Open",   color: "#d97706", pct: ((s.openTasks || 0) / totalTasks) * 100 },
    { name: "Closed", color: "#FEF3C7", pct: ((s.closeTasks || 0) / totalTasks) * 100 },
  ];

  /* ── SPECIAL USERS BAR ROWS ── */
  const specialBars = [
    { label: "NGO",        val: s.ngoUser || 0,        color: "#6366f1" },
    { label: "School",     val: s.schoolUser || 0,     color: "#ec4899" },
    { label: "University", val: s.universityUser || 0, color: "#f59e0b" },
    { label: "Company",    val: s.companyUser || 0,    color: "#10b981" },
    { label: "Influencer", val: s.influencerUser || 0, color: "#3b82f6" },
  ];

  /* ── SYSTEM ALERTS (dynamic) ── */
  const alerts = [];
  if (s.bloodRequestCountCrit > 0) alerts.push({ type: "critical", icon: "ti ti-alert-triangle", title: `${s.bloodRequestCountCrit} Critical Blood Request${s.bloodRequestCountCrit > 1 ? "s" : ""}`, sub: "Patients need immediate blood donors", time: "Live" });
  if (s.openTasks > 0) alerts.push({ type: "warning", icon: "ti ti-clock", title: `${s.openTasks} Tasks Pending`, sub: "Review and assign before EOD", time: "Today" });
  if ((s.bloodBankCount || 0) === 0) alerts.push({ type: "info", icon: "ti ti-building-hospital", title: "No Blood Banks Added", sub: "Add nearby blood banks to improve coverage", time: "Setup" });
  if ((s.campsCount || 0) === 0) alerts.push({ type: "info-blue", icon: "ti ti-calendar-off", title: "No Camps Scheduled", sub: "Plan a blood donation camp this month", time: "Action" });
  if (alerts.length === 0) alerts.push({ type: "info", icon: "ti ti-check", title: "All Systems Normal", sub: "No pending alerts at this time", time: "Now" });

  /* ── ACTIVITY (from recent data) ── */
  const activity = [];
  if (recentRequests.length > 0) {
    const r = recentRequests[0];
    activity.push({ color: "red", icon: "ti ti-droplet-filled", title: "Blood request received", sub: `${r.name || "Patient"} — ${r.bloodGroup || ""}, ${r.needUnits || 1} units · ${r.isCritical ? "Critical" : "Normal"}`, time: "Recent" });
  }
  if (recentUsers.length > 0) {
    recentUsers.slice(0, 3).forEach((u, i) => {
      activity.push({ color: i % 2 === 0 ? "green" : "blue", icon: "ti ti-user-plus", title: "New user registered", sub: `${u.name} joined as ${u.type === "user" ? "Individual" : u.type}`, time: "Recent" });
    });
  }
  if (activity.length === 0) {
    activity.push({ color: "blue", icon: "ti ti-info-circle", title: "No recent activity", sub: "Activity will appear here as events happen", time: "—" });
  }

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const pillStyle = (type) => {
    const m = { "Active": ["var(--green-bg)", "var(--green)"], "Verified": ["var(--green-bg)", "var(--green)"], "Ineligible": ["var(--amber-bg)", "var(--amber)"], "Individual": ["var(--blue-bg)", "var(--blue)"] };
    const [bg, color] = m[type] || ["var(--bg2)", "var(--muted)"];
    return { background: bg, color, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, fontFamily: "var(--f-display)", display: "inline-block" };
  };

  return (
    <div className="content-wrapper">
      <SEO title="Dashboard" />
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes mapPulse{0%,100%{box-shadow:0 0 0 4px rgba(192,57,43,0.3)}50%{box-shadow:0 0 0 12px rgba(192,57,43,0)}}
        @keyframes mapPulse2{0%,100%{box-shadow:0 0 0 4px rgba(59,130,246,0.3)}50%{box-shadow:0 0 0 12px rgba(59,130,246,0)}}
        @keyframes mapPulse3{0%,100%{box-shadow:0 0 0 4px rgba(22,163,74,0.3)}50%{box-shadow:0 0 0 12px rgba(22,163,74,0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes liveRing{0%{box-shadow:0 0 0 0 rgba(22,163,74,0.5)}70%{box-shadow:0 0 0 7px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}
        .lsa-dash>*{animation:fadeUp 0.35s ease both}
        .lsa-dash>.ph0{animation-delay:0s}.lsa-dash>.ph1{animation-delay:0.06s}
        .lsa-dash>.ph2{animation-delay:0.12s}.lsa-dash>.ph3{animation-delay:0.18s}
        .lsa-dash>.ph4{animation-delay:0.24s}.lsa-dash>.ph5{animation-delay:0.30s}
        .lsa-dash>.ph6{animation-delay:0.36s}
        .lsa-row-hover:hover td{background:var(--bg)!important}
        .lsa-icon-btn{width:28px;height:28px;border-radius:6px;border:1px solid var(--border2);background:var(--white);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:14px;color:var(--muted);transition:all 0.13s;text-decoration:none}
        .lsa-icon-btn:hover{border-color:var(--red);color:var(--red);background:var(--red-pale)}
      `}</style>

      <div className="lsa-dash" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── PAGE HEAD ── */}
        <div className="ph0" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "var(--f-display)", fontSize: 22, fontWeight: 800, color: "var(--dark)", letterSpacing: "-0.5px", margin: 0 }}>Admin Dashboard</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "2px 0 0" }}>{today} · All systems operational</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="lsa-btn-outline"><i className="ti ti-download" /> Export Report</button>
            <Link to="/users" className="lsa-btn-primary" style={{ textDecoration: "none" }}><i className="ti ti-plus" /> Add User</Link>
          </div>
        </div>

        {/* ── MAIN STAT CARDS ── */}
        <div className="ph1" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
          {[
            { icon: "ti ti-users",             cls: "white",  hero: true,  val: totalUsers,             label: "Total Users",         trend: `+${totalUsers} registered` },
            { icon: "ti ti-droplet-filled",    cls: "red",    hero: false, val: totalBlood,             label: "Blood Requests",      trend: s.bloodRequestCountCrit ? `${s.bloodRequestCountCrit} critical` : "No critical" },
            { icon: "ti ti-activity",          cls: "blue",   hero: false, val: totalPlatelet,          label: "Platelet Requests",   trend: totalPlatelet ? "Active" : "No change" },
            { icon: "ti ti-droplet-half-2",    cls: "green",  hero: false, val: s.availableDonorsCount ?? 0, label: "Total Donors",   trend: "Active today" },
            { icon: "ti ti-calendar-event",    cls: "amber",  hero: false, val: s.campsCount ?? 0,      label: "Camps Scheduled",     trend: s.campsCount ? "Upcoming" : "None yet" },
          ].map((c, i) => (
            <div key={i} style={{
              background: c.hero ? "var(--dark)" : "var(--white)",
              borderRadius: "var(--r)", border: c.hero ? "none" : "1px solid var(--border)",
              padding: 16, boxShadow: "var(--shadow)", transition: "all 0.2s",
              cursor: "default", position: "relative", overflow: "hidden",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow)"; }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, marginBottom: 12,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                background: c.cls === "white" ? "rgba(255,255,255,0.12)" : c.cls === "red" ? "var(--red-pale)" : c.cls === "green" ? "var(--green-bg)" : c.cls === "blue" ? "var(--blue-bg)" : "var(--amber-bg)",
                color: c.cls === "white" ? "white" : c.cls === "red" ? "var(--red)" : c.cls === "green" ? "var(--green)" : c.cls === "blue" ? "var(--blue)" : "var(--amber)",
              }}><i className={c.icon} /></div>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 28, fontWeight: 800, color: c.hero ? "white" : "var(--dark)", letterSpacing: "-1px", lineHeight: 1 }}>{c.val}</div>
              <div style={{ fontSize: 11, color: c.hero ? "rgba(255,255,255,0.55)" : "var(--muted)", fontWeight: 500, marginTop: 4 }}>{c.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, marginTop: 8, color: c.hero ? "rgba(255,255,255,0.7)" : "var(--green)" }}>
                <i className="ti ti-trending-up" style={{ fontSize: 13 }} /> {c.trend}
              </div>
              <div style={{ position: "absolute", right: -8, bottom: -12, fontFamily: "var(--f-display)", fontSize: 64, fontWeight: 800, color: c.hero ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>{c.val}</div>
            </div>
          ))}
        </div>

        {/* ── QUICK STATS ROW ── */}
        <div className="ph2" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            { icon: "ti ti-star-filled",      label: "Special Users",  val: s.specialUserCount ?? 0,    bg: "var(--purple-bg)", cl: "var(--purple)" },
            { icon: "ti ti-checkup-list",     label: "Open Tasks",     val: s.openTasks ?? 0,           bg: "var(--red-pale)",  cl: "var(--red)" },
            { icon: "ti ti-building-hospital",label: "Blood Banks",    val: s.bloodBankCount ?? 0,      bg: "var(--green-bg)",  cl: "var(--green)" },
            { icon: "ti ti-users-group",      label: "Volunteers",     val: s.volunteersCount ?? 0,     bg: "var(--amber-bg)",  cl: "var(--amber)" },
          ].map((q, i) => (
            <div key={i} style={{
              background: "var(--white)", borderRadius: "var(--r)",
              border: "1px solid var(--border)", padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "var(--shadow)",
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: q.bg, color: q.cl, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                <i className={q.icon} />
              </div>
              <div>
                <div style={{ fontFamily: "var(--f-display)", fontSize: 20, fontWeight: 800, color: "var(--dark)", letterSpacing: "-0.5px", lineHeight: 1 }}>{q.val}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, fontWeight: 500 }}>{q.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW 1: Blood + Gender + Special Users ── */}
        <div className="ph3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>

          {/* Blood Requests Donut */}
          <ChartCard title="Blood Requests" sub="Critical vs Normal" tag="Live" tagColor="red">
            <div style={{ padding: 18 }}>
              {totalBlood === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted2)" }}>
                  <i className="ti ti-chart-donut" style={{ fontSize: 32, display: "block", marginBottom: 10 }} />
                  <div style={{ fontSize: 12, fontWeight: 500 }}>No Data Found</div>
                </div>
              ) : (
                <DonutChart segments={bloodSegs} total={totalBlood} label="TOTAL" />
              )}
            </div>
          </ChartCard>

          {/* Users by Gender */}
          <ChartCard title="Users by Gender" sub="Registration breakdown" tag={`${totalUsers} Total`} tagColor="blue">
            <div style={{ padding: 18 }}>
              {totalUsers === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted2)" }}>
                  <i className="ti ti-chart-donut" style={{ fontSize: 32, display: "block", marginBottom: 10 }} />
                  <div style={{ fontSize: 12, fontWeight: 500 }}>No Data Found</div>
                </div>
              ) : (
                <DonutChart segments={genderSegs} total={totalUsers} label="USERS" />
              )}
            </div>
          </ChartCard>

          {/* Special Users Bar */}
          <ChartCard title="Special Users" sub="By organization type" tag={`${totalSpecial} Total`} tagColor="amber">
            <div style={{ padding: "14px 18px 18px" }}>
              <BarChart rows={specialBars} />
            </div>
          </ChartCard>
        </div>

        {/* ── CHARTS ROW 2: Platelet + Tasks + Camps ── */}
        <div className="ph4" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>

          {/* Platelet Requests */}
          <ChartCard title="Platelet Requests" sub="Critical vs Normal" tag={totalPlatelet ? `${totalPlatelet} Total` : "Empty"} tagColor="blue">
            <div style={{ padding: 18 }}>
              {totalPlatelet === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted2)" }}>
                  <i className="ti ti-chart-donut" style={{ fontSize: 32, display: "block", marginBottom: 10 }} />
                  <div style={{ fontSize: 12, fontWeight: 500 }}>No Data Found</div>
                </div>
              ) : (
                <DonutChart segments={plateletSegs} total={totalPlatelet} label="TOTAL" />
              )}
            </div>
          </ChartCard>

          {/* Tasks */}
          <ChartCard title="Tasks" sub="Open vs Closed" tag={totalTasks ? `${totalTasks} Total` : "Empty"} tagColor="amber">
            <div style={{ padding: 18 }}>
              {totalTasks === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted2)" }}>
                  <i className="ti ti-chart-donut" style={{ fontSize: 32, display: "block", marginBottom: 10 }} />
                  <div style={{ fontSize: 12, fontWeight: 500 }}>No Data Found</div>
                </div>
              ) : (
                <DonutChart segments={taskSegs} total={totalTasks} label="TASKS" />
              )}
            </div>
          </ChartCard>

          {/* Donation Camps */}
          <ChartCard title="Donation Camps" sub="Status overview" tag={null}>
            <div style={{ padding: 18 }}>
              {/* Mini stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { val: s.campToday ?? 0,  label: "TODAY",    bg: "var(--amber-bg)", cl: "var(--amber)" },
                  { val: s.campFuture ?? 0, label: "UPCOMING", bg: "var(--blue-bg)",  cl: "var(--blue)" },
                  { val: s.campPast ?? 0,   label: "PAST",     bg: "#EEE9E4",         cl: "var(--muted)" },
                ].map((c, i) => (
                  <div key={i} style={{ textAlign: "center", padding: 10, background: c.bg, borderRadius: "var(--r-sm)" }}>
                    <div style={{ fontFamily: "var(--f-display)", fontSize: 20, fontWeight: 800, color: c.cl }}>{c.val}</div>
                    <div style={{ fontSize: 10, color: c.cl, fontWeight: 600, marginTop: 2 }}>{c.label}</div>
                  </div>
                ))}
              </div>
              {/* Map placeholder */}
              <div style={{
                background: "linear-gradient(135deg,#1a2744 0%,#0f172a 100%)",
                borderRadius: "var(--r-sm)", height: 120,
                position: "relative", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {[
                  { top: "35%", left: "45%", anim: "mapPulse 2s infinite", bg: "#C0392B" },
                  { top: "60%", left: "60%", anim: "mapPulse2 2s infinite 0.5s", bg: "#3b82f6" },
                  { top: "50%", left: "30%", anim: "mapPulse3 2s infinite 1s", bg: "#16a34a" },
                ].map((d, i) => (
                  <div key={i} style={{ position: "absolute", top: d.top, left: d.left, width: 10, height: 10, borderRadius: "50%", background: d.bg, animation: d.anim }} />
                ))}
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "var(--f-display)", fontWeight: 600, letterSpacing: 1 }}>MAP VIEW · {s.campsCount ? `${s.campsCount} camps` : "No camps yet"}</div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* ── ROW 3: Activity + Alerts + (gap filler) ── */}
        <div className="ph5" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Recent Activity */}
          <ChartCard title="Recent Activity" sub="Last 24 hours"
            tag={<div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--green)", fontFamily: "var(--f-display)" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", animation: "liveRing 1.8s infinite" }} /> Live
            </div>}>
            <div style={{ padding: "0 18px" }}>
              {activity.map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 0", borderBottom: i < activity.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <ActIcon color={a.color} icon={a.icon} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--dark)" }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{a.sub}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted2)", flexShrink: 0, marginTop: 3, fontWeight: 500 }}>{a.time}</div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* System Alerts */}
          <ChartCard title="System Alerts" sub="Pending attention"
            tag={s.bloodRequestCountCrit > 0 ? `${s.bloodRequestCountCrit} Critical` : "All Clear"}
            tagColor={s.bloodRequestCountCrit > 0 ? "red" : "green"}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 14 }}>
              {alerts.map((a, i) => {
                const styles = {
                  critical:  { bg: "#FFF5F5", border: "var(--red-mid)",  iconColor: "var(--red)" },
                  warning:   { bg: "var(--bg)", border: "var(--border)", iconColor: "var(--amber)" },
                  info:      { bg: "var(--bg)", border: "var(--border)", iconColor: "var(--amber)" },
                  "info-blue": { bg: "var(--bg)", border: "var(--border)", iconColor: "var(--blue)" },
                };
                const st = styles[a.type] || styles.info;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: "var(--r-sm)", background: st.bg, border: `1px solid ${st.border}`,
                  }}>
                    <i className={a.icon} style={{ fontSize: 18, flexShrink: 0, color: st.iconColor }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--dark)", fontFamily: "var(--f-display)" }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{a.sub}</div>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", flexShrink: 0 }}>{a.time}</div>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted2)", fontSize: 13 }}>
                      <i className="ti ti-arrow-right" />
                    </button>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        {/* ── USERS TABLE ── */}
        <div className="ph6" style={{
          background: "var(--white)", borderRadius: "var(--r)",
          border: "none", boxShadow: "var(--shadow-md)", overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 20px", display: "flex", alignItems: "center",
            justifyContent: "space-between", borderBottom: "1px solid var(--border)",
          }}>
            <div>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 14, fontWeight: 700, color: "var(--dark)" }}>Registered Users</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>All members on the platform</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Link to="/users" className="lsa-btn-outline" style={{ padding: "6px 12px", fontSize: 12, textDecoration: "none" }}><i className="ti ti-filter" /> Filter</Link>
              <Link to="/users" className="lsa-btn-primary" style={{ padding: "6px 12px", fontSize: 12, textDecoration: "none" }}><i className="ti ti-user-plus" /> Add User</Link>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--f-body)", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {["User", "Blood Group", "Phone", "Gender", "Points", "Type", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted2)", textAlign: "left", letterSpacing: "0.8px", fontFamily: "var(--f-display)", textTransform: "uppercase", borderBottom: "1px solid var(--border)", background: "var(--bg)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted2)", fontSize: 13 }}>No users found</td></tr>
                ) : recentUsers.map((u, i) => {
                  const initials = (u.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  const colors = ["#C0392B", "#1d4ed8", "#7c3aed", "#16a34a", "#d97706"];
                  return (
                    <tr key={i} className="lsa-row-hover">
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: colors[i % colors.length], display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white", fontFamily: "var(--f-display)", flexShrink: 0 }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--dark)", fontFamily: "var(--f-display)", fontSize: 13 }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{u.email || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle" }}>
                        {u.bloodGroup ? <span style={{ fontFamily: "var(--f-display)", fontWeight: 700, color: "var(--red)", background: "var(--red-pale)", padding: "3px 10px", borderRadius: 6, fontSize: 12 }}>{u.bloodGroup}</span> : <span style={{ color: "var(--muted2)" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle", color: "var(--text)" }}>+{u.phoneCode} {u.phone}</td>
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle", color: "var(--text)" }}>{u.gender || "—"}</td>
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle" }}>
                        <span style={{ fontFamily: "var(--f-display)", fontWeight: 700, color: "var(--dark)" }}>{u.points ?? 0}</span>
                      </td>
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle" }}>
                        <span style={pillStyle(u.type === "user" ? "Individual" : u.type)}>{u.type === "user" ? "Individual" : u.type}</span>
                      </td>
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Link to={`/user/${u._id}`} className="lsa-icon-btn" title="View"><i className="ti ti-eye" /></Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)" }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Showing {recentUsers.length} of {s.userCount ?? recentUsers.length} users</div>
            <Link to="/users" style={{ fontSize: 12, color: "var(--red)", fontWeight: 600, fontFamily: "var(--f-display)", textDecoration: "none" }}>View All Users →</Link>
          </div>
        </div>

        {/* ── BLOOD REQUESTS TABLE ── */}
        <div style={{
          background: "var(--white)", borderRadius: "var(--r)",
          border: "none", boxShadow: "var(--shadow-md)", overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 20px", display: "flex", alignItems: "center",
            justifyContent: "space-between", borderBottom: "1px solid var(--border)",
          }}>
            <div>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 14, fontWeight: 700, color: "var(--dark)" }}>Blood &amp; Platelet Requests</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>All incoming requests requiring action</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {s.bloodRequestCountCrit > 0 && (
                <span style={{ background: "var(--red-pale)", color: "var(--red)", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99, fontFamily: "var(--f-display)" }}>{s.bloodRequestCountCrit} Critical</span>
              )}
              <Link to="/requests" className="lsa-btn-outline" style={{ padding: "6px 12px", fontSize: 12, textDecoration: "none" }}><i className="ti ti-filter" /> Filter</Link>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--f-body)", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {["Patient", "Type", "Blood Group", "Units", "Critical", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--muted2)", textAlign: "left", letterSpacing: "0.8px", fontFamily: "var(--f-display)", textTransform: "uppercase", borderBottom: "1px solid var(--border)", background: "var(--bg)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentRequests.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted2)", fontSize: 13 }}>No requests found</td></tr>
                ) : recentRequests.map((r, i) => {
                  const initials = (r.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  const statusColor = { Open: ["var(--amber-bg)", "var(--amber)"], Pending: ["var(--amber-bg)", "var(--amber)"], Close: ["var(--green-bg)", "var(--green)"], Canceled: ["#f3f4f6", "var(--muted)"] };
                  const [sBg, sCl] = statusColor[r.status] || ["var(--bg2)", "var(--muted)"];
                  return (
                    <tr key={i} className="lsa-row-hover">
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--red)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white", fontFamily: "var(--f-display)", flexShrink: 0 }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--dark)", fontFamily: "var(--f-display)", fontSize: 13 }}>{r.name}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>+{r.phoneCode} {r.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle" }}>
                        <span style={{ background: "var(--red-pale)", color: "var(--red)", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, fontFamily: "var(--f-display)" }}>{r.type || "Blood"}</span>
                      </td>
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle" }}>
                        <span style={{ fontFamily: "var(--f-display)", fontWeight: 700, color: "var(--red)", background: "var(--red-pale)", padding: "3px 10px", borderRadius: 6, fontSize: 12 }}>{r.bloodGroup}</span>
                      </td>
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle" }}>
                        <span style={{ fontFamily: "var(--f-display)", fontWeight: 700, color: "var(--dark)" }}>{r.needUnits}</span>
                      </td>
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle" }}>
                        {r.isCritical
                          ? <span style={{ background: "var(--red-pale)", color: "var(--red)", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, fontFamily: "var(--f-display)" }}>Critical</span>
                          : <span style={{ background: "var(--bg2)", color: "var(--muted)", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, fontFamily: "var(--f-display)" }}>Normal</span>}
                      </td>
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle" }}>
                        <span style={{ background: sBg, color: sCl, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, fontFamily: "var(--f-display)" }}>{r.status}</span>
                      </td>
                      <td style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", verticalAlign: "middle" }}>
                        <Link to={`/request/${r._id}`} className="lsa-icon-btn" title="View"><i className="ti ti-eye" /></Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)" }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Showing {recentRequests.length} of {totalBlood} requests</div>
            <Link to="/requests" style={{ fontSize: 12, color: "var(--red)", fontWeight: 600, fontFamily: "var(--f-display)", textDecoration: "none" }}>View All Requests →</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
