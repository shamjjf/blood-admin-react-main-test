const S = {
  bar: { display:"flex", alignItems:"center", flexWrap:"wrap", gap:12, padding:"14px 16px", background:"#FAFAFA", borderBottom:"1px solid #EBEBEB" },
  group: { display:"flex", flexDirection:"column", gap:4 },
  lbl: { fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:"0.6px", textTransform:"uppercase", fontFamily:"'Syne',sans-serif" },
  sel: { height:36, padding:"0 10px", borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", outline:"none", minWidth:140 },
  srchWrap: { position:"relative", minWidth:200 },
  srchIcon: { position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"#9CA3AF" },
  srchInput: { height:36, paddingLeft:34, paddingRight:12, borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" },
};

const ContrubutionFilter = ({ setSearchText, statusSelects, setStatusSelects }) => {
  const debounce = (e) => setTimeout(() => setSearchText(e.target.value), 300);
  return (
    <div style={S.bar}>
      <div style={S.srchWrap}>
        <i className="ti ti-search" style={S.srchIcon}/>
        <input type="text" placeholder="Search contributions..." onChange={debounce} style={S.srchInput}/>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Status</label>
        <select value={statusSelects} onChange={e => setStatusSelects(e.target.value)} style={S.sel}>
          {["All","Pending","Approved","Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
};
export default ContrubutionFilter;
