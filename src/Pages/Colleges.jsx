import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

// Institution categories the panel manages. Kept deliberately academic so it
// reads differently from the broader Organizations panel (which also has a
// generic "University"/"School" type).
const INSTITUTION_TYPES = [
  "University",
  "College",
  "Autonomous College",
  "Institute",
  "Polytechnic",
  "School",
  "Other",
];

const emptyForm = {
  _id: null,
  name: "",
  institutionType: "College",
  affiliatedUniversity: "",
  description: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  city: "",
  state: "",
  address: "",
  website: "",
  studentCount: "",
  nssCoordinator: "",
  establishedYear: "",
  partnershipSince: "",
  notes: "",
  active: true,
};

const authHeaders = () => ({
  Authorization: sessionStorage.getItem("auth"),
  "Content-Type": "application/json",
});

const verificationStatus = (c) => {
  if (c.verified) return { label: "Verified", color: "#16A34A", icon: "ti-circle-check" };
  if (c.verificationRejected) return { label: "Rejected", color: "#DC2626", icon: "ti-circle-x" };
  return { label: "Pending", color: "#F59E0B", icon: "ti-clock" };
};

const StatCard = ({ label, value, accent, icon }) => (
  <div className="col-md-3 col-sm-6">
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div className="card-body d-flex align-items-center gap-3" style={{ padding: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: `${accent}15`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          <i className={`ti ${icon}`}></i>
        </div>
        <div>
          <div className="text-muted small" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
            {label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
        </div>
      </div>
    </div>
  </div>
);

const Colleges = () => {
  const { setLoading } = useContext(GlobalContext);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");
  const [verifiedFilter, setVerifiedFilter] = useState("All");
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchText, setSearchText] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "All") params.set("institutionType", typeFilter);
      if (searchText) params.set("searchText", searchText);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/colleges?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setItems(res?.data?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      if (verifiedFilter === "Verified" && !c.verified) return false;
      if (verifiedFilter === "Pending" && (c.verified || c.verificationRejected)) return false;
      if (verifiedFilter === "Rejected" && !c.verificationRejected) return false;
      if (activeFilter === "Active" && !c.active) return false;
      if (activeFilter === "Inactive" && c.active) return false;
      return true;
    });
  }, [items, verifiedFilter, activeFilter]);

  const stats = useMemo(() => {
    const total = items.length;
    const verified = items.filter((c) => c.verified).length;
    const pending = items.filter((c) => !c.verified && !c.verificationRejected).length;
    const students = items.reduce((sum, c) => sum + (Number(c.studentCount) || 0), 0);
    return { total, verified, pending, students };
  }, [items]);

  const openCreate = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setForm({
      _id: c._id,
      name: c.name || "",
      institutionType: c.institutionType || "College",
      affiliatedUniversity: c.affiliatedUniversity || "",
      description: c.description || "",
      contactName: c.contactName || "",
      contactEmail: c.contactEmail || "",
      contactPhone: c.contactPhone || "",
      city: c.city || "",
      state: c.state || "",
      address: c.address || "",
      website: c.website || "",
      studentCount: c.studentCount ?? "",
      nssCoordinator: c.nssCoordinator || "",
      establishedYear: c.establishedYear ?? "",
      partnershipSince: c.partnershipSince
        ? new Date(c.partnershipSince).toISOString().slice(0, 10)
        : "",
      notes: c.notes || "",
      active: !!c.active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return swal("Error", "Name is required", "error");
    const payload = {
      name: form.name.trim(),
      institutionType: form.institutionType,
      affiliatedUniversity: form.affiliatedUniversity.trim(),
      description: form.description.trim(),
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      address: form.address.trim(),
      website: form.website.trim(),
      studentCount: form.studentCount === "" ? null : Number(form.studentCount),
      nssCoordinator: form.nssCoordinator.trim(),
      establishedYear: form.establishedYear === "" ? null : Number(form.establishedYear),
      partnershipSince: form.partnershipSince || null,
      notes: form.notes.trim(),
      active: !!form.active,
    };
    try {
      setLoading(true);
      if (form._id) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/colleges/${form._id}`, payload, {
          headers: authHeaders(),
        });
        swal("Success", "Institution updated", "success");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/colleges`, payload, {
          headers: authHeaders(),
        });
        swal("Success", "Institution added", "success");
      }
      closeModal();
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save institution", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await swal({
      title: "Delete institution?",
      text: "This cannot be undone.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/colleges/${id}`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      swal("Deleted", "Institution removed", "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/colleges/${c._id}`,
        { active: !c.active },
        { headers: authHeaders() }
      );
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to toggle", "error");
    } finally {
      setLoading(false);
    }
  };

  const quickVerify = async (c) => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/colleges/${c._id}`,
        {
          verified: !c.verified,
          verificationRejected: false,
          verifiedAt: !c.verified ? new Date().toISOString() : null,
        },
        { headers: authHeaders() }
      );
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to update verification", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Colleges & Universities" />
      <div className="content-wrapper pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <p className="card-title p-0 m-0">Colleges &amp; Universities</p>
            <small className="text-muted">
              Verify campus partners, manage NSS/NCC coordinators and track student blood drives.
            </small>
          </div>
          <button className="btn btn-primary" style={{ borderRadius: 5 }} onClick={openCreate}>
            <i className="ti ti-plus me-1"></i> Add Institution
          </button>
        </div>

        <div className="row g-3 mb-4">
          <StatCard label="Total" value={stats.total} accent="#0EA5E9" icon="ti-school" />
          <StatCard label="Verified" value={stats.verified} accent="#16A34A" icon="ti-shield-check" />
          <StatCard label="Pending Verification" value={stats.pending} accent="#F59E0B" icon="ti-clock" />
          <StatCard label="Students Reached" value={stats.students.toLocaleString()} accent="#8B5CF6" icon="ti-users-group" />
        </div>

        <div className="card">
          <div className="card-body">
            <div className="d-flex gap-2 mb-3 flex-wrap">
              <select
                className="form-control"
                style={{ maxWidth: 190 }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                {INSTITUTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                className="form-control"
                style={{ maxWidth: 200 }}
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value)}
              >
                <option value="All">All Verification</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
              <select
                className="form-control"
                style={{ maxWidth: 170 }}
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <input
                className="form-control"
                style={{ maxWidth: 260 }}
                placeholder="Search by name…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") load(); }}
              />
              <button className="btn btn-outline-primary" onClick={load}>
                <i className="ti ti-search me-1"></i>Search
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">Institution</th>
                    <th className="align-left">Type</th>
                    <th className="align-left">Location</th>
                    <th className="align-left">Verification</th>
                    <th className="align-left">Status</th>
                    <th className="align-center">Students</th>
                    <th className="align-center">Drives</th>
                    <th className="align-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="align-center">
                        <p className="m-5 p-5 fs-4">
                          {items.length === 0
                            ? "No institutions yet — click ‘Add Institution’ to begin."
                            : "No institutions match the current filters."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => {
                      const vs = verificationStatus(c);
                      return (
                        <tr key={c._id}>
                          <td className="align-left">
                            <Link
                              to={`/colleges/${c._id}`}
                              className="fw-bold"
                              style={{ color: "#111827", textDecoration: "none" }}
                            >
                              {c.name}
                            </Link>
                            {c.affiliatedUniversity && (
                              <div className="text-muted small" style={{ maxWidth: 320 }}>
                                <i className="ti ti-building-arch me-1"></i>{c.affiliatedUniversity}
                              </div>
                            )}
                          </td>
                          <td className="align-left">{c.institutionType}</td>
                          <td className="align-left">
                            {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td className="align-left">
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#fff",
                                background: vs.color,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <i className={`ti ${vs.icon}`}></i> {vs.label}
                            </span>
                          </td>
                          <td className="align-left">
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#FFFFFF",
                                background: c.active ? "#22C55E" : "#6B7280",
                              }}
                            >
                              {c.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="align-center">
                            {c.studentCount != null ? Number(c.studentCount).toLocaleString() : "—"}
                          </td>
                          <td className="align-center">{c.drivesCount ?? 0}</td>
                          <td className="align-center">
                            <Link
                              to={`/colleges/${c._id}`}
                              className="btn btn-sm btn-outline-primary me-1"
                              title="View details"
                            >
                              <i className="ti ti-eye"></i>
                            </Link>
                            <button
                              className={`btn btn-sm me-1 ${c.verified ? "btn-outline-secondary" : "btn-outline-success"}`}
                              onClick={() => quickVerify(c)}
                              title={c.verified ? "Mark unverified" : "Mark verified"}
                            >
                              <i className={`ti ${c.verified ? "ti-shield-off" : "ti-shield-check"}`}></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-info me-1"
                              onClick={() => openEdit(c)}
                              title="Edit"
                            >
                              <i className="ti ti-pencil"></i>
                            </button>
                            <button
                              className={`btn btn-sm me-1 ${c.active ? "btn-outline-secondary" : "btn-outline-success"}`}
                              onClick={() => toggleActive(c)}
                              title={c.active ? "Disable" : "Enable"}
                            >
                              <i className={`ti ${c.active ? "ti-toggle-left" : "ti-toggle-right"}`}></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(c._id)}
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
      </div>

      {showModal && (
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
          onClick={closeModal}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 820,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 20px",
                background: "#C0392B",
                color: "#fff",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h5 className="m-0">{form._id ? "Edit Institution" : "Add Institution"}</h5>
              <button
                onClick={closeModal}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name *</label>
                  <input
                    className="form-control"
                    maxLength={150}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Type *</label>
                  <select
                    className="form-control"
                    value={form.institutionType}
                    onChange={(e) => setForm({ ...form, institutionType: e.target.value })}
                  >
                    {INSTITUTION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="collegeActive"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="collegeActive">Active</label>
                  </div>
                </div>
                <div className="col-md-8">
                  <label className="form-label">Affiliated University / Board</label>
                  <input
                    className="form-control"
                    value={form.affiliatedUniversity}
                    onChange={(e) => setForm({ ...form, affiliatedUniversity: e.target.value })}
                    placeholder="e.g. University of Mumbai"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Established Year</label>
                  <input
                    type="number"
                    min={1800}
                    max={2100}
                    className="form-control"
                    value={form.establishedYear}
                    onChange={(e) => setForm({ ...form, establishedYear: e.target.value })}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Description</label>
                  <input
                    className="form-control"
                    maxLength={500}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Coordinator Name</label>
                  <input
                    className="form-control"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Coordinator Email</label>
                  <input
                    className="form-control"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Coordinator Phone</label>
                  <input
                    className="form-control"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">NSS / NCC Coordinator</label>
                  <input
                    className="form-control"
                    value={form.nssCoordinator}
                    onChange={(e) => setForm({ ...form, nssCoordinator: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Student Strength</label>
                  <input
                    type="number"
                    min={0}
                    className="form-control"
                    value={form.studentCount}
                    onChange={(e) => setForm({ ...form, studentCount: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Website</label>
                  <input
                    className="form-control"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">City</label>
                  <input
                    className="form-control"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">State</label>
                  <input
                    className="form-control"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Partner Since</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.partnershipSince}
                    onChange={(e) => setForm({ ...form, partnershipSince: e.target.value })}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Address</label>
                  <input
                    className="form-control"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Notes</label>
                  <input
                    className="form-control"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave}>
                  {form._id ? "Update" : "Add Institution"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Colleges;
