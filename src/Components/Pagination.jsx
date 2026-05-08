const Pagination = ({ totalPages = 1, currentPage = 1, setCurrentPage }) => {
  const go = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  const pages = [];
  const max = 7;
  let start = Math.max(1, currentPage - Math.floor(max / 2));
  let end = Math.min(totalPages, start + max - 1);
  if (end - start < max - 1) start = Math.max(1, end - max + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  const btnBase = {
    height: 32, minWidth: 32, padding: "0 10px", border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 8, background: "white", fontSize: 13, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center",
    justifyContent: "center", transition: "all 0.13s", color: "#374151",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      <button onClick={() => go(currentPage - 1)} disabled={currentPage <= 1}
        style={{ ...btnBase, opacity: currentPage <= 1 ? 0.4 : 1 }}>
        <i className="ti ti-chevron-left" style={{ fontSize: 14 }}/>
      </button>

      {start > 1 && <>
        <button onClick={() => go(1)} style={btnBase}>1</button>
        {start > 2 && <span style={{ color: "#9ca3af", padding: "0 4px" }}>…</span>}
      </>}

      {pages.map(p => (
        <button key={p} onClick={() => go(p)} style={{
          ...btnBase,
          background: p === currentPage ? "#C0392B" : "white",
          color: p === currentPage ? "white" : "#374151",
          borderColor: p === currentPage ? "#C0392B" : "rgba(0,0,0,0.1)",
          fontWeight: p === currentPage ? 700 : 400,
        }}>{p}</button>
      ))}

      {end < totalPages && <>
        {end < totalPages - 1 && <span style={{ color: "#9ca3af", padding: "0 4px" }}>…</span>}
        <button onClick={() => go(totalPages)} style={btnBase}>{totalPages}</button>
      </>}

      <button onClick={() => go(currentPage + 1)} disabled={currentPage >= totalPages}
        style={{ ...btnBase, opacity: currentPage >= totalPages ? 0.4 : 1 }}>
        <i className="ti ti-chevron-right" style={{ fontSize: 14 }}/>
      </button>
    </div>
  );
};
export default Pagination;
