import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import swal from "sweetalert";
import moment from "moment";
import SEO from "../SEO";
import Tabs from "../Components/Tabs";
import { GlobalContext } from "../GlobalContext";
import { DEMO_MODE, demoSearchUsers } from "./organizationsDemo";

const ORG_TYPES = ["NGO", "Company", "University", "School", "Hospital", "Government", "Other"];
const MEMBER_ROLES = ["Lead", "Coordinator", "Member", "Volunteer"];
const DRIVE_TYPES = ["Blood Donation", "CSR", "Awareness", "Fundraising", "Training", "Other"];
const DRIVE_STATUS = ["planned", "active", "completed", "cancelled"];
const COLLAB_STATUS = ["proposed", "active", "paused", "ended"];
const CAMPAIGN_TYPES = ["Awareness", "Recruitment", "Fundraising", "Blood Drive", "Seasonal", "Other"];
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

const verificationBadge = (o) => {
  if (o?.verified) return <Badge color="#16A34A" icon="ti-circle-check">Verified</Badge>;
  if (o?.verificationRejected) return <Badge color="#DC2626" icon="ti-circle-x">Rejected</Badge>;
  return <Badge color="#F59E0B" icon="ti-clock">Pending</Badge>;
};

const driveStatusColor = (s) =>
  s === "active" ? "#16A34A" :
  s === "completed" ? "#6B7280" :
  s === "cancelled" ? "#DC2626" :
  "#0EA5E9";

const collabStatusColor = (s) =>
  s === "active" ? "#16A34A" :
  s === "ended" ? "#6B7280" :
  s === "paused" ? "#F59E0B" :
  "#0EA5E9";

const campaignStatusColor = (s) =>
  s === "running" ? "#16A34A" :
  s === "completed" ? "#6B7280" :
  s === "cancelled" ? "#DC2626" :
  s === "paused" ? "#F59E0B" :
  s === "scheduled" ? "#0EA5E9" :
  "#94A3B8";

// ─── Tab: Overview & Verification ──────────────────────────────────────────
const OverviewTab = ({ org, refresh }) => {
  const { setLoading } = useContext(GlobalContext);
  const [form, setForm] = useState({
    name: org.name || "",
    type: org.type || "NGO",
    description: org.description || "",
    contactName: org.contactName || "",
    contactEmail: org.contactEmail || "",
    contactPhone: org.contactPhone || "",
    address: org.address || "",
    website: org.website || "",
    partnershipSince: org.partnershipSince
      ? new Date(org.partnershipSince).toISOString().slice(0, 10)
      : "",
    partnershipNotes: org.partnershipNotes || "",
    active: !!org.active,
  });
  const [verifyNotes, setVerifyNotes] = useState(org.verificationNotes || "");

  const saveBasic = async () => {
    if (!form.name.trim()) return swal("Error", "Name is required", "error");
    try {
      setLoading(true);
      await axios.patch(apiUrl(`/organizations/${org._id}`), form, { headers: authHeaders() });
      swal("Saved", "Organization details updated", "success");
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
      await axios.patch(apiUrl(`/organizations/${org._id}`), payload, { headers: authHeaders() });
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
            <small className="text-muted">Contact, address and partnership details.</small>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Name *</label>
                <input className="form-control" maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Type *</label>
                <select className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="orgActiveDetail"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="orgActiveDetail">Active</label>
                </div>
              </div>
              <div className="col-md-12">
                <label className="form-label">Description</label>
                <input className="form-control" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Contact Name</label>
                <input className="form-control" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Contact Email</label>
                <input className="form-control" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Contact Phone</label>
                <input className="form-control" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              </div>
              <div className="col-md-8">
                <label className="form-label">Address</label>
                <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Website</label>
                <input className="form-control" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Partnership Since</label>
                <input type="date" className="form-control" value={form.partnershipSince} onChange={(e) => setForm({ ...form, partnershipSince: e.target.value })} />
              </div>
              <div className="col-md-8">
                <label className="form-label">Partnership Notes</label>
                <input className="form-control" value={form.partnershipNotes} onChange={(e) => setForm({ ...form, partnershipNotes: e.target.value })} />
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
            {verificationBadge(org)}
          </div>
          <div className="card-body">
            <div className="mb-3 small text-muted">
              {org.verified ? (
                <>
                  Verified{org.verifiedAt && ` on ${moment(org.verifiedAt).format("DD MMM YYYY")}`}
                  {org.verifiedBy && <> by <strong>{org.verifiedBy?.name || org.verifiedBy}</strong></>}.
                </>
              ) : org.verificationRejected ? (
                "Verification was rejected. Review the notes and re-evaluate when ready."
              ) : (
                "Awaiting verification. Review documents and decide."
              )}
            </div>

            <label className="form-label">Verification Notes</label>
            <textarea
              className="form-control"
              rows={4}
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              placeholder="Documents reviewed, reasons for approval/rejection…"
            />

            <div className="d-grid gap-2 mt-3">
              <button className="btn btn-success" onClick={() => setVerification("verified")}>
                <i className="ti ti-shield-check me-1"></i> Mark Verified
              </button>
              <button className="btn btn-outline-warning" onClick={() => setVerification("pending")}>
                <i className="ti ti-clock me-1"></i> Mark Pending
              </button>
              <button className="btn btn-outline-danger" onClick={() => setVerification("rejected")}>
                <i className="ti ti-circle-x me-1"></i> Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Members ──────────────────────────────────────────────────────────
const MembersTab = ({ org, refresh }) => {
  const { setLoading } = useContext(GlobalContext);
  const [members, setMembers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [memberRole, setMemberRole] = useState("Member");
  const [detailMember, setDetailMember] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl(`/organizations/${org._id}/members`), {
        headers: authGet(),
      });
      setMembers(res?.data?.data?.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [org._id]);

  const searchUsers = async () => {
    if (!search.trim()) return;
    try {
      if (DEMO_MODE) {
        const users = await demoSearchUsers(search);
        setSearchResults(users);
        return;
      }
      const res = await axios.get(apiUrl(`/users?searchText=${encodeURIComponent(search)}&n=10&p=1`), {
        headers: authGet(),
      });
      setSearchResults(res?.data?.users || []);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    }
  };

  const addMember = async () => {
    if (!selectedUser) return swal("Error", "Pick a user first", "error");
    try {
      setLoading(true);
      await axios.post(
        apiUrl(`/organizations/${org._id}/members`),
        // In demo mode we also pass the full user object so the seed store
        // can render the name/email without a separate lookup.
        DEMO_MODE
          ? { userId: selectedUser._id, role: memberRole, user: selectedUser }
          : { userId: selectedUser._id, role: memberRole },
        { headers: authHeaders() }
      );
      swal("Added", "Member added to organization", "success");
      setShowAdd(false);
      setSelectedUser(null);
      setSearch("");
      setSearchResults([]);
      setMemberRole("Member");
      await load();
      await refresh();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to add member", "error");
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (m) => {
    const ok = await swal({
      title: "Remove member?",
      text: `${m.user?.name || "User"} will be removed from ${org.name}.`,
      icon: "warning",
      buttons: ["Cancel", "Remove"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(apiUrl(`/organizations/${org._id}/members/${m._id}`), {
        headers: authGet(),
      });
      await load();
      await refresh();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to remove", "error");
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (m, role) => {
    try {
      setLoading(true);
      await axios.patch(
        apiUrl(`/organizations/${org._id}/members/${m._id}`),
        { role },
        { headers: authHeaders() }
      );
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to update role", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <div>
          <h5 className="m-0">Members</h5>
          <small className="text-muted">People representing this organization.</small>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <i className="ti ti-user-plus me-1"></i> Add Member
        </button>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover-removed my-table">
            <thead id="request-heading">
              <tr>
                <th className="align-left">Name</th>
                <th className="align-left">Email</th>
                <th className="align-left">Role</th>
                <th className="align-left">Joined</th>
                <th className="align-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="align-center">
                    <p className="m-5 p-5 fs-4">No members yet — add one above.</p>
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m._id}>
                    <td className="align-left fw-bold">
                      <button
                        type="button"
                        onClick={() => setDetailMember(m)}
                        className="btn btn-link p-0 fw-bold text-decoration-none"
                        style={{ color: "#0EA5E9", verticalAlign: "baseline" }}
                        title="View member details"
                      >
                        {m.user?.name || m.name || "—"}
                      </button>
                    </td>
                    <td className="align-left">{m.user?.email || m.email || "—"}</td>
                    <td className="align-left">
                      <select
                        className="form-control"
                        style={{ maxWidth: 160 }}
                        value={m.role || "Member"}
                        onChange={(e) => changeRole(m, e.target.value)}
                      >
                        {MEMBER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="align-left">{m.joinedAt ? moment(m.joinedAt).format("DD-MM-YYYY") : "—"}</td>
                    <td className="align-center">
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => setDetailMember(m)}
                        title="View details"
                      >
                        <i className="ti ti-eye"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeMember(m)}
                        title="Remove"
                      >
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

      {showAdd && (
        <ModalShell title="Add Member" onClose={() => setShowAdd(false)}>
          <label className="form-label">Search User</label>
          <div className="d-flex gap-2 mb-2">
            <input
              className="form-control"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") searchUsers(); }}
            />
            <button className="btn btn-outline-primary" onClick={searchUsers}>Search</button>
          </div>
          {searchResults.length > 0 && (
            <div
              className="border rounded mb-3"
              style={{ maxHeight: 200, overflowY: "auto" }}
            >
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  onClick={() => setSelectedUser(u)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    background: selectedUser?._id === u._id ? "#E0F2FE" : "transparent",
                    borderBottom: "1px solid #F1F5F9",
                  }}
                >
                  <div className="fw-bold">{u.name}</div>
                  <div className="text-muted small">{u.email}</div>
                </div>
              ))}
            </div>
          )}
          {selectedUser && (
            <div className="alert alert-info py-2 mb-3">
              Selected: <strong>{selectedUser.name}</strong> ({selectedUser.email})
            </div>
          )}
          <label className="form-label">Role</label>
          <select
            className="form-control mb-3"
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value)}
          >
            {MEMBER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-outline-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addMember}>Add Member</button>
          </div>
        </ModalShell>
      )}

      {detailMember && (
        <MemberDetailModal
          member={detailMember}
          org={org}
          onClose={() => setDetailMember(null)}
          onChanged={async () => {
            await load();
            await refresh();
          }}
          onRemoved={async () => {
            setDetailMember(null);
            await load();
            await refresh();
          }}
        />
      )}
    </div>
  );
};

// ─── Member detail modal ───────────────────────────────────────────────────
const MemberDetailModal = ({ member, org, onClose, onChanged, onRemoved }) => {
  const { setLoading } = useContext(GlobalContext);
  const [role, setRole] = useState(member.role || "Member");
  const [phone, setPhone] = useState(member.phone || "");
  const [notes, setNotes] = useState(member.notes || "");
  const [dirty, setDirty] = useState(false);

  const onField = (setter) => (e) => { setter(e.target.value); setDirty(true); };

  const initials = (member.user?.name || "?")
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  const save = async () => {
    try {
      setLoading(true);
      await axios.patch(
        apiUrl(`/organizations/${org._id}/members/${member._id}`),
        { role, phone, notes },
        { headers: authHeaders() }
      );
      swal("Saved", "Member details updated", "success");
      setDirty(false);
      await onChanged();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    const ok = await swal({
      title: "Remove member?",
      text: `${member.user?.name || "User"} will be removed from ${org.name}.`,
      icon: "warning",
      buttons: ["Cancel", "Remove"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(apiUrl(`/organizations/${org._id}/members/${member._id}`), {
        headers: authGet(),
      });
      await onRemoved();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to remove", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 12, width: "100%", maxWidth: 720,
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px", background: "#C0392B", color: "#fff",
            borderTopLeftRadius: 12, borderTopRightRadius: 12,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <h5 className="m-0">
            <i className="ti ti-user me-2"></i>Member Details
          </h5>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div className="d-flex align-items-center gap-3 mb-4 pb-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#FEE2E2", color: "#B91C1C",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 700, flexShrink: 0,
              }}
            >
              {initials || "?"}
            </div>
            <div className="flex-grow-1">
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {member.user?.name || "—"}
              </div>
              <div className="text-muted">
                <i className="ti ti-mail me-1"></i>{member.user?.email || "—"}
              </div>
              <div className="d-flex gap-3 flex-wrap mt-1 small text-muted">
                <span><i className="ti ti-shield-check me-1"></i>{role}</span>
                {member.joinedAt && (
                  <span>
                    <i className="ti ti-calendar me-1"></i>
                    Joined {moment(member.joinedAt).format("DD MMM YYYY")}
                  </span>
                )}
                {member.lastActiveAt && (
                  <span>
                    <i className="ti ti-clock me-1"></i>
                    Last active {moment(member.lastActiveAt).fromNow()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Role</label>
              <select className="form-control" value={role} onChange={onField(setRole)}>
                {MEMBER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Phone</label>
              <input className="form-control" value={phone} onChange={onField(setPhone)} placeholder="+91 …" />
            </div>
            <div className="col-md-12">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                rows={3}
                value={notes}
                onChange={onField(setNotes)}
                placeholder="Internal notes about this member's role, responsibilities, or context…"
              />
            </div>
          </div>

          <div className="mt-4">
            <h6 className="text-uppercase text-muted small mb-2" style={{ letterSpacing: 0.5 }}>
              <i className="ti ti-history me-1"></i>Recent Activity
            </h6>
            {(member.activity || []).length === 0 ? (
              <div className="text-muted small fst-italic">No recorded activity yet.</div>
            ) : (
              <ul className="list-unstyled mb-0">
                {member.activity.map((a, i) => (
                  <li key={i} className="d-flex gap-2 mb-2">
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#0EA5E9", marginTop: 7, flexShrink: 0,
                    }} />
                    <div>
                      <div>{a.text}</div>
                      <div className="text-muted small">
                        {a.when ? moment(a.when).format("DD MMM YYYY · HH:mm") : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="d-flex justify-content-between align-items-center gap-2 mt-4 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
            <div>
              {member.user?._id && !String(member.user._id).startsWith("demo_u_") && (
                <Link
                  to={`/user/${member.user._id}`}
                  className="btn btn-outline-primary"
                  onClick={onClose}
                >
                  <i className="ti ti-external-link me-1"></i>Open user profile
                </Link>
              )}
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-danger" onClick={remove}>
                <i className="ti ti-trash me-1"></i>Remove from org
              </button>
              <button className="btn btn-outline-secondary" onClick={onClose}>Close</button>
              <button className="btn btn-primary" onClick={save} disabled={!dirty}>
                <i className="ti ti-device-floppy me-1"></i>Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: CSR / Drives ─────────────────────────────────────────────────────
const emptyDrive = {
  _id: null,
  title: "",
  type: "CSR",
  description: "",
  startDate: "",
  endDate: "",
  target: "",
  status: "planned",
};

const DrivesTab = ({ org }) => {
  const { setLoading } = useContext(GlobalContext);
  const [drives, setDrives] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyDrive);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl(`/organizations/${org._id}/drives`), {
        headers: authGet(),
      });
      setDrives(res?.data?.data?.drives || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [org._id]);

  const openCreate = () => { setForm(emptyDrive); setShowForm(true); };
  const openEdit = (d) => {
    setForm({
      _id: d._id,
      title: d.title || "",
      type: d.type || "CSR",
      description: d.description || "",
      startDate: d.startDate ? new Date(d.startDate).toISOString().slice(0, 10) : "",
      endDate: d.endDate ? new Date(d.endDate).toISOString().slice(0, 10) : "",
      target: d.target ?? "",
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
      status: form.status,
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(apiUrl(`/organizations/${org._id}/drives/${form._id}`), payload, { headers: authHeaders() });
      } else {
        await axios.post(apiUrl(`/organizations/${org._id}/drives`), payload, { headers: authHeaders() });
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
      await axios.delete(apiUrl(`/organizations/${org._id}/drives/${d._id}`), { headers: authGet() });
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
          <h5 className="m-0">CSR &amp; Drives</h5>
          <small className="text-muted">Donation drives, CSR campaigns and awareness programs run by this organization.</small>
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
                <th className="align-left">Status</th>
                <th className="align-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drives.length === 0 ? (
                <tr>
                  <td colSpan={6} className="align-center">
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
            <div className="col-md-4">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label">End Date</label>
              <input type="date" className="form-control" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Target</label>
              <input
                type="number"
                min={0}
                className="form-control"
                placeholder="e.g. 500 donors"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
              />
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
  channel: "Online",
  description: "",
  startDate: "",
  endDate: "",
  budget: "",
  audienceTarget: "",
  status: "draft",
  resultsNotes: "",
};

const CampaignsTab = ({ org }) => {
  const { setLoading } = useContext(GlobalContext);
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCampaign);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl(`/organizations/${org._id}/campaigns`), {
        headers: authGet(),
      });
      setCampaigns(res?.data?.data?.campaigns || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [org._id]);

  const stats = useMemo(() => {
    const total = campaigns.length;
    const running = campaigns.filter((c) => c.status === "running").length;
    const scheduled = campaigns.filter((c) => c.status === "scheduled").length;
    const completed = campaigns.filter((c) => c.status === "completed").length;
    return { total, running, scheduled, completed };
  }, [campaigns]);

  const openCreate = () => { setForm(emptyCampaign); setShowForm(true); };
  const openEdit = (c) => {
    setForm({
      _id: c._id,
      title: c.title || "",
      type: c.type || "Awareness",
      channel: c.channel || "Online",
      description: c.description || "",
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : "",
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : "",
      budget: c.budget ?? "",
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
      budget: form.budget === "" ? null : Number(form.budget),
      audienceTarget: form.audienceTarget === "" ? null : Number(form.audienceTarget),
      status: form.status,
      resultsNotes: form.resultsNotes.trim(),
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(apiUrl(`/organizations/${org._id}/campaigns/${form._id}`), payload, { headers: authHeaders() });
      } else {
        await axios.post(apiUrl(`/organizations/${org._id}/campaigns`), payload, { headers: authHeaders() });
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
      await axios.delete(apiUrl(`/organizations/${org._id}/campaigns/${c._id}`), { headers: authGet() });
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
        apiUrl(`/organizations/${org._id}/campaigns/${c._id}`),
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
    <div>
      <div className="row g-3 mb-3">
        <div className="col-md-3 col-sm-6">
          <div className="card" style={{ borderLeft: "4px solid #0EA5E9", borderRadius: 10 }}>
            <div className="card-body" style={{ padding: 14 }}>
              <div className="text-muted small" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Total</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card" style={{ borderLeft: "4px solid #16A34A", borderRadius: 10 }}>
            <div className="card-body" style={{ padding: 14 }}>
              <div className="text-muted small" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Running</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.running}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card" style={{ borderLeft: "4px solid #F59E0B", borderRadius: 10 }}>
            <div className="card-body" style={{ padding: 14 }}>
              <div className="text-muted small" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Scheduled</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.scheduled}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card" style={{ borderLeft: "4px solid #6B7280", borderRadius: 10 }}>
            <div className="card-body" style={{ padding: 14 }}>
              <div className="text-muted small" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Completed</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.completed}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <div>
            <h5 className="m-0">Campaigns</h5>
            <small className="text-muted">
              Awareness, recruitment, fundraising and seasonal campaigns run by this organization.
            </small>
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
                  <th className="align-center">Budget</th>
                  <th className="align-center">Audience</th>
                  <th className="align-left">Status</th>
                  <th className="align-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="align-center">
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
                      <td className="align-center">{c.budget != null ? `₹${Number(c.budget).toLocaleString()}` : "—"}</td>
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
      </div>

      {showForm && (
        <ModalShell title={form._id ? "Edit Campaign" : "Add Campaign"} onClose={() => setShowForm(false)}>
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label">Title *</label>
              <input
                className="form-control"
                placeholder="e.g. #DonateBlood2026"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Type</label>
              <select className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short pitch / goal of the campaign"
              />
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
              <label className="form-label">Budget (₹)</label>
              <input
                type="number"
                min={0}
                className="form-control"
                placeholder="0"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Audience Target</label>
              <input
                type="number"
                min={0}
                className="form-control"
                placeholder="e.g. 10000 reach"
                value={form.audienceTarget}
                onChange={(e) => setForm({ ...form, audienceTarget: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Status</label>
              <select className="form-control text-capitalize" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {CAMPAIGN_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-md-12">
              <label className="form-label">Results / Impact Notes</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.resultsNotes}
                onChange={(e) => setForm({ ...form, resultsNotes: e.target.value })}
                placeholder="Donors recruited, reach, media coverage…"
              />
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

// ─── Tab: NGO Collaborations ───────────────────────────────────────────────
const emptyCollab = {
  _id: null,
  ngoId: "",
  scope: "",
  startDate: "",
  endDate: "",
  status: "proposed",
  notes: "",
};

const CollaborationsTab = ({ org }) => {
  const { setLoading } = useContext(GlobalContext);
  const [collabs, setCollabs] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCollab);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl(`/organizations/${org._id}/collaborations`), {
        headers: authGet(),
      });
      setCollabs(res?.data?.data?.collaborations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadNgos = async () => {
    try {
      const res = await axios.get(apiUrl(`/organizations?type=NGO&active=true`), {
        headers: authGet(),
      });
      setNgos((res?.data?.data?.items || []).filter((n) => n._id !== org._id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
    loadNgos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org._id]);

  const openCreate = () => { setForm(emptyCollab); setShowForm(true); };
  const openEdit = (c) => {
    setForm({
      _id: c._id,
      ngoId: c.ngo?._id || c.ngoId || "",
      scope: c.scope || "",
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : "",
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : "",
      status: c.status || "proposed",
      notes: c.notes || "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.ngoId) return swal("Error", "Pick a partner NGO", "error");
    const payload = {
      ngoId: form.ngoId,
      scope: form.scope.trim(),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      status: form.status,
      notes: form.notes.trim(),
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(apiUrl(`/organizations/${org._id}/collaborations/${form._id}`), payload, { headers: authHeaders() });
      } else {
        await axios.post(apiUrl(`/organizations/${org._id}/collaborations`), payload, { headers: authHeaders() });
      }
      setShowForm(false);
      setForm(emptyCollab);
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save collaboration", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (c) => {
    const ok = await swal({
      title: "End collaboration?",
      text: "This will remove the partnership record.",
      icon: "warning",
      buttons: ["Cancel", "Remove"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(apiUrl(`/organizations/${org._id}/collaborations/${c._id}`), { headers: authGet() });
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
          <h5 className="m-0">NGO Collaborations</h5>
          <small className="text-muted">
            {org.type === "NGO"
              ? "Other partners this NGO works with."
              : "NGO partners that this organization collaborates with."}
          </small>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="ti ti-heart-handshake me-1"></i> Add Collaboration
        </button>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover-removed my-table">
            <thead id="request-heading">
              <tr>
                <th className="align-left">Partner NGO</th>
                <th className="align-left">Scope</th>
                <th className="align-left">Period</th>
                <th className="align-left">Status</th>
                <th className="align-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collabs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="align-center">
                    <p className="m-5 p-5 fs-4">No collaborations yet.</p>
                  </td>
                </tr>
              ) : (
                collabs.map((c) => (
                  <tr key={c._id}>
                    <td className="align-left fw-bold">
                      {c.ngo?.name || ngos.find((n) => n._id === c.ngoId)?.name || "—"}
                    </td>
                    <td className="align-left">{c.scope || "—"}</td>
                    <td className="align-left small">
                      {c.startDate ? moment(c.startDate).format("DD MMM YYYY") : "—"}
                      {c.endDate && <> → {moment(c.endDate).format("DD MMM YYYY")}</>}
                    </td>
                    <td className="align-left">
                      <Badge color={collabStatusColor(c.status)}>{c.status || "proposed"}</Badge>
                    </td>
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
        <ModalShell title={form._id ? "Edit Collaboration" : "Add Collaboration"} onClose={() => setShowForm(false)}>
          <div className="row g-3">
            <div className="col-md-12">
              <label className="form-label">Partner NGO *</label>
              <select className="form-control" value={form.ngoId} onChange={(e) => setForm({ ...form, ngoId: e.target.value })}>
                <option value="">— Pick an NGO —</option>
                {ngos.map((n) => <option key={n._id} value={n._id}>{n.name}</option>)}
              </select>
              <small className="text-muted">Only active organizations of type NGO appear here.</small>
            </div>
            <div className="col-md-12">
              <label className="form-label">Scope</label>
              <input
                className="form-control"
                placeholder="Joint blood camps, donor outreach, training…"
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}
              />
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
              <label className="form-label">Status</label>
              <select className="form-control text-capitalize" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {COLLAB_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-md-12">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>{form._id ? "Update" : "Add Collaboration"}</button>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

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

// ─── Main page ─────────────────────────────────────────────────────────────
const OrganizationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setLoading } = useContext(GlobalContext);
  const [org, setOrg] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl(`/organizations/${id}`), { headers: authGet() });
      setOrg(res?.data?.data?.organization || res?.data?.data?.item || res?.data?.data || null);
    } catch (err) {
      console.error(err);
      swal("Error", "Could not load organization", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const tabs = useMemo(() => {
    if (!org) return null;
    return {
      overview: {
        label: (<><i className="ti ti-shield-check me-1"></i>Overview &amp; Verification</>),
        onClick: () => {},
        render: <OverviewTab org={org} refresh={load} />,
      },
      members: {
        label: (<><i className="ti ti-users me-1"></i>Members</>),
        onClick: () => {},
        render: <MembersTab org={org} refresh={load} />,
      },
      drives: {
        label: (<><i className="ti ti-heart me-1"></i>CSR &amp; Drives</>),
        onClick: () => {},
        render: <DrivesTab org={org} />,
      },
      campaigns: {
        label: (<><i className="ti ti-megaphone me-1"></i>Campaigns</>),
        onClick: () => {},
        render: <CampaignsTab org={org} />,
      },
      collaborations: {
        label: (<><i className="ti ti-heart-handshake me-1"></i>NGO Collaborations</>),
        onClick: () => {},
        render: <CollaborationsTab org={org} />,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  if (!org) {
    return (
      <>
        <SEO title="Organization" />
        <div className="content-wrapper pt-4">
          <Link to="/organizations" className="btn btn-outline-secondary mb-3">
            <i className="ti ti-arrow-left me-1"></i> Back
          </Link>
          <div className="card"><div className="card-body">Loading organization…</div></div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title={`Organization · ${org.name}`} />
      <div className="content-wrapper pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate("/organizations")}>
            <i className="ti ti-arrow-left me-1"></i> Back to Organizations
          </button>
        </div>

        <div className="card mb-4">
          <div className="card-body d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h3 className="m-0">{org.name}</h3>
                <Badge color="#0EA5E9">{org.type}</Badge>
                {verificationBadge(org)}
                <Badge color={org.active ? "#22C55E" : "#6B7280"}>
                  {org.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {org.description && <div className="text-muted">{org.description}</div>}
              <div className="d-flex gap-3 flex-wrap mt-2 small text-muted">
                {org.contactEmail && <span><i className="ti ti-mail me-1"></i>{org.contactEmail}</span>}
                {org.contactPhone && <span><i className="ti ti-phone me-1"></i>{org.contactPhone}</span>}
                {org.website && (
                  <a href={org.website} target="_blank" rel="noreferrer">
                    <i className="ti ti-world me-1"></i>{org.website}
                  </a>
                )}
                {org.partnershipSince && (
                  <span>
                    <i className="ti ti-calendar me-1"></i>
                    Partner since {moment(org.partnershipSince).format("MMM YYYY")}
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

export default OrganizationDetails;
