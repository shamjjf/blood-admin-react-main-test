import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import swal from "sweetalert";
import moment from "moment";
import SEO from "../SEO";
import Tabs from "../Components/Tabs";
import { GlobalContext } from "../GlobalContext";

const INSTITUTION_TYPES = [
  "University",
  "College",
  "Autonomous College",
  "Institute",
  "Polytechnic",
  "School",
  "Other",
];
const COORDINATOR_ROLES = ["NSS Coordinator", "NCC Officer", "Faculty Advisor", "Student Lead", "Volunteer"];
const DRIVE_TYPES = ["Blood Donation", "Awareness", "Health Check-up", "Orientation", "Other"];
const DRIVE_STATUS = ["planned", "active", "completed", "cancelled"];
const CAMPAIGN_TYPES = ["Awareness", "Recruitment", "Fundraising", "Seasonal", "Other"];
const CAMPAIGN_CHANNELS = ["Online", "Offline", "Mixed"];
const CAMPAIGN_STATUS = ["draft", "scheduled", "running", "paused", "completed", "cancelled"];

const authHeaders = () => ({
  Authorization: sessionStorage.getItem("auth"),
  "Content-Type": "application/json",
});
const authGet = () => ({ Authorization: sessionStorage.getItem("auth") });

const apiUrl = (path) => `${import.meta.env.VITE_API_URL}${path}`;

const Badge = ({ color, icon, children }) => (
  <span
    style={{
      padding: "4px 10px",
      borderRadius: 10,
      fontSize: 11,
      fontWeight: 700,
      color: "#fff",
      background: color,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    }}
  >
    {icon && <i className={`ti ${icon}`}></i>} {children}
  </span>
);

const verificationBadge = (c) => {
  if (c?.verified) return <Badge color="#16A34A" icon="ti-circle-check">Verified</Badge>;
  if (c?.verificationRejected) return <Badge color="#DC2626" icon="ti-circle-x">Rejected</Badge>;
  return <Badge color="#F59E0B" icon="ti-clock">Pending</Badge>;
};

const driveStatusColor = (s) =>
  s === "active" ? "#16A34A" :
  s === "completed" ? "#6B7280" :
  s === "cancelled" ? "#DC2626" :
  "#0EA5E9";

const campaignStatusColor = (s) =>
  s === "running" ? "#16A34A" :
  s === "completed" ? "#6B7280" :
  s === "cancelled" ? "#DC2626" :
  s === "paused" ? "#F59E0B" :
  s === "scheduled" ? "#0EA5E9" :
  "#94A3B8";

// ─── Reusable modal shell ──────────────────────────────────────────────────
const ModalShell = ({ title, onClose, children }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 1050,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        width: "100%",
        maxWidth: 720,
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          padding: "14px 20px",
          background: "#C0392B",
          color: "#fff",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h5 className="m-0">{title}</h5>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  </div>
);

// ─── Tab: Overview & Verification ──────────────────────────────────────────
const OverviewTab = ({ college, refresh }) => {
  const { setLoading } = useContext(GlobalContext);
  const [form, setForm] = useState({
    name: college.name || "",
    institutionType: college.institutionType || "College",
    affiliatedUniversity: college.affiliatedUniversity || "",
    description: college.description || "",
    contactName: college.contactName || "",
    contactEmail: college.contactEmail || "",
    contactPhone: college.contactPhone || "",
    nssCoordinator: college.nssCoordinator || "",
    studentCount: college.studentCount ?? "",
    establishedYear: college.establishedYear ?? "",
    city: college.city || "",
    state: college.state || "",
    address: college.address || "",
    website: college.website || "",
    partnershipSince: college.partnershipSince
      ? new Date(college.partnershipSince).toISOString().slice(0, 10)
      : "",
    notes: college.notes || "",
    active: !!college.active,
  });
  const [verifyNotes, setVerifyNotes] = useState(college.verificationNotes || "");

  const saveBasic = async () => {
    if (!form.name.trim()) return swal("Error", "Name is required", "error");
    const payload = {
      ...form,
      studentCount: form.studentCount === "" ? null : Number(form.studentCount),
      establishedYear: form.establishedYear === "" ? null : Number(form.establishedYear),
      partnershipSince: form.partnershipSince || null,
    };
    try {
      setLoading(true);
      await axios.patch(apiUrl(`/colleges/${college._id}`), payload, { headers: authHeaders() });
      swal("Saved", "Institution details updated", "success");
      await refresh();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save", "error");
    } finally {
      setLoading(false);
    }
  };

  const setVerification = async (state) => {
    // state: "verified" | "rejected" | "pending"
    const payload = {
      verified: state === "verified",
      verificationRejected: state === "rejected",
      verifiedAt: state === "verified" ? new Date().toISOString() : null,
      verificationNotes: verifyNotes,
    };
    try {
      setLoading(true);
      await axios.patch(apiUrl(`/colleges/${college._id}`), payload, { headers: authHeaders() });
      await refresh();
      swal("Updated", `Verification set to ${state}`, "success");
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to update verification", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-3">
      <div className="col-lg-8">
        <div className="card">
          <div className="card-header bg-white">
            <h5 className="m-0">Basic Information</h5>
            <small className="text-muted">Affiliation, coordinator and campus details.</small>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Name *</label>
                <input className="form-control" maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Type *</label>
                <select className="form-control" value={form.institutionType} onChange={(e) => setForm({ ...form, institutionType: e.target.value })}>
                  {INSTITUTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="collegeActiveDetail"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="collegeActiveDetail">Active</label>
                </div>
              </div>
              <div className="col-md-8">
                <label className="form-label">Affiliated University / Board</label>
                <input className="form-control" value={form.affiliatedUniversity} onChange={(e) => setForm({ ...form, affiliatedUniversity: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Established Year</label>
                <input type="number" min={1800} max={2100} className="form-control" value={form.establishedYear} onChange={(e) => setForm({ ...form, establishedYear: e.target.value })} />
              </div>
              <div className="col-md-12">
                <label className="form-label">Description</label>
                <input className="form-control" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Coordinator Name</label>
                <input className="form-control" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Coordinator Email</label>
                <input className="form-control" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Coordinator Phone</label>
                <input className="form-control" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">NSS / NCC Coordinator</label>
                <input className="form-control" value={form.nssCoordinator} onChange={(e) => setForm({ ...form, nssCoordinator: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Student Strength</label>
                <input type="number" min={0} className="form-control" value={form.studentCount} onChange={(e) => setForm({ ...form, studentCount: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Website</label>
                <input className="form-control" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">City</label>
                <input className="form-control" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">State</label>
                <input className="form-control" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Partner Since</label>
                <input type="date" className="form-control" value={form.partnershipSince} onChange={(e) => setForm({ ...form, partnershipSince: e.target.value })} />
              </div>
              <div className="col-md-12">
                <label className="form-label">Address</label>
                <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="col-md-12">
                <label className="form-label">Notes</label>
                <input className="form-control" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button className="btn btn-primary" onClick={saveBasic}>
                <i className="ti ti-device-floppy me-1"></i> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="card">
          <div className="card-header bg-white d-flex align-items-center justify-content-between">
            <div>
              <h5 className="m-0">Verification</h5>
              <small className="text-muted">Approve, reject, or mark pending.</small>
            </div>
            {verificationBadge(college)}
          </div>
          <div className="card-body">
            {college.verified ? (
              // Verified is a TERMINAL state in the admin's day-to-day view.
              // Show a clean confirmation panel + a single "Revoke" escape
              // hatch (confirm-gated) so the admin can't accidentally flip
              // the state by clicking through stale buttons.
              <>
                <div
                  className="d-flex align-items-center gap-2 mb-3 px-3 py-3"
                  style={{
                    background: "#DCFCE7",
                    border: "1px solid #86EFAC",
                    borderRadius: 8,
                    color: "#166534",
                  }}
                >
                  <i className="ti ti-shield-check" style={{ fontSize: 24 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>Verified</div>
                    <div style={{ fontSize: 12 }}>
                      {college.verifiedAt &&
                        `On ${moment(college.verifiedAt).format(
                          "DD MMM YYYY"
                        )}`}
                      {college.verifiedBy && (
                        <>
                          {" by "}
                          <strong>
                            {college.verifiedBy?.name || college.verifiedBy}
                          </strong>
                        </>
                      )}
                      .
                    </div>
                  </div>
                </div>
                {verifyNotes && (
                  <div className="mb-3">
                    <label className="form-label small text-muted">
                      Verification Notes
                    </label>
                    <div
                      className="px-3 py-2"
                      style={{
                        background: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        borderRadius: 6,
                        fontSize: 13,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {verifyNotes}
                    </div>
                  </div>
                )}
                <button
                  className="btn btn-sm btn-outline-secondary w-100"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Revoke verification and move this college back to Pending?"
                      )
                    ) {
                      setVerification("pending");
                    }
                  }}
                  title="Move the college back to Pending so it can be re-reviewed"
                >
                  <i className="ti ti-arrow-back-up me-1"></i> Revoke verification
                </button>
              </>
            ) : (
              <>
                <div className="mb-3 small text-muted">
                  {college.verificationRejected
                    ? "Verification was rejected. Review the notes and re-evaluate when ready."
                    : "Awaiting verification. Review affiliation documents and decide."}
                </div>

                <label className="form-label">Verification Notes</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Affiliation proof, AISHE code, NSS unit confirmation…"
                />

                <div className="d-grid gap-2 mt-3">
                  <button
                    className="btn btn-success"
                    onClick={() => setVerification("verified")}
                  >
                    <i className="ti ti-shield-check me-1"></i> Mark Verified
                  </button>
                  {!college.verificationRejected && (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => setVerification("pending")}
                      disabled
                      title="Already pending"
                    >
                      <i className="ti ti-clock me-1"></i> Mark Pending
                    </button>
                  )}
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => setVerification("rejected")}
                  >
                    <i className="ti ti-circle-x me-1"></i> Reject
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Coordinators ─────────────────────────────────────────────────────
const emptyCoordinator = {
  _id: null,
  name: "",
  role: "NSS Coordinator",
  email: "",
  phone: "",
  department: "",
  notes: "",
};

const CoordinatorsTab = ({ college }) => {
  const { setLoading } = useContext(GlobalContext);
  const [coordinators, setCoordinators] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCoordinator);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl(`/colleges/${college._id}/coordinators`), {
        headers: authGet(),
      });
      setCoordinators(res?.data?.data?.coordinators || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [college._id]);

  const openCreate = () => { setForm(emptyCoordinator); setShowForm(true); };
  const openEdit = (c) => {
    setForm({
      _id: c._id,
      name: c.name || "",
      role: c.role || "NSS Coordinator",
      email: c.email || "",
      phone: c.phone || "",
      department: c.department || "",
      notes: c.notes || "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) return swal("Error", "Name is required", "error");
    const payload = {
      name: form.name.trim(),
      role: form.role,
      email: form.email.trim(),
      phone: form.phone.trim(),
      department: form.department.trim(),
      notes: form.notes.trim(),
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(apiUrl(`/colleges/${college._id}/coordinators/${form._id}`), payload, { headers: authHeaders() });
      } else {
        await axios.post(apiUrl(`/colleges/${college._id}/coordinators`), payload, { headers: authHeaders() });
      }
      setShowForm(false);
      setForm(emptyCoordinator);
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save coordinator", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (c) => {
    const ok = await swal({
      title: "Remove coordinator?",
      text: `${c.name} will be removed from ${college.name}.`,
      icon: "warning",
      buttons: ["Cancel", "Remove"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(apiUrl(`/colleges/${college._id}/coordinators/${c._id}`), { headers: authGet() });
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to remove", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <div>
          <h5 className="m-0">Coordinators</h5>
          <small className="text-muted">NSS / NCC officers, faculty advisors and student leads at this institution.</small>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="ti ti-user-plus me-1"></i> Add Coordinator
        </button>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover-removed my-table">
            <thead id="request-heading">
              <tr>
                <th className="align-left">Name</th>
                <th className="align-left">Role</th>
                <th className="align-left">Department</th>
                <th className="align-left">Email</th>
                <th className="align-left">Phone</th>
                <th className="align-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coordinators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="align-center">
                    <p className="m-5 p-5 fs-4">No coordinators yet — add one above.</p>
                  </td>
                </tr>
              ) : (
                coordinators.map((c) => (
                  <tr key={c._id}>
                    <td className="align-left fw-bold">{c.name}</td>
                    <td className="align-left">{c.role}</td>
                    <td className="align-left">{c.department || "—"}</td>
                    <td className="align-left">{c.email || "—"}</td>
                    <td className="align-left">{c.phone || "—"}</td>
                    <td className="align-center">
                      <button className="btn btn-sm btn-outline-info me-1" onClick={() => openEdit(c)} title="Edit">
                        <i className="ti ti-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(c)} title="Remove">
                        <i className="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ModalShell title={form._id ? "Edit Coordinator" : "Add Coordinator"} onClose={() => setShowForm(false)}>
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label">Name *</label>
              <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {COORDINATOR_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Department</label>
              <input className="form-control" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 …" />
            </div>
            <div className="col-md-12">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>{form._id ? "Update" : "Add Coordinator"}</button>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

// ─── Tab: Blood Drives ─────────────────────────────────────────────────────
const emptyDrive = {
  _id: null,
  title: "",
  type: "Blood Donation",
  description: "",
  startDate: "",
  endDate: "",
  target: "",
  collected: "",
  status: "planned",
};

const DrivesTab = ({ college }) => {
  const { setLoading } = useContext(GlobalContext);
  const [drives, setDrives] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyDrive);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl(`/colleges/${college._id}/drives`), {
        headers: authGet(),
      });
      setDrives(res?.data?.data?.drives || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [college._id]);

  const openCreate = () => { setForm(emptyDrive); setShowForm(true); };
  const openEdit = (d) => {
    setForm({
      _id: d._id,
      title: d.title || "",
      type: d.type || "Blood Donation",
      description: d.description || "",
      startDate: d.startDate ? new Date(d.startDate).toISOString().slice(0, 10) : "",
      endDate: d.endDate ? new Date(d.endDate).toISOString().slice(0, 10) : "",
      target: d.target ?? "",
      collected: d.collected ?? "",
      status: d.status || "planned",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) return swal("Error", "Title is required", "error");
    const payload = {
      title: form.title.trim(),
      type: form.type,
      description: form.description.trim(),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      target: form.target === "" ? null : Number(form.target),
      collected: form.collected === "" ? null : Number(form.collected),
      status: form.status,
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(apiUrl(`/colleges/${college._id}/drives/${form._id}`), payload, { headers: authHeaders() });
      } else {
        await axios.post(apiUrl(`/colleges/${college._id}/drives`), payload, { headers: authHeaders() });
      }
      setShowForm(false);
      setForm(emptyDrive);
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save drive", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (d) => {
    const ok = await swal({
      title: "Delete drive?",
      text: `${d.title} will be removed.`,
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(apiUrl(`/colleges/${college._id}/drives/${d._id}`), { headers: authGet() });
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <div>
          <h5 className="m-0">Blood Drives</h5>
          <small className="text-muted">Campus blood donation drives, awareness sessions and health camps.</small>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="ti ti-plus me-1"></i> Add Drive
        </button>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover-removed my-table">
            <thead id="request-heading">
              <tr>
                <th className="align-left">Title</th>
                <th className="align-left">Type</th>
                <th className="align-left">Dates</th>
                <th className="align-center">Target</th>
                <th className="align-center">Collected</th>
                <th className="align-left">Status</th>
                <th className="align-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drives.length === 0 ? (
                <tr>
                  <td colSpan={7} className="align-center">
                    <p className="m-5 p-5 fs-4">No drives yet — click ‘Add Drive’ to begin.</p>
                  </td>
                </tr>
              ) : (
                drives.map((d) => (
                  <tr key={d._id}>
                    <td className="align-left">
                      <div className="fw-bold">{d.title}</div>
                      {d.description && <div className="text-muted small" style={{ maxWidth: 320 }}>{d.description}</div>}
                    </td>
                    <td className="align-left">{d.type}</td>
                    <td className="align-left small">
                      {d.startDate ? moment(d.startDate).format("DD MMM YYYY") : "—"}
                      {d.endDate && <> → {moment(d.endDate).format("DD MMM YYYY")}</>}
                    </td>
                    <td className="align-center">{d.target ?? "—"}</td>
                    <td className="align-center">{d.collected ?? "—"}</td>
                    <td className="align-left">
                      <Badge color={driveStatusColor(d.status)}>{d.status || "planned"}</Badge>
                    </td>
                    <td className="align-center">
                      <button className="btn btn-sm btn-outline-info me-1" onClick={() => openEdit(d)} title="Edit">
                        <i className="ti ti-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(d)} title="Delete">
                        <i className="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ModalShell title={form._id ? "Edit Drive" : "Add Drive"} onClose={() => setShowForm(false)}>
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label">Title *</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Type</label>
              <select className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {DRIVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-12">
              <label className="form-label">Description</label>
              <input className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label">End Date</label>
              <input type="date" className="form-control" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Target (units)</label>
              <input type="number" min={0} className="form-control" placeholder="e.g. 200" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Collected (units)</label>
              <input type="number" min={0} className="form-control" value={form.collected} onChange={(e) => setForm({ ...form, collected: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Status</label>
              <select className="form-control text-capitalize" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {DRIVE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>{form._id ? "Update" : "Add Drive"}</button>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

// ─── Tab: Campaigns ────────────────────────────────────────────────────────
const emptyCampaign = {
  _id: null,
  title: "",
  type: "Awareness",
  channel: "Offline",
  description: "",
  startDate: "",
  endDate: "",
  audienceTarget: "",
  status: "draft",
  resultsNotes: "",
};

const CampaignsTab = ({ college }) => {
  const { setLoading } = useContext(GlobalContext);
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCampaign);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl(`/colleges/${college._id}/campaigns`), {
        headers: authGet(),
      });
      setCampaigns(res?.data?.data?.campaigns || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [college._id]);

  const openCreate = () => { setForm(emptyCampaign); setShowForm(true); };
  const openEdit = (c) => {
    setForm({
      _id: c._id,
      title: c.title || "",
      type: c.type || "Awareness",
      channel: c.channel || "Offline",
      description: c.description || "",
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : "",
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : "",
      audienceTarget: c.audienceTarget ?? "",
      status: c.status || "draft",
      resultsNotes: c.resultsNotes || "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) return swal("Error", "Title is required", "error");
    const payload = {
      title: form.title.trim(),
      type: form.type,
      channel: form.channel,
      description: form.description.trim(),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      audienceTarget: form.audienceTarget === "" ? null : Number(form.audienceTarget),
      status: form.status,
      resultsNotes: form.resultsNotes.trim(),
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(apiUrl(`/colleges/${college._id}/campaigns/${form._id}`), payload, { headers: authHeaders() });
      } else {
        await axios.post(apiUrl(`/colleges/${college._id}/campaigns`), payload, { headers: authHeaders() });
      }
      setShowForm(false);
      setForm(emptyCampaign);
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save campaign", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (c) => {
    const ok = await swal({
      title: "Delete campaign?",
      text: `${c.title} will be removed.`,
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(apiUrl(`/colleges/${college._id}/campaigns/${c._id}`), { headers: authGet() });
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (c, status) => {
    try {
      setLoading(true);
      await axios.patch(
        apiUrl(`/colleges/${college._id}/campaigns/${c._id}`),
        { status },
        { headers: authHeaders() }
      );
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to update status", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <div>
          <h5 className="m-0">Campaigns</h5>
          <small className="text-muted">Awareness, recruitment and seasonal campaigns run with this institution.</small>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="ti ti-megaphone me-1"></i> Add Campaign
        </button>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover-removed my-table">
            <thead id="request-heading">
              <tr>
                <th className="align-left">Campaign</th>
                <th className="align-left">Type</th>
                <th className="align-left">Channel</th>
                <th className="align-left">Period</th>
                <th className="align-center">Audience</th>
                <th className="align-left">Status</th>
                <th className="align-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="align-center">
                    <p className="m-5 p-5 fs-4">No campaigns yet — click ‘Add Campaign’ to begin.</p>
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c._id}>
                    <td className="align-left">
                      <div className="fw-bold">{c.title}</div>
                      {c.description && <div className="text-muted small" style={{ maxWidth: 320 }}>{c.description}</div>}
                    </td>
                    <td className="align-left">{c.type}</td>
                    <td className="align-left">{c.channel}</td>
                    <td className="align-left small">
                      {c.startDate ? moment(c.startDate).format("DD MMM YYYY") : "—"}
                      {c.endDate && <> → {moment(c.endDate).format("DD MMM YYYY")}</>}
                    </td>
                    <td className="align-center">{c.audienceTarget != null ? Number(c.audienceTarget).toLocaleString() : "—"}</td>
                    <td className="align-left">
                      <select
                        className="form-control"
                        style={{
                          maxWidth: 140,
                          color: "#fff",
                          background: campaignStatusColor(c.status),
                          fontWeight: 600,
                          fontSize: 12,
                          textTransform: "capitalize",
                          border: "none",
                        }}
                        value={c.status || "draft"}
                        onChange={(e) => setStatus(c, e.target.value)}
                      >
                        {CAMPAIGN_STATUS.map((s) => (
                          <option key={s} value={s} style={{ color: "#111", background: "#fff" }}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="align-center">
                      <button className="btn btn-sm btn-outline-info me-1" onClick={() => openEdit(c)} title="Edit">
                        <i className="ti ti-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(c)} title="Delete">
                        <i className="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ModalShell title={form._id ? "Edit Campaign" : "Add Campaign"} onClose={() => setShowForm(false)}>
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label">Title *</label>
              <input className="form-control" placeholder="e.g. Freshers' Donor Awareness" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Type</label>
              <select className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short pitch / goal of the campaign" />
            </div>
            <div className="col-md-4">
              <label className="form-label">Channel</label>
              <select className="form-control" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                {CAMPAIGN_CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label">End Date</label>
              <input type="date" className="form-control" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Audience Target</label>
              <input type="number" min={0} className="form-control" placeholder="e.g. 5000 students" value={form.audienceTarget} onChange={(e) => setForm({ ...form, audienceTarget: e.target.value })} />
            </div>
            <div className="col-md-8">
              <label className="form-label">Status</label>
              <select className="form-control text-capitalize" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {CAMPAIGN_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-md-12">
              <label className="form-label">Results / Impact Notes</label>
              <textarea className="form-control" rows={3} value={form.resultsNotes} onChange={(e) => setForm({ ...form, resultsNotes: e.target.value })} placeholder="Students registered, donors recruited, reach…" />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>{form._id ? "Update" : "Add Campaign"}</button>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

// ─── Verification Documents tab ────────────────────────────────────────────
// Renders each uploaded document with its file link + status badge and lets
// the admin approve / reject each one independently. Mirrors the per-document
// review pattern already in use on the NGO admin page.
const DOC_TYPE_LABELS = {
  registration_certificate: "College Registration Certificate",
  principal_letter: "Principal's Authorization Letter",
  affiliation_letter: "University Affiliation Letter",
  other: "Other Document",
};

const docStatusBadge = (status) => {
  if (status === "approved")
    return <Badge color="#16A34A" icon="ti-circle-check">Approved</Badge>;
  if (status === "rejected")
    return <Badge color="#DC2626" icon="ti-circle-x">Rejected</Badge>;
  return <Badge color="#F59E0B" icon="ti-clock">Pending</Badge>;
};

const DocumentsTab = ({ college, refresh }) => {
  const [busyId, setBusyId] = useState("");
  const [rejecting, setRejecting] = useState(null); // { docId, currentNote }
  const [note, setNote] = useState("");

  const docs = college.documents || [];

  const review = async (docId, status, reviewNote = "") => {
    try {
      setBusyId(docId);
      await axios.post(
        apiUrl(`/colleges/${college._id}/documents/${docId}/review`),
        { status, reviewNote },
        { headers: authHeaders() }
      );
      await refresh();
      swal("Done", `Document ${status}.`, "success");
    } catch (err) {
      console.error("review doc:", err);
      swal(
        "Error",
        err?.response?.data?.error || "Could not review document",
        "error"
      );
    } finally {
      setBusyId("");
    }
  };

  const openReject = (doc) => {
    setRejecting({ docId: doc._id });
    setNote(doc.reviewNote || "");
  };
  const submitReject = () => {
    if (!rejecting) return;
    review(rejecting.docId, "rejected", note);
    setRejecting(null);
    setNote("");
  };

  if (docs.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center text-muted py-5">
          <i className="ti ti-file-off" style={{ fontSize: 40, opacity: 0.4 }} />
          <div className="mt-2">
            This college hasn't uploaded any verification documents yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex flex-column gap-3">
        {docs.map((d) => {
          const file = d.fileId || {};
          const label = DOC_TYPE_LABELS[d.type] || d.type || "Document";
          const isBusy = busyId === String(d._id);
          return (
            <div className="card" key={d._id}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <h5 className="m-0">{label}</h5>
                      {docStatusBadge(d.status)}
                    </div>
                    <div className="text-muted small">
                      <i className="ti ti-paperclip me-1"></i>
                      {d.name || file.name || "(unnamed)"}
                      {file.size && (
                        <span className="ms-2">
                          · {Math.round(file.size / 1024)} KB
                        </span>
                      )}
                      {d.submittedAt && (
                        <span className="ms-2">
                          · Submitted{" "}
                          {moment(d.submittedAt).format("DD MMM YYYY, HH:mm")}
                        </span>
                      )}
                    </div>
                    {d.status === "rejected" && d.reviewNote && (
                      <div
                        className="small mt-2 px-3 py-2"
                        style={{
                          background: "#FEF2F2",
                          color: "#991B1B",
                          borderRadius: 6,
                          borderLeft: "3px solid #DC2626",
                        }}
                      >
                        <strong>Reason:</strong> {d.reviewNote}
                      </div>
                    )}
                    {d.reviewedAt && d.status !== "pending" && (
                      <div className="text-muted small mt-1">
                        Reviewed by{" "}
                        {d.reviewedBy?.name || d.reviewedBy?.email || "Admin"} ·{" "}
                        {moment(d.reviewedAt).format("DD MMM YYYY, HH:mm")}
                      </div>
                    )}
                  </div>
                  <div className="d-flex flex-column gap-2" style={{ minWidth: 220 }}>
                    {file.url ? (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-secondary btn-sm"
                      >
                        <i className="ti ti-external-link me-1"></i> View File
                      </a>
                    ) : (
                      <button className="btn btn-outline-secondary btn-sm" disabled>
                        <i className="ti ti-file-off me-1"></i> No file
                      </button>
                    )}
                    {d.status !== "approved" && (
                      <button
                        className="btn btn-success btn-sm"
                        disabled={isBusy}
                        onClick={() => review(d._id, "approved")}
                      >
                        <i className="ti ti-check me-1"></i>
                        {isBusy ? "Working…" : "Approve"}
                      </button>
                    )}
                    {d.status !== "rejected" && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        disabled={isBusy}
                        onClick={() => openReject(d)}
                      >
                        <i className="ti ti-x me-1"></i>
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {rejecting && (
        <ModalShell title="Reject document" onClose={() => setRejecting(null)}>
          <div className="p-3">
            <label className="form-label">
              Reason for rejection
              <span className="text-muted small ms-1">
                (visible to the college)
              </span>
            </label>
            <textarea
              className="form-control"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Document is illegible — please re-upload a clearer scan."
            />
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setRejecting(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={submitReject}
                disabled={!note.trim()}
              >
                <i className="ti ti-x me-1"></i> Reject Document
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────
const CollegeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setLoading } = useContext(GlobalContext);
  const [college, setCollege] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl(`/colleges/${id}`), { headers: authGet() });
      setCollege(res?.data?.data?.college || res?.data?.data?.item || res?.data?.data || null);
    } catch (err) {
      console.error(err);
      swal("Error", "Could not load institution", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const tabs = useMemo(() => {
    if (!college) return null;
    const docsCount = (college.documents || []).length;
    const pendingCount = (college.documents || []).filter(
      (d) => d.status === "pending"
    ).length;
    return {
      overview: {
        label: (<><i className="ti ti-shield-check me-1"></i>Overview &amp; Verification</>),
        onClick: () => {},
        render: <OverviewTab college={college} refresh={load} />,
      },
      documents: {
        label: (
          <>
            <i className="ti ti-file-certificate me-1"></i>Documents
            {docsCount > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  padding: "1px 7px",
                  borderRadius: 999,
                  background: pendingCount > 0 ? "#F59E0B" : "#22C55E",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {pendingCount > 0 ? `${pendingCount} pending` : docsCount}
              </span>
            )}
          </>
        ),
        onClick: () => {},
        render: <DocumentsTab college={college} refresh={load} />,
      },
      coordinators: {
        label: (<><i className="ti ti-users me-1"></i>Coordinators</>),
        onClick: () => {},
        render: <CoordinatorsTab college={college} />,
      },
      drives: {
        label: (<><i className="ti ti-droplet me-1"></i>Blood Drives</>),
        onClick: () => {},
        render: <DrivesTab college={college} />,
      },
      campaigns: {
        label: (<><i className="ti ti-megaphone me-1"></i>Campaigns</>),
        onClick: () => {},
        render: <CampaignsTab college={college} />,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [college]);

  if (!college) {
    return (
      <>
        <SEO title="Institution" />
        <div className="content-wrapper pt-4">
          <Link to="/colleges" className="btn btn-outline-secondary mb-3">
            <i className="ti ti-arrow-left me-1"></i> Back
          </Link>
          <div className="card"><div className="card-body">Loading institution…</div></div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title={`Institution · ${college.name}`} />
      <div className="content-wrapper pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate("/colleges")}>
            <i className="ti ti-arrow-left me-1"></i> Back to Colleges &amp; Universities
          </button>
        </div>

        <div className="card mb-4">
          <div className="card-body d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h3 className="m-0">{college.name}</h3>
                <Badge color="#0EA5E9">{college.institutionType}</Badge>
                {verificationBadge(college)}
                <Badge color={college.active ? "#22C55E" : "#6B7280"}>
                  {college.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {college.affiliatedUniversity && (
                <div className="text-muted">
                  <i className="ti ti-building-arch me-1"></i>Affiliated to {college.affiliatedUniversity}
                </div>
              )}
              {college.description && <div className="text-muted">{college.description}</div>}
              <div className="d-flex gap-3 flex-wrap mt-2 small text-muted">
                {[college.city, college.state].filter(Boolean).length > 0 && (
                  <span><i className="ti ti-map-pin me-1"></i>{[college.city, college.state].filter(Boolean).join(", ")}</span>
                )}
                {college.contactEmail && <span><i className="ti ti-mail me-1"></i>{college.contactEmail}</span>}
                {college.contactPhone && <span><i className="ti ti-phone me-1"></i>{college.contactPhone}</span>}
                {college.website && (
                  <a href={college.website} target="_blank" rel="noreferrer">
                    <i className="ti ti-world me-1"></i>{college.website}
                  </a>
                )}
                {college.studentCount != null && (
                  <span><i className="ti ti-users-group me-1"></i>{Number(college.studentCount).toLocaleString()} students</span>
                )}
                {college.partnershipSince && (
                  <span>
                    <i className="ti ti-calendar me-1"></i>
                    Partner since {moment(college.partnershipSince).format("MMM YYYY")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {tabs && <Tabs tabs={tabs} />}
      </div>
    </>
  );
};

export default CollegeDetails;
