import { useContext, useEffect, useState } from "react";
import dragula from "dragula";
import "dragula/dist/dragula.min.css";
import { useParams, Link } from "react-router-dom";
import moment from "moment";
import { GlobalContext } from "../GlobalContext";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import swal from "sweetalert";
import { formatDate } from "../Components/FormatedDate";
import SEO from "../SEO";

/* ── shared field style ── */
const F = {
  wrap:  { marginBottom: 16 },
  label: { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, fontFamily:"var(--f-display)" },
  req:   { color:"var(--red)", marginLeft:2 },
  input: {
    width:"100%", height:40, padding:"0 12px",
    border:"1px solid rgba(0,0,0,0.12)", borderRadius:8,
    fontSize:13, fontFamily:"var(--f-body)", color:"#1a1a1a",
    background:"#FAFAFA", outline:"none", boxSizing:"border-box",
    transition:"border-color 0.15s",
  },
  select: {
    width:"100%", height:40, padding:"0 12px",
    border:"1px solid rgba(0,0,0,0.12)", borderRadius:8,
    fontSize:13, fontFamily:"var(--f-body)", color:"#1a1a1a",
    background:"#FAFAFA", outline:"none", boxSizing:"border-box",
    cursor:"pointer",
  },
  err: { fontSize:11, color:"var(--red)", marginTop:4 },
};

/* ── section card ── */
const Section = ({ title, desc, children }) => (
  <div style={{
    background:"#fff", borderRadius:12,
    boxShadow:"0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
    overflow:"hidden", marginBottom:20,
  }}>
    {/* header — red theme */}
    <div style={{
      background:"var(--red)", padding:"14px 20px",
    }}>
      <div style={{ fontSize:15, fontWeight:700, color:"#fff", fontFamily:"var(--f-display)" }}>{title}</div>
      {desc && <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginTop:2 }}>{desc}</div>}
    </div>
    <div style={{ padding:"20px 20px 8px" }}>{children}</div>
  </div>
);

const RequestDetails = () => {
  const { setLoading, auth, alert } = useContext(GlobalContext);
  const [request, setRequest] = useState({
    name:"", type:"Blood", bloodGroup:"", status:"Open",
    date: new Date(), isCritical:false, gotUnits:0, needUnits:0,
    location:"", phone:"", note:"",
  });
  const [isEditing, setIsEditing]   = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [errors, setErrors]         = useState({});
  const { id }                      = useParams();
  const [searchResult, setSearchResult]   = useState([]);
  const [searchResultF, setSearchResultF] = useState([]);
  const [searchBloodGroup, setSearchBloodGroup] = useState("All");
  const [flag, setflag]   = useState(false);
  const [tid, setTid]     = useState(0);
  const [address, setAddress] = useState([]);

  const BG_LIST = ["A+","A-","B+","B-","AB+","AB-","O+","O-","A1+","A1-","A2+","A2-","A1B+","A1B-","A2B+","A2B-","Bombay Blood Group","INRA","Don't Know"];

  const validate = () => {
    let ok = true;
    if (!request.name?.trim())       { swal("Error","Name is Required!","error");       ok=false; }
    if (!request.pinCode?.trim())    { swal("Error","Pincode is Required!","error");    ok=false; }
    if (!formatDate(request.date))   { swal("Error","Date is Required!","error");       ok=false; }
    if (request.date) {
      const sel = new Date(request.date), today = new Date(); today.setHours(0,0,0,0);
      if (sel <= today) { swal("Error","Cannot accept a Date from the past!","error"); ok=false; }
    }
    if (!request.gotUnits  || isNaN(request.gotUnits))  { swal("Error","Got Units required!","error");  ok=false; }
    if (!request.needUnits || isNaN(request.needUnits)) { swal("Error","Need Units required!","error"); ok=false; }
    if (!request.location) { swal("Error","Cannot accept an empty Location!","error"); ok=false; }
    if (!request.note)     { swal("Error","Cannot accept an empty Note!","error");     ok=false; }
    if (!request.phone)    { swal("Error","Phone number is required!","error");        ok=false; }
    else if (phoneError)   { swal("Error","Invalid Phone Number Format!","error");     ok=false; }
    return ok;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if ((name==="gotUnits"||name==="needUnits") && value<0) { swal("Error","Cannot be negative!","error"); return; }
    if (name==="needUnits" && value.length>4)    { swal("Error","Maximum limit reached!","error"); return; }
    if (name==="gotUnits"  && value>request.needUnits) { swal("Error","Got units cannot be greater than Needed units!","error"); return; }
    if (name==="name" && value.length>40)  { swal("Error","Maximum characters reached!","error"); return; }
    if (name==="note" && value.length>100) { swal("Error","Note cannot accept more than 100 characters!","error"); return; }
    setRequest(p => ({ ...p, [name]: type==="checkbox" ? checked : value }));
  };

  const debouncedSearch = (e) => {
    setTimeout(async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/searchdonors/${request._id}?search=${e.target.value}&recId=${request.recipient._id}&bloodGroup=${encodeURIComponent(searchBloodGroup||"All")}`,
          { headers:{ Authorization: sessionStorage.getItem("auth") } }
        );
        setSearchResult(res.data.donors);
        setSearchResultF(res.data.donors);
      } catch(err){ console.log(err); } finally { setLoading(false); }
    }, 500);
  };

  const handleUpdate = async (e) => {
    if (validate()) {
      try {
        setLoading(true); e.preventDefault();
        await axios.post(`${import.meta.env.VITE_API_URL}/updaterequest/${id}`, request,
          { headers:{ Authorization: sessionStorage.getItem("auth") } });
        swal("Success","Request Updated Successfully!","success");
        setIsEditing(false);
      } catch(err){ swal("Error","Error updating the request!","error"); } finally { setLoading(false); }
    }
  };

  const handleLocationChange = async (e) => {
    const q = e.target.value;
    if (!q) setAddress([]);
    setRequest({ ...request, location: q });
    clearTimeout(tid);
    setTid(setTimeout(async () => {
      if (q) {
        try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/googleapi`, { dummyData: q });
          setAddress(res.data.results);
        } catch(err){ console.error(err); }
      }
    }, 500));
  };

  const handleLocationSubmission = (location, geometry) => {
    setRequest({ ...request, location, address:{ latitude: geometry.lat, longitude: geometry.lng } });
    setAddress([]);
  };

  const downloadProofs = (proof) => {
    const link = document.createElement("a");
    link.href = proof.url; link.target = "_blank";
    link.download = `prescription_${proof.name}`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleDonationStatChange = async (e, donId) => {
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/donation/${donId}`,
        { status: e.target.value },
        { headers:{ Authorization: sessionStorage.getItem("auth") } });
      setflag(!flag);
    } catch(err){ console.log(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/request/${id}`,
          { headers:{ Authorization: sessionStorage.getItem("auth") } });
        setRequest(res.data.request);
        if (res.data.request.bloodGroup) setSearchBloodGroup(res.data.request.bloodGroup);
        if (res.data.request.donations?.find(d => d?.status==="pendingApproval")) setIsApproving(true);
      } catch(err){ console.log(err); } finally { setLoading(false); }
    };

    const doSearch = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/searchdonors/${id}?recId=${request.recipient?._id}&bloodGroup=${encodeURIComponent(searchBloodGroup)}`,
          { headers:{ Authorization: sessionStorage.getItem("auth") } });
        setSearchResult(res.data.donors); setSearchResultF(res.data.donors);
      } catch(err){ console.log(err); } finally { setLoading(false); }
    };

    fetchData(); doSearch();

    const drake = dragula([
      document.getElementById("profile-list-left"),
      document.getElementById("profile-list-right"),
    ]);
    drake.on("drop", (el, target, source) => {
      if (target.id==="profile-list-left" && source.id==="profile-list-right") {
        const uid = el.getAttribute("data-user-id");
        const bg  = el.getAttribute("data-user-blood");
        if (bg !== request.bloodGroup) { source.appendChild(el); return; }
        target.appendChild(el);
      }
    });
    return () => drake.destroy();
  }, [id, request._id, setLoading, flag, searchBloodGroup]);

  useEffect(() => {
    const sync = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/searchdonors/${id}?recId=${request.recipient?._id}&bloodGroup=${encodeURIComponent(searchBloodGroup||"All")}`,
          { headers:{ Authorization: sessionStorage.getItem("auth") } });
        setSearchResult(res.data.donors); setSearchResultF(res.data.donors);
      } catch(err){ console.log(err); } finally { setLoading(false); }
    };
    sync();
  }, [searchBloodGroup]);

  /* ── pill badge for donation status ── */
  const donPill = (status) => {
    const map = {
      Approved:       { bg:"var(--green-bg)", cl:"var(--green)" },
      Denied:         { bg:"var(--red-pale)",  cl:"var(--red)" },
      pendingApproval:{ bg:"var(--amber-bg)",  cl:"var(--amber)" },
    };
    const s = map[status] || { bg:"#f3f4f6", cl:"#6b7280" };
    return { background:s.bg, color:s.cl, fontSize:10, fontWeight:700,
             padding:"3px 9px", borderRadius:99, fontFamily:"var(--f-display)", display:"inline-block" };
  };

  /* ── reusable donation table ── */
  const DonTable = ({ title, filter }) => {
    const rows = request.donations?.filter(filter) || [];
    return (
      <div style={{ background:"#fff", borderRadius:12, boxShadow:"0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)", overflow:"hidden", marginTop:20 }}>
        <div style={{ background:"var(--red)", padding:"14px 20px" }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#fff", fontFamily:"var(--f-display)" }}>{title}</div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"var(--f-body)", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#F7F4F1" }}>
                {["#","Donor Name","Distance","Date","Mobile No","View"].map(h=>(
                  <th key={h} style={{ padding:"10px 16px", fontSize:10, fontWeight:700, color:"#9ca3af", textAlign:"left", letterSpacing:"0.8px", fontFamily:"var(--f-display)", textTransform:"uppercase", borderBottom:"1px solid rgba(0,0,0,0.07)", background:"#F7F4F1" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length===0 ? (
                <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:"#9ca3af", fontSize:13 }}>No records yet</td></tr>
              ) : rows.map((d,i)=>(
                <tr key={d._id} style={{ cursor:"pointer" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F7F4F1"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"12px 16px", borderTop:"1px solid rgba(0,0,0,0.07)" }}>{i+1}</td>
                  <td style={{ padding:"12px 16px", borderTop:"1px solid rgba(0,0,0,0.07)", fontWeight:600, color:"#111" }}>{d.donor?.name}</td>
                  <td style={{ padding:"12px 16px", borderTop:"1px solid rgba(0,0,0,0.07)" }}>{d.distance ? `${d.distance} km` : "N/A"}</td>
                  <td style={{ padding:"12px 16px", borderTop:"1px solid rgba(0,0,0,0.07)" }}>{d.updatedAt ? moment(d.updatedAt).format("DD-MM-YYYY h:mm A") : "N/A"}</td>
                  <td style={{ padding:"12px 16px", borderTop:"1px solid rgba(0,0,0,0.07)" }}>{d.donor?.phone||"N/A"}</td>
                  <td style={{ padding:"12px 16px", borderTop:"1px solid rgba(0,0,0,0.07)" }}>
                    <Link to={`/user/${d.donor?._id}`} style={{ color:"var(--red)", fontSize:16 }}><i className="ti ti-eye"/></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="content-wrapper">
      <SEO title="Request Details"/>
      <style>{`
        .rd-input:focus { border-color: var(--red) !important; box-shadow: 0 0 0 3px rgba(192,57,43,0.1) !important; }
        .rd-btn-edit { display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--f-display);transition:all 0.15s; }
      `}</style>

      {/* Page header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"var(--f-display)", fontSize:20, fontWeight:800, color:"#111", margin:0 }}>Request Details</h1>
          <div style={{ fontSize:12, color:"#6b7280", marginTop:4 }}>View and manage this blood/platelet request</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="rd-btn-edit"
            style={{ background:"none", border:"1px solid rgba(0,0,0,0.15)", color:"#374151" }}
            onClick={()=>setIsApproving(!isApproving)}>
            <i className="ti ti-clipboard-check"/> Pending Approvals
          </button>
          <button className="rd-btn-edit"
            style={{ background: isEditing ? "#f3f4f6" : "var(--red)", border:"none", color: isEditing ? "#374151" : "white" }}
            onClick={()=>{ setIsEditing(!isEditing); setErrors({}); }}>
            <i className={`ti ti-${isEditing?"x":"edit"}`}/> {isEditing ? "Cancel" : "Edit"}
          </button>
          {isEditing && (
            <button className="rd-btn-edit"
              style={{ background:"var(--green)", border:"none", color:"white" }}
              onClick={handleUpdate}>
              <i className="ti ti-check"/> Update
            </button>
          )}
        </div>
      </div>

      {request && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

          {/* LEFT: Personal Details */}
          <Section title="Personal Details" desc="Personal details for this request">
            {[
              { label:"Name",          name:"name",         type:"text",   value:request.name,        required:true,  err:errors.name },
              { label:"Hospital Name", name:"hospitalName", type:"text",   value:request.hospitalName },
              { label:"Type",          name:"type",         type:"select", value:request.type,         opts:["Blood","Platelet"] },
              { label:"Blood Group",   name:"bloodGroup",   type:"select", value:request.bloodGroup,   opts:BG_LIST },
              { label:"Status",        name:"status",       type:"select", value:request.status,       opts:["Open","Pending","Close","Canceled"] },
              { label:"Pincode",       name:"pinCode",      type:"number", value:request.pinCode,      required:true,  err:errors.pinCode },
              { label:"Date",          name:"date",         type:"date",   value:formatDate(request.date), required:true, err:errors.date },
            ].map((f,i)=>(
              <div key={i} style={F.wrap}>
                <label style={F.label}>{f.label}{f.required && <span style={F.req}>*</span>}</label>
                {f.type==="select" ? (
                  <select name={f.name} value={f.value} onChange={handleInputChange}
                    disabled={!isEditing} className="rd-input" style={F.select}>
                    {f.opts.map((o,j)=><option key={j} value={o.toString()}>{o.toString()}</option>)}
                  </select>
                ) : (
                  <input name={f.name} type={f.type} value={f.value||""} onChange={handleInputChange}
                    disabled={!isEditing} className="rd-input" style={F.input} placeholder={f.label}/>
                )}
                {f.err && <div style={F.err}>{f.err}</div>}
              </div>
            ))}
          </Section>

          {/* RIGHT: Resource + Contact */}
          <Section title="Resource Requirements & Contact" desc="Units needed and contact information">
            {/* Got Units */}
            <div style={F.wrap}>
              <label style={F.label}>Got Units<span style={F.req}>*</span></label>
              <input name="gotUnits" type="number" value={request.gotUnits} onChange={handleInputChange}
                disabled={!isEditing} className="rd-input" style={F.input}/>
              {errors.gotUnits && <div style={F.err}>{errors.gotUnits}</div>}
            </div>
            {/* Need Units */}
            <div style={F.wrap}>
              <label style={F.label}>Need Units<span style={F.req}>*</span></label>
              <input name="needUnits" type="number" value={request.needUnits} onChange={handleInputChange}
                disabled={!isEditing} className="rd-input" style={F.input}/>
              {errors.needUnits && <div style={F.err}>{errors.needUnits}</div>}
            </div>
            {/* Phone */}
            <div style={F.wrap}>
              <label style={F.label}>Mobile Number</label>
              <PhoneInput country="in"
                containerStyle={{ width:"100%", borderRadius:8, height:40 }}
                inputStyle={{ width:"100%", height:40, border:"1px solid rgba(0,0,0,0.12)", borderRadius:8, fontSize:13, fontFamily:"var(--f-body)", background:"#FAFAFA" }}
                value={`${request.phoneCode}${request.phone}`}
                disabled={true}
                onChange={(val,country,e,fmt)=>{
                  const parts = fmt.split(" "); const newPhone = parts.slice(1).join("").replace("-","");
                  setRequest({...request, phoneCode:country.dialCode, phone:newPhone});
                }}/>
            </div>
            {/* Location */}
            <div style={{ ...F.wrap, position:"relative" }}>
              <label style={F.label}>Location</label>
              <input name="location" type="text" value={request.location||""} onChange={handleLocationChange}
                disabled={!isEditing} className="rd-input" style={F.input} placeholder="Location"/>
              {address.length>0 && (
                <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1px solid rgba(0,0,0,0.12)", borderRadius:8, zIndex:99, maxHeight:180, overflowY:"auto", boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
                  {address.map((a,i)=>(
                    <div key={i} onClick={()=>handleLocationSubmission(a.formatted_address, a.geometry.location)}
                      style={{ padding:"10px 14px", fontSize:13, cursor:"pointer", borderBottom:"1px solid rgba(0,0,0,0.06)", color:"#374151" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#F7F4F1"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      {a.formatted_address}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Is Critical */}
            <div style={F.wrap}>
              <label style={F.label}>Is Critical</label>
              <select name="isCritical" value={request.isCritical} onChange={handleInputChange}
                disabled={!isEditing} className="rd-input" style={F.select}>
                <option value={true}>True</option>
                <option value={false}>False</option>
              </select>
            </div>
            {/* Note */}
            <div style={F.wrap}>
              <label style={F.label}>Note</label>
              <input name="note" type="text" value={request.note||""} onChange={handleInputChange}
                disabled={!isEditing} className="rd-input" style={F.input} placeholder="Note"/>
            </div>
            {/* Prescription */}
            {request.prescription?.url && (
              <div style={F.wrap}>
                <label style={F.label}>Prescription</label>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"#F7F4F1", borderRadius:8, border:"1px solid rgba(0,0,0,0.07)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <i className="ti ti-file-description" style={{ fontSize:20, color:"var(--red)" }}/>
                    <span style={{ fontSize:13, fontWeight:600, color:"#111" }}>Prescription</span>
                  </div>
                  <button onClick={()=>downloadProofs(request.prescription)}
                    style={{ background:"var(--green-bg)", border:"none", color:"var(--green)", borderRadius:6, padding:"6px 10px", cursor:"pointer", fontSize:13, fontWeight:600 }}>
                    <i className="ti ti-download"/> Download
                  </button>
                </div>
              </div>
            )}
          </Section>
        </div>
      )}

      {/* Pending Approvals */}
      {isApproving && (
        <div style={{ background:"#fff", borderRadius:12, boxShadow:"0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)", overflow:"hidden", marginTop:20 }}>
          <div style={{ background:"var(--red)", padding:"14px 20px" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff", fontFamily:"var(--f-display)" }}>Pending Approvals</div>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"var(--f-body)", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#F7F4F1" }}>
                  {["Donor","Proofs","Status"].map(h=>(
                    <th key={h} style={{ padding:"10px 16px", fontSize:10, fontWeight:700, color:"#9ca3af", textAlign:"left", letterSpacing:"0.8px", fontFamily:"var(--f-display)", textTransform:"uppercase", borderBottom:"1px solid rgba(0,0,0,0.07)", background:"#F7F4F1" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(request.donations?.filter(d=>["pendingApproval","Approved","Denied"].includes(d.status))||[]).length===0 ? (
                  <tr><td colSpan={3} style={{ padding:"40px", textAlign:"center", color:"#9ca3af" }}>No pending approvals</td></tr>
                ) : request.donations.filter(d=>["pendingApproval","Approved","Denied"].includes(d.status)).map(d=>(
                  <tr key={d._id}>
                    <td style={{ padding:"12px 16px", borderTop:"1px solid rgba(0,0,0,0.07)", fontWeight:600, color:"#111" }}>{d.donor?.name}</td>
                    <td style={{ padding:"12px 16px", borderTop:"1px solid rgba(0,0,0,0.07)" }}>
                      {d.proof?.length===0 ? <span style={{ color:"#9ca3af" }}>No proofs</span>
                        : d.proof.map((p,i)=>(
                          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"#F7F4F1", borderRadius:8, marginBottom:6, border:"1px solid rgba(0,0,0,0.07)" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <i className="ti ti-file-description" style={{ fontSize:18, color:"var(--red)" }}/>
                              <div>
                                <div style={{ fontSize:12, fontWeight:700, color:"#111" }}>{p?.fid?.name}</div>
                                <div style={{ fontSize:11, color:"#6b7280" }}>By: {p.by}</div>
                              </div>
                            </div>
                            <button onClick={()=>downloadProofs(p.fid)}
                              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--green)", fontSize:18 }}>
                              <i className="ti ti-download"/>
                            </button>
                          </div>
                        ))}
                    </td>
                    <td style={{ padding:"12px 16px", borderTop:"1px solid rgba(0,0,0,0.07)" }}>
                      <select value={d.status} onChange={e=>handleDonationStatChange(e,d._id)}
                        style={{ ...F.select, width:"auto", minWidth:140 }}>
                        <option value="pendingApproval">Pending Approval</option>
                        <option value="Approved">Approved</option>
                        <option value="Denied">Denied</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Donation tables */}
      <DonTable title="Donations Done"     filter={d=>d.status==="Approved"}/>
      <DonTable title="Donations Accepted" filter={d=>d.status==="Accepted"}/>
      <DonTable title="Donations Rejected" filter={d=>d.status==="Rejected"}/>
    </div>
  );
};

export default RequestDetails;
