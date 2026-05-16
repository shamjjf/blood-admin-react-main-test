import { useState } from "react";

const S = {
  bar: { display:"flex", alignItems:"center", flexWrap:"wrap", gap:12, padding:"14px 16px", background:"#FAFAFA", borderBottom:"1px solid #EBEBEB" },
  group: { display:"flex", flexDirection:"column", gap:4, minWidth:140 },
  lbl: { fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:"0.6px", textTransform:"uppercase", fontFamily:"'Syne',sans-serif" },
  sel: { height:36, padding:"0 10px", borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", outline:"none", minWidth:130 },
  srchWrap: { position:"relative", minWidth:200 },
  srchIcon: { position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"#9CA3AF" },
  srchInput: { height:36, paddingLeft:34, paddingRight:12, borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" },
};

const BLOOD = ["All","A+","A-","B+","B-","AB+","AB-","O+","O-","A1+","A1-","A2+","A2-","A1B+","A1B-","A2B+","A2B-","Bombay Blood Group","INRA","Don't Know"];

const ROLES = [
  { value: "All", label: "All" },
  { value: "donor", label: "Donor" },
  { value: "patient", label: "Patient" },
  { value: "volunteer", label: "Volunteer" },
  { value: "staff", label: "Staff" },
  { value: "superadmin", label: "Super Admin" },
  { value: "deactivated", label: "Deactivated" },
];

const UserFilter = ({ bloodGroupSelects, setBloodGroupSelects, genderSelects, setGenderSelects, pointsSelects, setPointsSelects, setSearchText, kycStatusSelects, setKycStatusSelects, roleSelects, setRoleSelects }) => {
  const debounce = (e) => setTimeout(() => setSearchText(e.target.value), 300);
  return (
    <div style={S.bar}>
      <div style={S.srchWrap}>
        <i className="ti ti-search" style={S.srchIcon}/>
        <input type="text" placeholder="Search users..." onChange={debounce} style={S.srchInput}/>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Role</label>
        <select value={roleSelects || "All"} onChange={e => setRoleSelects && setRoleSelects(e.target.value)} style={S.sel}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Blood Group</label>
        <select value={bloodGroupSelects} onChange={e => setBloodGroupSelects(e.target.value)} style={S.sel}>
          {BLOOD.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Gender</label>
        <select value={genderSelects} onChange={e => setGenderSelects(e.target.value)} style={S.sel}>
          {["All","Male","Female"].map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>KYC Status</label>
        <select value={kycStatusSelects || "All"} onChange={e => setKycStatusSelects && setKycStatusSelects(e.target.value)} style={S.sel}>
          {["All","pending","verified","rejected"].map(k => <option key={k} value={k}>{k === "All" ? "All" : k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
        </select>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Points</label>
        <select value={pointsSelects} onChange={e => setPointsSelects(e.target.value)} style={S.sel}>
          <option value={0}>All</option>
          <option value={1}>Low → High</option>
          <option value={-1}>High → Low</option>
        </select>
      </div>
    </div>
  );
};
export default UserFilter;
