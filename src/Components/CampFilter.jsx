const S = {
  bar: { display:"flex", alignItems:"center", flexWrap:"wrap", gap:12, padding:"14px 16px", background:"#FAFAFA", borderBottom:"1px solid #EBEBEB" },
  group: { display:"flex", flexDirection:"column", gap:4 },
  lbl: { fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:"0.6px", textTransform:"uppercase", fontFamily:"'Syne',sans-serif" },
  sel: { height:36, padding:"0 10px", borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", outline:"none", minWidth:130 },
  inp: { height:36, padding:"0 10px", borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  srchWrap: { position:"relative", minWidth:200 },
  srchIcon: { position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"#9CA3AF" },
  srchInput: { height:36, paddingLeft:34, paddingRight:12, borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" },
};

const CampFilter = ({ setSearchText, setDonorsExpected, setStartDate, setEndDate, searchText, startDate, endDate, donorsExpected }) => {
  const debounce = (e) => setTimeout(() => setSearchText(e.target.value), 300);
  return (
    <div style={S.bar}>
      <div style={S.srchWrap}>
        <i className="ti ti-search" style={S.srchIcon}/>
        <input type="text" placeholder="Search camps..." onChange={debounce} style={S.srchInput}/>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Start Date</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={S.inp}/>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>End Date</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={S.inp}/>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Donors Expected</label>
        <select value={donorsExpected} onChange={e => setDonorsExpected(e.target.value)} style={S.sel}>
          <option value="">All</option>
          <option value={1}>Low → High</option>
          <option value={-1}>High → Low</option>
        </select>
      </div>
    </div>
  );
};
export default CampFilter;
