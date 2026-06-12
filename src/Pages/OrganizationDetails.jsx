import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import swal from "sweetalert";
import moment from "moment";
import SEO from "../SEO";
import Tabs from "../Components/Tabs";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidIntlPhoneRaw } from "../utils/phoneValidation";
import { GlobalContext } from "../GlobalContext";
import { DEMO_MODE, demoSearchUsers } from "./organizationsDemo";

const ORG_TYPES = ["NGO", "Company", "University", "School", "Hospital", "Government", "Other"];
const MEMBER_ROLES = ["Lead", "Coordinator", "Member", "Volunteer"];

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
  if (o?.verified) return <Badge color="#C0392B" icon="ti-circle-check">Verified</Badge>;
  if (o?.verificationRejected) return <Badge color="#DC2626" icon="ti-circle-x">Rejected</Badge>;
  return <Badge color="#D21C20" icon="ti-clock">Pending</Badge>;
};


// Small section divider used inside form cards to group related fields.
const FormSection = ({ icon, title, children, first }) => (
  <div style={{ marginTop: first ? 0 : 22 }}>
    <div
      style={{
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 12, fontWeight: 700, letterSpacing: 0.6,
        textTransform: "uppercase", color: "#C0392B",
        paddingBottom: 8, marginBottom: 14,
        borderBottom: "1px solid #F1F5F9",
      }}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 15 }}></i>
      {title}
    </div>
    <div className="row g-3">{children}</div>
  </div>
);

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
  });
  const [verifyNotes, setVerifyNotes] = useState(org.verificationNotes || "");

  const saveBasic = async () => {
    if (!form.name.trim()) return swal("Error", "Name is required", "error");
    if (form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      return swal("Error", "Please enter a valid contact email address", "error");
    }
    if (form.contactPhone && !isValidIntlPhoneRaw(form.contactPhone)) {
      return swal("Error", "Please enter a valid contact phone number for the selected country", "error");
    }
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
            <h5 className="m-0"><i className="ti ti-building-community me-2"></i>Basic Information</h5>
            <small className="text-muted">Contact, address and partnership details.</small>
          </div>
          <div className="card-body">
            <FormSection icon="ti-id-badge-2" title="Identity" first>
              <div className="col-md-8">
                <label className="form-label fw-semibold">Name *</label>
                <input className="form-control" maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Type *</label>
                <select className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-md-12">
                <label className="form-label fw-semibold">Description</label>
                <input className="form-control" maxLength={500} placeholder="Short description of the organisation…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </FormSection>

            <FormSection icon="ti-address-book" title="Contact">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Contact Name</label>
                <input className="form-control" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Contact Email</label>
                <input className="form-control" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Contact Phone</label>
                <PhoneInput
                  country={"in"}
                  preferredCountries={["in"]}
                  enableLongNumbers={true}
                  value={form.contactPhone}
                  onChange={(value) => setForm({ ...form, contactPhone: value })}
                  inputClass="form-control"
                  inputStyle={{ width: "100%" }}
                />
              </div>
              <div className="col-md-8">
                <label className="form-label fw-semibold">Address</label>
                <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Website</label>
                <input className="form-control" placeholder="https://…" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
            </FormSection>

            <FormSection icon="ti-heart-handshake" title="Partnership">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Partnership Since</label>
                <input type="date" className="form-control" value={form.partnershipSince} onChange={(e) => setForm({ ...form, partnershipSince: e.target.value })} />
              </div>
              <div className="col-md-8">
                <label className="form-label fw-semibold">Partnership Notes</label>
                <input className="form-control" value={form.partnershipNotes} onChange={(e) => setForm({ ...form, partnershipNotes: e.target.value })} />
              </div>
            </FormSection>

            <div className="d-flex justify-content-end mt-4 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
              <button className="btn btn-primary px-4" onClick={saveBasic}>
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
              <h5 className="m-0"><i className="ti ti-shield-check me-2"></i>Verification</h5>
              <small className="text-muted">Approve, reject, or mark pending.</small>
            </div>
            {verificationBadge(org)}
          </div>
          <div className="card-body">
            {(() => {
              const s = org.verified
                ? { c: "#C0392B", bg: "#FDE3E1", bd: "#F3C2BE", icon: "ti-shield-check",
                    t: "Verified", d: org.verifiedAt ? `on ${moment(org.verifiedAt).format("DD MMM YYYY")}` : "This organisation is verified." }
                : org.verificationRejected
                  ? { c: "#DC2626", bg: "#FEF2F2", bd: "#FECACA", icon: "ti-circle-x",
                      t: "Rejected", d: "Review the notes and re-evaluate when ready." }
                  : { c: "#D21C20", bg: "#FCE7E6", bd: "#F3C2BE", icon: "ti-clock",
                      t: "Pending", d: "Awaiting verification. Review documents and decide." };
              return (
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: s.bg, border: `1px solid ${s.bd}`,
                    borderRadius: 12, padding: "12px 14px", marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      background: s.c, color: "#fff", fontSize: 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <i className={`ti ${s.icon}`}></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: s.c, fontSize: 15 }}>{s.t}</div>
                    <div style={{ fontSize: 12.5, color: "#64748B" }}>{s.d}</div>
                  </div>
                </div>
              );
            })()}

            <label className="form-label fw-semibold">Verification Notes</label>
            <textarea
              className="form-control"
              rows={4}
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              placeholder="Documents reviewed, reasons for approval/rejection…"
            />

            <div className="d-grid gap-2 mt-3">
              <button
                className="btn btn-primary"
                disabled={org.verified}
                onClick={() => setVerification("verified")}
              >
                <i className="ti ti-shield-check me-1"></i>
                {org.verified ? "Verified" : "Mark Verified"}
              </button>
              <button
                className="btn btn-outline-danger"
                disabled={org.verificationRejected}
                onClick={() => setVerification("rejected")}
              >
                <i className="ti ti-circle-x me-1"></i> Reject
              </button>
            </div>
            <div className="text-muted mt-3" style={{ fontSize: 12 }}>
              <i className="ti ti-info-circle me-1"></i>
              Review uploaded files in the <strong>Documents</strong> tab before deciding.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Members ──────────────────────────────────────────────────────────
// Surfaces this org's employees from the org-employee approval system. Orgs
// submit employees via their own dashboard; admin moderates them here (or in
// the cross-org /org-employees page in the sidebar — same data, different
// view). Approve/Reject/Delete actions hit /api/admin/org-employees/:id/*.
const STATUS_TABS = [
  { key: "pending",  label: "Pending"  },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all",      label: "All"      },
];

const memberStatusBadge = (s) =>
  s === "approved"
    ? { label: "Approved", color: "#C0392B", icon: "ti-circle-check" }
    : s === "rejected"
      ? { label: "Rejected", color: "#DC2626", icon: "ti-circle-x" }
      : { label: "Pending", color: "#D21C20", icon: "ti-clock" };

const MembersTab = ({ org }) => {
  const { setLoading } = useContext(GlobalContext);
  const [members, setMembers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        apiUrl(`/org-employees?organization=${org._id}&status=${statusFilter}`),
        { headers: authGet() }
      );
      setMembers(res?.data?.data?.items || []);
    } catch (err) {
      console.error(err);
      swal("Error", err?.response?.data?.error || "Failed to load employees", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [org._id, statusFilter]);

  const approve = async (m) => {
    try {
      setLoading(true);
      await axios.post(
        apiUrl(`/org-employees/${m._id}/approve`),
        {},
        { headers: authHeaders() }
      );
      swal("Approved", `${m.name} is now visible in ${org.name}'s panel.`, "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to approve", "error");
    } finally {
      setLoading(false);
    }
  };

  const reject = async (m) => {
    const reason = await swal({
      title: `Reject ${m.name}?`,
      text: "Optional reason to share with the organisation:",
      content: { element: "input", attributes: { placeholder: "e.g. duplicate / wrong details" } },
      buttons: ["Cancel", "Reject"],
      dangerMode: true,
    });
    if (reason === null) return;
    try {
      setLoading(true);
      await axios.post(
        apiUrl(`/org-employees/${m._id}/reject`),
        { reason: typeof reason === "string" ? reason : "" },
        { headers: authHeaders() }
      );
      swal("Rejected", `${m.name} has been rejected.`, "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to reject", "error");
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (m) => {
    const ok = await swal({
      title: `Delete ${m.name}?`,
      text: "This permanently removes the employee record.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(apiUrl(`/org-employees/${m._id}`), { headers: authGet() });
      swal("Deleted", "Employee removed.", "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to remove", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="m-0"><i className="ti ti-users me-2"></i>Employees</h5>
          <small className="text-muted">
            Employees submitted by this organisation. Approve or reject to control what shows in their dashboard.
          </small>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`btn btn-sm ${statusFilter === t.key ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setStatusFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover-removed my-table">
            <thead id="request-heading">
              <tr>
                <th className="align-left">Name</th>
                <th className="align-left">Email</th>
                <th className="align-left">Department / Role</th>
                <th className="align-center">Group</th>
                <th className="align-center">Donor</th>
                <th className="align-center">Status</th>
                <th className="align-center">Submitted</th>
                <th className="align-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="align-center">
                    <p className="m-5 p-5 fs-4">
                      No employees in this view.
                    </p>
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const sb = memberStatusBadge(m.status);
                  return (
                    <tr key={m._id}>
                      <td className="align-left">
                        <div className="fw-bold" style={{ color: "#111827" }}>{m.name}</div>
                        {m.phone && <div className="text-muted small">{m.phone}</div>}
                      </td>
                      <td className="align-left">{m.email}</td>
                      <td className="align-left">
                        <div>{m.dept || "—"}</div>
                        <div className="text-muted small">{m.role || "—"}</div>
                      </td>
                      <td className="align-center">{m.blood || "—"}</td>
                      <td className="align-center">{m.donor ? "Yes" : "No"}</td>
                      <td className="align-center">
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                            background: sb.color,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <i className={`ti ${sb.icon}`}></i> {sb.label}
                        </span>
                        {m.status === "rejected" && m.rejectionNote && (
                          <div className="text-muted small mt-1" style={{ maxWidth: 180 }}>
                            {m.rejectionNote}
                          </div>
                        )}
                      </td>
                      <td className="align-center">
                        {m.createdAt ? moment(m.createdAt).format("DD-MM-YYYY") : "—"}
                      </td>
                      <td className="align-center">
                        {m.status !== "approved" && (
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => approve(m)}
                            title="Approve"
                          >
                            <i className="ti ti-check"></i>
                          </button>
                        )}
                        {m.status !== "rejected" && (
                          <button
                            className="btn btn-sm btn-outline-warning me-1"
                            onClick={() => reject(m)}
                            title="Reject"
                          >
                            <i className="ti ti-x"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeMember(m)}
                          title="Delete"
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
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
    if (phone && !isValidIntlPhoneRaw(phone)) {
      return swal("Error", "Please enter a valid phone number for the selected country", "error");
    }
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
              <PhoneInput
                country={"in"}
                preferredCountries={["in"]}
                enableLongNumbers={true}
                value={phone}
                onChange={(value) => { setPhone(value); setDirty(true); }}
                inputClass="form-control"
                inputStyle={{ width: "100%" }}
              />
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
                      background: "#C0392B", marginTop: 7, flexShrink: 0,
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

// ─── Tab: Drives ─────────────────────────────────────────────────────────────
// Real-backend Drives tab — surfaces blood donation drives submitted by the
// org via their dashboard. Approve/Reject/Delete actions hit the admin
// org-drive endpoints. Mirrors the MembersTab pattern.
const DRIVE_APPROVAL_TABS = [
  { key: "pending",  label: "Pending"  },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all",      label: "All"      },
];

const driveApprovalBadge = (s) =>
  s === "approved"
    ? { label: "Approved", color: "#C0392B", icon: "ti-circle-check" }
    : s === "rejected"
      ? { label: "Rejected", color: "#DC2626", icon: "ti-circle-x" }
      : { label: "Pending", color: "#D21C20", icon: "ti-clock" };

const driveLifecycleColor = (s) =>
  s === "scheduled" ? "#C0392B"
  : s === "completed" ? "#C0392B"
  : s === "cancelled" ? "#DC2626"
  : "#6B7280";

const DrivesTab = ({ org }) => {
  const { setLoading } = useContext(GlobalContext);
  const [drives, setDrives] = useState([]);
  const [approvalFilter, setApprovalFilter] = useState("pending");

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        apiUrl(`/org-drives?organization=${org._id}&approvalStatus=${approvalFilter}`),
        { headers: authGet() }
      );
      setDrives(res?.data?.data?.items || []);
    } catch (err) {
      console.error(err);
      swal("Error", err?.response?.data?.error || "Failed to load drives", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [org._id, approvalFilter]);

  const approve = async (d) => {
    try {
      setLoading(true);
      await axios.post(
        apiUrl(`/org-drives/${d._id}/approve`),
        {},
        { headers: authHeaders() }
      );
      swal("Approved", `${d.name} is now visible to ${org.name}'s employees.`, "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to approve", "error");
    } finally {
      setLoading(false);
    }
  };

  const reject = async (d) => {
    const reason = await swal({
      title: `Reject ${d.name}?`,
      text: "Optional reason to share with the organisation:",
      content: { element: "input", attributes: { placeholder: "e.g. needs more details" } },
      buttons: ["Cancel", "Reject"],
      dangerMode: true,
    });
    if (reason === null) return;
    try {
      setLoading(true);
      await axios.post(
        apiUrl(`/org-drives/${d._id}/reject`),
        { reason: typeof reason === "string" ? reason : "" },
        { headers: authHeaders() }
      );
      swal("Rejected", `${d.name} has been rejected.`, "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to reject", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (d) => {
    const ok = await swal({
      title: `Delete ${d.name}?`,
      text: "This permanently removes the drive and its registrations.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(apiUrl(`/org-drives/${d._id}`), { headers: authGet() });
      swal("Deleted", "Drive removed.", "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="m-0"><i className="ti ti-heart me-2"></i>Blood Donation Drives</h5>
          <small className="text-muted">
            Drives submitted by this organisation. Approve to unlock employee registrations.
          </small>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {DRIVE_APPROVAL_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`btn btn-sm ${approvalFilter === t.key ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setApprovalFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover-removed my-table">
            <thead id="request-heading">
              <tr>
                <th className="align-left">Drive</th>
                <th className="align-left">Partner</th>
                <th className="align-left">Date / Location</th>
                <th className="align-center">Target</th>
                <th className="align-center">Registered</th>
                <th className="align-center">Lifecycle</th>
                <th className="align-center">Approval</th>
                <th className="align-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drives.length === 0 ? (
                <tr>
                  <td colSpan={8} className="align-center">
                    <p className="m-5 p-5 fs-4">No drives in this view.</p>
                  </td>
                </tr>
              ) : (
                drives.map((d) => {
                  const ab = driveApprovalBadge(d.approvalStatus);
                  return (
                    <tr key={d._id}>
                      <td className="align-left">
                        <div className="fw-bold" style={{ color: "#111827" }}>{d.name}</div>
                        {d.description && (
                          <div className="text-muted small" style={{ maxWidth: 280 }}>
                            {d.description}
                          </div>
                        )}
                      </td>
                      <td className="align-left">{d.partner || "—"}</td>
                      <td className="align-left small">
                        {d.date ? moment(d.date).format("DD MMM YYYY") : "—"}
                        {d.time && <> · {d.time}</>}
                        <div className="text-muted">{d.location}</div>
                      </td>
                      <td className="align-center">{d.target}</td>
                      <td className="align-center">{d.registeredCount || 0}</td>
                      <td className="align-center">
                        <Badge color={driveLifecycleColor(d.status)}>{d.status}</Badge>
                      </td>
                      <td className="align-center">
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                            background: ab.color,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <i className={`ti ${ab.icon}`}></i> {ab.label}
                        </span>
                        {d.approvalStatus === "rejected" && d.rejectionNote && (
                          <div className="text-muted small mt-1" style={{ maxWidth: 180 }}>
                            {d.rejectionNote}
                          </div>
                        )}
                      </td>
                      <td className="align-center">
                        {d.approvalStatus !== "approved" && (
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => approve(d)}
                            title="Approve"
                          >
                            <i className="ti ti-check"></i>
                          </button>
                        )}
                        {d.approvalStatus !== "rejected" && (
                          <button
                            className="btn btn-sm btn-outline-warning me-1"
                            onClick={() => reject(d)}
                            title="Reject"
                          >
                            <i className="ti ti-x"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => remove(d)}
                          title="Delete"
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


// ─── Tab: Documents ────────────────────────────────────────────────────────
// Documents the org uploaded from its dashboard (Organisation / Verification /
// Certificates). Admin reviews each and marks verified / rejected / pending —
// this is what backs the verification decision on the Overview tab.
const DOC_CATEGORY_TABS = [
  { key: "all",          label: "All"           },
  { key: "verification", label: "Verification"  },
  { key: "organisation", label: "Organisation"  },
  { key: "certificate",  label: "Certificates"  },
];

const docStatusBadge = (s) =>
  s === "verified"
    ? { label: "Verified", color: "#C0392B", icon: "ti-circle-check" }
    : s === "rejected"
      ? { label: "Rejected", color: "#DC2626", icon: "ti-circle-x" }
      : s === "uploaded"
        ? { label: "Uploaded", color: "#6B7280", icon: "ti-file" }
        : { label: "Pending", color: "#D21C20", icon: "ti-clock" };

const formatBytes = (b) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const DocumentsTab = ({ org }) => {
  const { setLoading } = useContext(GlobalContext);
  const [docs, setDocs] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const load = async () => {
    try {
      setLoading(true);
      const qs = categoryFilter === "all" ? "" : `?category=${categoryFilter}`;
      const res = await axios.get(
        apiUrl(`/organizations/${org._id}/documents${qs}`),
        { headers: authGet() }
      );
      setDocs(res?.data?.data?.items || []);
    } catch (err) {
      console.error(err);
      swal("Error", err?.response?.data?.error || "Failed to load documents", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [org._id, categoryFilter]);

  const setStatus = async (d, status) => {
    let reviewNote = d.reviewNote || "";
    if (status === "rejected") {
      const note = await swal({
        title: `Reject "${d.title}"?`,
        text: "Optional note to share with the organisation:",
        content: { element: "input", attributes: { placeholder: "e.g. document expired / unreadable" } },
        buttons: ["Cancel", "Reject"],
        dangerMode: true,
      });
      if (note === null) return; // cancelled
      reviewNote = typeof note === "string" ? note : "";
    }
    try {
      setLoading(true);
      await axios.patch(
        apiUrl(`/organizations/${org._id}/documents/${d._id}`),
        { status, reviewNote },
        { headers: authHeaders() }
      );
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to update document", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (d) => {
    const ok = await swal({
      title: `Delete "${d.title}"?`,
      text: "This permanently removes the document record.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(apiUrl(`/organizations/${org._id}/documents/${d._id}`), {
        headers: authGet(),
      });
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="m-0"><i className="ti ti-files me-2"></i>Documents</h5>
          <small className="text-muted">
            Documents uploaded by this organisation. Verify or reject to inform the overall verification decision.
          </small>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {DOC_CATEGORY_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`btn btn-sm ${categoryFilter === t.key ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setCategoryFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover-removed my-table">
            <thead id="request-heading">
              <tr>
                <th className="align-left">Document</th>
                <th className="align-left">Category</th>
                <th className="align-center">Uploaded</th>
                <th className="align-center">Status</th>
                <th className="align-center">File</th>
                <th className="align-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="align-center">
                    <p className="m-5 p-5 fs-4">No documents in this view.</p>
                  </td>
                </tr>
              ) : (
                docs.map((d) => {
                  const sb = docStatusBadge(d.status);
                  return (
                    <tr key={d._id}>
                      <td className="align-left">
                        <div className="fw-bold" style={{ color: "#111827" }}>{d.title}</div>
                        <div className="text-muted small">
                          {(d.mime || "").toUpperCase().replace("APPLICATION/", "")} · {formatBytes(d.size)}
                        </div>
                      </td>
                      <td className="align-left text-capitalize">{d.category}</td>
                      <td className="align-center">
                        {d.createdAt ? moment(d.createdAt).format("DD-MM-YYYY") : "—"}
                      </td>
                      <td className="align-center">
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                            background: sb.color,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <i className={`ti ${sb.icon}`}></i> {sb.label}
                        </span>
                        {d.status === "rejected" && d.reviewNote && (
                          <div className="text-muted small mt-1" style={{ maxWidth: 180 }}>
                            {d.reviewNote}
                          </div>
                        )}
                      </td>
                      <td className="align-center">
                        {d.url ? (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-outline-secondary"
                            title="Open / download"
                          >
                            <i className="ti ti-external-link"></i>
                          </a>
                        ) : "—"}
                      </td>
                      <td className="align-center">
                        {d.status !== "verified" && (
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => setStatus(d, "verified")}
                            title="Mark verified"
                          >
                            <i className="ti ti-check"></i>
                          </button>
                        )}
                        {d.status !== "rejected" && (
                          <button
                            className="btn btn-sm btn-outline-warning me-1"
                            onClick={() => setStatus(d, "rejected")}
                            title="Reject"
                          >
                            <i className="ti ti-x"></i>
                          </button>
                        )}
                        {d.status !== "pending" && (
                          <button
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => setStatus(d, "pending")}
                            title="Mark pending"
                          >
                            <i className="ti ti-clock"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => remove(d)}
                          title="Delete"
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: NGO Collaboration (admin oversight) ────────────────────────────────
// Read view of the NGO partners + joint campaigns an org self-manages from its
// dashboard. Admin can remove partners for moderation.
const partnerStatusColor = (s) =>
  s === "active" ? "#C0392B" :
  s === "pending" ? "#D21C20" :
  s === "declined" ? "#DC2626" : "#6B7280";

const NgoCollaborationTab = ({ org }) => {
  const { setLoading } = useContext(GlobalContext);
  const [partners, setPartners] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        axios.get(apiUrl(`/organizations/${org._id}/ngo-partners`), { headers: authGet() }),
        axios.get(apiUrl(`/organizations/${org._id}/joint-campaigns`), { headers: authGet() }),
      ]);
      setPartners(pRes?.data?.data?.items || []);
      setCampaigns(cRes?.data?.data?.items || []);
    } catch (err) {
      console.error(err);
      swal("Error", err?.response?.data?.error || "Failed to load NGO collaboration", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [org._id]);

  const removePartner = async (p) => {
    const ok = await swal({
      title: `Remove "${p.name}"?`,
      text: "This deletes the partner record from the organisation.",
      icon: "warning",
      buttons: ["Cancel", "Remove"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(apiUrl(`/organizations/${org._id}/ngo-partners/${p._id}`), { headers: authGet() });
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to remove", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card mb-4">
        <div className="card-header bg-white">
          <h5 className="m-0"><i className="ti ti-building-community me-2"></i>NGO Partners</h5>
          <small className="text-muted">NGO partners this organisation manages from its dashboard.</small>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover-removed my-table">
              <thead id="request-heading">
                <tr>
                  <th className="align-left">NGO</th>
                  <th className="align-left">Focus / City</th>
                  <th className="align-left">Partnership</th>
                  <th className="align-center">Status</th>
                  <th className="align-center">Since</th>
                  <th className="align-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.length === 0 ? (
                  <tr><td colSpan={6} className="align-center"><p className="m-5 p-5 fs-4">No NGO partners yet.</p></td></tr>
                ) : (
                  partners.map((p) => (
                    <tr key={p._id}>
                      <td className="align-left">
                        <div className="fw-bold" style={{ color: "#111827" }}>{p.name}</div>
                        {p.contactName && <div className="text-muted small">{p.contactName}{p.email ? ` · ${p.email}` : ""}</div>}
                      </td>
                      <td className="align-left">{[p.focus, p.city].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="align-left">{p.partnershipType || "—"}</td>
                      <td className="align-center"><Badge color={partnerStatusColor(p.status)}>{p.status}</Badge></td>
                      <td className="align-center">{p.partnerSince ? moment(p.partnerSince).format("DD MMM YYYY") : "—"}</td>
                      <td className="align-center">
                        <button className="btn btn-sm btn-outline-danger" onClick={() => removePartner(p)} title="Remove">
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

      <div className="card">
        <div className="card-header bg-white">
          <h5 className="m-0"><i className="ti ti-heart-handshake me-2"></i>Joint Campaigns</h5>
          <small className="text-muted">Campaigns co-run with NGO partners.</small>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover-removed my-table">
              <thead id="request-heading">
                <tr>
                  <th className="align-left">Campaign</th>
                  <th className="align-left">Partner</th>
                  <th className="align-left">Our Role</th>
                  <th className="align-left">Contribution</th>
                  <th className="align-center">Date</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr><td colSpan={5} className="align-center"><p className="m-5 p-5 fs-4">No joint campaigns yet.</p></td></tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c._id}>
                      <td className="align-left fw-bold">{c.name}</td>
                      <td className="align-left">{c.partner?.name || c.partnerName || "—"}</td>
                      <td className="align-left">{c.role || "—"}</td>
                      <td className="align-left">{c.contribution || "—"}</td>
                      <td className="align-center">{c.date ? moment(c.date).format("DD MMM YYYY") : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Tab: Volunteers ─────────────────────────────────────────────────────────
// Volunteers are a separate record type from employees, with their own
// approval queue. Mirrors the MembersTab pattern but hits /org-volunteers.
const VolunteersTab = ({ org }) => {
  const { setLoading } = useContext(GlobalContext);
  const [vols, setVols] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        apiUrl(`/org-volunteers?organization=${org._id}&status=${statusFilter}`),
        { headers: authGet() }
      );
      setVols(res?.data?.data?.items || []);
    } catch (err) {
      console.error(err);
      swal("Error", err?.response?.data?.error || "Failed to load volunteers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [org._id, statusFilter]);

  const approve = async (v) => {
    try {
      setLoading(true);
      await axios.post(apiUrl(`/org-volunteers/${v._id}/approve`), {}, { headers: authHeaders() });
      swal("Approved", `${v.name} is now an active volunteer for ${org.name}.`, "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to approve", "error");
    } finally {
      setLoading(false);
    }
  };

  const reject = async (v) => {
    const reason = await swal({
      title: `Reject ${v.name}?`,
      text: "Optional reason to share with the organisation:",
      content: { element: "input", attributes: { placeholder: "e.g. duplicate / wrong details" } },
      buttons: ["Cancel", "Reject"],
      dangerMode: true,
    });
    if (reason === null) return;
    try {
      setLoading(true);
      await axios.post(apiUrl(`/org-volunteers/${v._id}/reject`), { reason: typeof reason === "string" ? reason : "" }, { headers: authHeaders() });
      swal("Rejected", `${v.name} has been rejected.`, "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to reject", "error");
    } finally {
      setLoading(false);
    }
  };

  const removeVol = async (v) => {
    const ok = await swal({
      title: `Delete ${v.name}?`,
      text: "This permanently removes the volunteer record.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(apiUrl(`/org-volunteers/${v._id}`), { headers: authGet() });
      swal("Deleted", "Volunteer removed.", "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to remove", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="m-0"><i className="ti ti-user-heart me-2"></i>Volunteers</h5>
          <small className="text-muted">
            Volunteers submitted by this organisation. Approve or reject to control what shows in their dashboard.
          </small>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`btn btn-sm ${statusFilter === t.key ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setStatusFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover-removed my-table">
            <thead id="request-heading">
              <tr>
                <th className="align-left">Name</th>
                <th className="align-left">Email</th>
                <th className="align-left">Department</th>
                <th className="align-center">Group</th>
                <th className="align-left">Skills</th>
                <th className="align-center">Status</th>
                <th className="align-center">Submitted</th>
                <th className="align-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vols.length === 0 ? (
                <tr><td colSpan={8} className="align-center"><p className="m-5 p-5 fs-4">No volunteers in this view.</p></td></tr>
              ) : (
                vols.map((v) => {
                  const sb = memberStatusBadge(v.status);
                  return (
                    <tr key={v._id}>
                      <td className="align-left">
                        <div className="fw-bold" style={{ color: "#111827" }}>{v.name}</div>
                        {v.phone && <div className="text-muted small">{v.phone}</div>}
                      </td>
                      <td className="align-left">{v.email}</td>
                      <td className="align-left">{v.dept || "—"}</td>
                      <td className="align-center">{v.blood || "—"}</td>
                      <td className="align-left">{v.skills || "—"}</td>
                      <td className="align-center">
                        <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#fff", background: sb.color, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <i className={`ti ${sb.icon}`}></i> {sb.label}
                        </span>
                        {v.status === "rejected" && v.rejectionNote && (
                          <div className="text-muted small mt-1" style={{ maxWidth: 180 }}>{v.rejectionNote}</div>
                        )}
                      </td>
                      <td className="align-center">{v.createdAt ? moment(v.createdAt).format("DD-MM-YYYY") : "—"}</td>
                      <td className="align-center">
                        {v.status !== "approved" && (
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => approve(v)} title="Approve"><i className="ti ti-check"></i></button>
                        )}
                        {v.status !== "rejected" && (
                          <button className="btn btn-sm btn-outline-warning me-1" onClick={() => reject(v)} title="Reject"><i className="ti ti-x"></i></button>
                        )}
                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeVol(v)} title="Delete"><i className="ti ti-trash"></i></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Profile header ────────────────────────────────────────────────────────
// Hero card at the top of the detail page: avatar/initials, name, status
// chips and contact info. Built with inline styles so it reads as a distinct
// "profile" surface rather than another red-headed admin card.
const initialsOf = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

const HeaderChip = ({ icon, children, href }) => {
  const inner = (
    <>
      <i className={`ti ${icon}`} style={{ fontSize: 14 }}></i>
      <span>{children}</span>
    </>
  );
  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#475569",
    background: "#F1F5F9",
    border: "1px solid #E2E8F0",
    borderRadius: 999,
    padding: "5px 12px",
    textDecoration: "none",
    fontWeight: 500,
  };
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" style={style}>{inner}</a>
  ) : (
    <span style={style}>{inner}</span>
  );
};

const OrgProfileHeader = ({ org }) => {
  const statusColor = org.verified ? "#C0392B" : org.verificationRejected ? "#DC2626" : "#D21C20";
  return (
    <div
      className="card mb-4"
      style={{ borderLeft: `4px solid ${statusColor}` }}
    >
      <div className="card-body">
        <div className="d-flex align-items-start gap-3 flex-wrap">
          {/* Avatar */}
          {org.logo?.url ? (
            <img
              src={org.logo.url}
              alt={org.name}
              style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}
            />
          ) : (
            <div
              style={{
                width: 64, height: 64, borderRadius: 16, flexShrink: 0,
                background: "linear-gradient(135deg, #C0392B, #E74C3C)",
                color: "#fff", fontWeight: 800, fontSize: 24,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(192,57,43,0.35)",
                fontFamily: "var(--f-display, inherit)",
              }}
            >
              {initialsOf(org.name)}
            </div>
          )}

          {/* Identity */}
          <div className="flex-grow-1" style={{ minWidth: 220 }}>
            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
              <h3 className="m-0" style={{ fontWeight: 800, letterSpacing: "-0.4px", color: "#C0392B" }}>{org.name}</h3>
              <Badge color="#C0392B" icon="ti-building">{org.type}</Badge>
              {verificationBadge(org)}
            </div>
            {org.description && (
              <div className="text-muted mb-2" style={{ maxWidth: 720 }}>{org.description}</div>
            )}
            <div className="d-flex gap-2 flex-wrap mt-2">
              {org.contactName && <HeaderChip icon="ti-user">{org.contactName}</HeaderChip>}
              {org.contactEmail && <HeaderChip icon="ti-mail" href={`mailto:${org.contactEmail}`}>{org.contactEmail}</HeaderChip>}
              {org.contactPhone && <HeaderChip icon="ti-phone">{org.contactPhone}</HeaderChip>}
              {org.website && (
                <HeaderChip icon="ti-world" href={org.website}>
                  {org.website.replace(/^https?:\/\//, "")}
                </HeaderChip>
              )}
              {org.partnershipSince && (
                <HeaderChip icon="ti-calendar">
                  Partner since {moment(org.partnershipSince).format("MMM YYYY")}
                </HeaderChip>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      volunteers: {
        label: (<><i className="ti ti-user-heart me-1"></i>Volunteers</>),
        onClick: () => {},
        render: <VolunteersTab org={org} />,
      },
      documents: {
        label: (<><i className="ti ti-files me-1"></i>Documents</>),
        onClick: () => {},
        render: <DocumentsTab org={org} />,
      },
      drives: {
        label: (<><i className="ti ti-heart me-1"></i>Drives</>),
        onClick: () => {},
        render: <DrivesTab org={org} />,
      },
      ngoPartners: {
        label: (<><i className="ti ti-building-community me-1"></i>NGO Partners</>),
        onClick: () => {},
        render: <NgoCollaborationTab org={org} />,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  if (!org) {
    return (
      <>
        <SEO title="Organization" />
        <div className="content-wrapper lsa-tight-top">
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
      <div className="content-wrapper lsa-tight-top">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate("/organizations")}>
            <i className="ti ti-arrow-left me-1"></i> Back to Organizations
          </button>
        </div>

        <OrgProfileHeader org={org} />

        {tabs && <Tabs tabs={tabs} accent="#DC2626" />}
      </div>
    </>
  );
};

export default OrganizationDetails;
