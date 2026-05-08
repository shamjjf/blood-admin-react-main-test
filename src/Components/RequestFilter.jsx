import { useState } from "react";

const S = {
  bar: { display:"flex", alignItems:"center", flexWrap:"wrap", gap:12, padding:"14px 16px", background:"#FAFAFA", borderBottom:"1px solid #EBEBEB" },
  group: { display:"flex", flexDirection:"column", gap:4 },
  lbl: { fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:"0.6px", textTransform:"uppercase", fontFamily:"'Syne',sans-serif" },
  sel: { height:36, padding:"0 10px", borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", outline:"none", minWidth:130 },
  srchWrap: { position:"relative", minWidth:200 },
  srchIcon: { position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"#9CA3AF" },
  srchInput: { height:36, paddingLeft:34, paddingRight:12, borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" },
};

const BLOOD = ["All","A+","A-","B+","B-","AB+","AB-","O+","O-","A1+","A1-","A2+","A2-","A1B+","A1B-","A2B+","A2B-","Bombay Blood Group","INRA"];

const RequestFilter = ({ bloodSelects, setBloodSelects, statusSelects, setStatusSelects, needUnitsSelects, setNeedUnitsSelects, gotUnitsSelects, setGotUnitsSelects, setSearchText }) => {
  const debounce = (e) => setTimeout(() => setSearchText(e.target.value), 300);
  const units = ["All","1","2","3","4","5","6","7","8","9","10"];
  return (
    <div style={S.bar}>
      <div style={S.srchWrap}>
        <i className="ti ti-search" style={S.srchIcon}/>
        <input type="text" placeholder="Search requests..." onChange={debounce} style={S.srchInput}/>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Blood Group</label>
        <select value={bloodSelects} onChange={e => setBloodSelects(e.target.value)} style={S.sel}>
          {BLOOD.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Status</label>
        <select value={statusSelects} onChange={e => setStatusSelects(e.target.value)} style={S.sel}>
          {["All","Open","Pending","Close","Canceled"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Need Units</label>
        <select value={needUnitsSelects} onChange={e => setNeedUnitsSelects(e.target.value)} style={S.sel}>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Got Units</label>
        <select value={gotUnitsSelects} onChange={e => setGotUnitsSelects(e.target.value)} style={S.sel}>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
    </div>
  );
};
export default RequestFilter;
