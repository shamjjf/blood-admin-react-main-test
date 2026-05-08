const PageDetails = ({ totalCount = 0, totalPages = 1, limit = 10, handelLimit }) => {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 0", flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
        Show
      </span>
      <select
        value={limit}
        onChange={(e) => handelLimit(e.target.value)}
        style={{
          height: 32, padding: "0 10px", borderRadius: 8,
          border: "1px solid rgba(0,0,0,0.12)", background: "white",
          fontSize: 13, color: "#374151", fontFamily: "'DM Sans', sans-serif",
          cursor: "pointer", outline: "none",
        }}
      >
        {[5, 10, 15, 20, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
        entries &nbsp;·&nbsp; Total: <b style={{ color: "#111" }}>{totalCount}</b>
      </span>
    </div>
  );
};
export default PageDetails;
