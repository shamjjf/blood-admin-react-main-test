import { useState } from "react";

const SearchFilter = ({ setSearchText }) => {
  const [val, setVal] = useState("");
  const handle = (e) => {
    setVal(e.target.value);
    setTimeout(() => setSearchText(e.target.value), 300);
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
      <i className="ti ti-search" style={{
        position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
        fontSize: 16, color: "#9ca3af", pointerEvents: "none",
      }}/>
      <input
        type="text" value={val} onChange={handle}
        placeholder="Search..."
        style={{
          width: "100%", height: 38, paddingLeft: 38, paddingRight: 14,
          border: "1px solid rgba(0,0,0,0.11)", borderRadius: 9,
          fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: "white",
          outline: "none", boxSizing: "border-box", color: "#374151",
        }}
      />
    </div>
  );
};
export default SearchFilter;
