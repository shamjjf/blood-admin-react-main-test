const S = {
  bar: { display:"flex", alignItems:"center", flexWrap:"wrap", gap:12, padding:"14px 16px", background:"#FAFAFA", borderBottom:"1px solid #EBEBEB" },
  group: { display:"flex", flexDirection:"column", gap:4 },
  lbl: { fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:"0.6px", textTransform:"uppercase", fontFamily:"'Syne',sans-serif" },
  sel: { height:36, padding:"0 10px", borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", outline:"none", minWidth:150 },
  srchWrap: { position:"relative", minWidth:200 },
  srchIcon: { position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"#9CA3AF" },
  srchInput: { height:36, paddingLeft:34, paddingRight:12, borderRadius:8, border:"1px solid #E5E7EB", background:"#FFF", fontSize:13, color:"#374151", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" },
};

const BloodBankFilters = ({ selectedCountry, setSelectedCountry, selectedState, setSelectedState, selectedCity, setSelectedCity, setSearchText, countries, states, cities, setCountryForURL, setStateForURL }) => {
  const debounce = (e) => setTimeout(() => setSearchText(e.target.value), 300);
  return (
    <div style={S.bar}>
      <div style={S.srchWrap}>
        <i className="ti ti-search" style={S.srchIcon}/>
        <input type="text" placeholder="Search blood banks..." onChange={debounce} style={S.srchInput}/>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>Country</label>
        <select value={selectedCountry} style={S.sel} onChange={e => {
          const c = countries.find(x => x.isoCode === e.target.value);
          setSelectedCountry(e.target.value);
          if (c) setCountryForURL(c.name);
        }}>
          <option value="">Select Country</option>
          {countries.map((c,i) => <option key={i} value={c.isoCode}>{c.name}</option>)}
        </select>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>State</label>
        <select value={selectedState} style={{...S.sel, opacity: !selectedCountry ? 0.5 : 1}} disabled={!selectedCountry} onChange={e => {
          const st = states.find(x => x.isoCode === e.target.value);
          setSelectedState(e.target.value);
          if (st) setStateForURL(st.name);
        }}>
          <option value="">Select State</option>
          {states.map((s,i) => <option key={i} value={s.isoCode}>{s.name}</option>)}
        </select>
      </div>
      <div style={S.group}>
        <label style={S.lbl}>City</label>
        <select value={selectedCity} style={{...S.sel, opacity: !selectedState ? 0.5 : 1}} disabled={!selectedState} onChange={e => setSelectedCity(e.target.value)}>
          <option value="">Select City</option>
          {cities.map((c,i) => <option key={i} value={c.isoCode}>{c.name}</option>)}
        </select>
      </div>
    </div>
  );
};
export default BloodBankFilters;
