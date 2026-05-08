const S = {
  bar: { display:"flex", alignItems:"center", flexWrap:"wrap", gap:12, padding:"14px 16px", background:"#FAFAFA", borderBottom:"1px solid #EBEBEB" },
  group: { display:"flex", flexDirection:"column", gap:4 },
  lbl: { fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:"0.6px", textTransform:"uppercase", fontFamily:"'Syne',sans-serif" },
  sel: { height:36, padding:"0 10px", borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", outline:"none", minWidth:160 },
};

const BulkUserFilter = ({ specialUsers, selectedUser, setSelectedUser, statusA, setStatusA }) => {
  return (
    <div style={S.bar}>
      <div style={S.group}>
        <label style={S.lbl}>Special User</label>
        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} style={S.sel}>
          <option value="">All</option>
          {specialUsers?.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
        </select>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Status</label>
        <select value={statusA} onChange={e => setStatusA(e.target.value)} style={S.sel}>
          {["All","Approved","Denied","Pending"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
};
export default BulkUserFilter;
