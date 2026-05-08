const iconMap = {
  "Users":             { icon: "ti ti-users",             cls: "blue" },
  "Special User":      { icon: "ti ti-star",              cls: "amber" },
  "Volunteers":        { icon: "ti ti-heart-handshake",   cls: "green" },
  "Blood Requests":    { icon: "ti ti-droplet-filled",    cls: "red" },
  "Platelet Requests": { icon: "ti ti-activity",          cls: "blue" },
  "Tasks":             { icon: "ti ti-checkup-list",      cls: "amber" },
  "Camps":             { icon: "ti ti-calendar-event",    cls: "purple" },
  "Blood Banks":       { icon: "ti ti-building-hospital", cls: "green" },
  "Total Donors":      { icon: "ti ti-droplet-half-2",    cls: "red" },
};

const DashboardCompletionData = ({ title, count }) => {
  const meta = iconMap[title] || { icon: "ti ti-chart-bar", cls: "blue" };
  const isHero = title === "Total Donors" || title === "Blood Requests";
  const n = count ?? 0;

  return (
    <div className={`lsa-stat-card lsa-fade${isHero ? " hero" : ""}`}>
      <div className={`lsa-stat-icon ${isHero ? "white" : meta.cls}`}>
        <i className={meta.icon} />
      </div>
      <div className="lsa-stat-val">{n}</div>
      <div className="lsa-stat-label">{title}</div>
      <div className="lsa-stat-trend">
        <i className="ti ti-trending-up" /> Live data
      </div>
      <div className="lsa-stat-bg-num">{n}</div>
    </div>
  );
};

export default DashboardCompletionData;
