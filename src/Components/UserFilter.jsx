import { useState } from "react";

const S = {
  bar: { display:"flex", alignItems:"center", flexWrap:"wrap", gap:12, padding:"14px 16px", background:"#FAFAFA", borderBottom:"1px solid #EBEBEB" },
  sel: { flex:"1 1 150px", height:40, padding:"0 12px", borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, fontWeight:600, color:"#374151", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", outline:"none", minWidth:150 },
  srchWrap: { position:"relative", flex:"1 1 220px", minWidth:220 },
  srchIcon: { position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"#9CA3AF" },
  srchInput: { height:40, paddingLeft:36, paddingRight:12, borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" },
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

const UserFilter = ({ bloodGroupSelects, setBloodGroupSelects, genderSelects, setGenderSelects, pointsSelects, setPointsSelects, setSearchText, citySelects, setCitySelects, kycStatusSelects, setKycStatusSelects, roleSelects, setRoleSelects }) => {
  const debounce = (e) => setTimeout(() => setSearchText(e.target.value), 300);
  const debounceCity = (e) => {
    const v = e.target.value;
    setTimeout(() => setCitySelects && setCitySelects(v), 300);
  };
  return (
    <div style={S.bar}>
      {/* Match the City input's placeholder to the dropdown label colour. */}
      <style>{`
        .uf-city-input::placeholder { color:#374151 !important; font-weight:600 !important; opacity:1 !important; }
        .uf-city-input::-webkit-input-placeholder { color:#374151 !important; font-weight:600 !important; opacity:1 !important; }
        .uf-city-input::-moz-placeholder { color:#374151 !important; font-weight:600 !important; opacity:1 !important; }
        .uf-city-input:-ms-input-placeholder { color:#374151 !important; font-weight:600 !important; }
      `}</style>
      <div style={S.srchWrap}>
        <i className="ti ti-search" style={S.srchIcon}/>
        <input type="text" placeholder="Search users..." onChange={debounce} style={S.srchInput}/>
      </div>
      <select value={roleSelects || "All"} onChange={e => setRoleSelects && setRoleSelects(e.target.value)} style={S.sel}>
        {ROLES.map(r => <option key={r.value} value={r.value}>{r.value === "All" ? "Role" : r.label}</option>)}
      </select>
      <select value={bloodGroupSelects} onChange={e => setBloodGroupSelects(e.target.value)} style={S.sel}>
        {BLOOD.map(b => <option key={b} value={b}>{b === "All" ? "Blood Group" : b}</option>)}
      </select>
      <input type="text" className="uf-city-input" placeholder="City" defaultValue={citySelects || ""} onChange={debounceCity} style={S.sel}/>
      <select value={genderSelects} onChange={e => setGenderSelects(e.target.value)} style={S.sel}>
        {["All","Male","Female"].map(g => <option key={g} value={g}>{g === "All" ? "Gender" : g}</option>)}
      </select>
      <select value={kycStatusSelects || "All"} onChange={e => setKycStatusSelects && setKycStatusSelects(e.target.value)} style={S.sel}>
        {["All","pending","verified","rejected"].map(k => <option key={k} value={k}>{k === "All" ? "KYC Status" : k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
      </select>
      <select value={pointsSelects} onChange={e => setPointsSelects(e.target.value)} style={S.sel}>
        <option value={0}>Points</option>
        <option value={1}>Low → High</option>
        <option value={-1}>High → Low</option>
      </select>
    </div>
  );
};
export default UserFilter;
