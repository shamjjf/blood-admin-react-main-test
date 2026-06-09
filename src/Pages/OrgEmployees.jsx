import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";
import EmptyState from "../Components/EmptyState";

const STATUS_OPTIONS = ["pending", "approved", "rejected", "all"];

const statusBadge = (s) => {
  if (s === "approved") return { label: "Approved", color: "#16A34A", icon: "ti-circle-check" };
  if (s === "rejected") return { label: "Rejected", color: "#DC2626", icon: "ti-circle-x" };
  return { label: "Pending", color: "#F59E0B", icon: "ti-clock" };
};

const Pill = ({ tone, children }) => {
  const cfg = statusBadge(tone);
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 700,
        color: "#fff",
        background: cfg.color,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <i className={`ti ${cfg.icon}`}></i> {children || cfg.label}
    </span>
  );
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

const OrgEmployees = () => {
  const { setLoading } = useContext(GlobalContext);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchText, setSearchText] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      if (searchText) params.set("searchText", searchText);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/org-employees?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setItems(res?.data?.data?.items || []);
    } catch (err) {
      console.error(err);
      swal("Error", err?.response?.data?.error || "Failed to load employees", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((e) => e.status === "pending").length,
      approved: items.filter((e) => e.status === "approved").length,
      rejected: items.filter((e) => e.status === "rejected").length,
    };
  }, [items]);

  const approve = async (emp) => {
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/org-employees/${emp._id}/approve`,
        {},
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      swal("Approved", `${emp.name} is now visible in their org panel.`, "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to approve", "error");
    } finally {
      setLoading(false);
    }
  };

  const reject = async (emp) => {
    const reason = await swal({
      title: `Reject ${emp.name}?`,
      text: "Optional reason to share with the organisation:",
      content: { element: "input", attributes: { placeholder: "e.g. duplicate / wrong details" } },
      buttons: ["Cancel", "Reject"],
      dangerMode: true,
    });
    if (reason === null) return;
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/org-employees/${emp._id}/reject`,
        { reason: typeof reason === "string" ? reason : "" },
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      swal("Rejected", `${emp.name} has been rejected.`, "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to reject", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (emp) => {
    const ok = await swal({
      title: `Delete ${emp.name}?`,
      text: "This permanently removes the employee record.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/org-employees/${emp._id}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      swal("Deleted", "Employee removed.", "success");
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Employee Approvals" />
      <div className="content-wrapper pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <p className="card-title p-0 m-0">Employee Approvals</p>
            <small className="text-muted">
              Approve or reject employees submitted by organisations from their dashboard.
            </small>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <StatCard label="Total" value={stats.total} accent="#0EA5E9" icon="ti-users" />
          <StatCard label="Pending" value={stats.pending} accent="#F59E0B" icon="ti-clock" />
          <StatCard label="Approved" value={stats.approved} accent="#16A34A" icon="ti-circle-check" />
          <StatCard label="Rejected" value={stats.rejected} accent="#DC2626" icon="ti-circle-x" />
        </div>

        <div className="card">
          <div className="card-body">
            <div className="d-flex gap-2 mb-3 flex-wrap">
              <select
                className="form-control"
                style={{ maxWidth: 200 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              <input
                className="form-control"
                style={{ maxWidth: 320 }}
                placeholder="Search by name or email…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") load(); }}
              />
              <button className="btn btn-outline-primary" onClick={load}>
                <i className="ti ti-search me-1"></i> Search
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">Employee</th>
                    <th className="align-left">Organisation</th>
                    <th className="align-left">Department / Role</th>
                    <th className="align-center">Group</th>
                    <th className="align-center">Donor</th>
                    <th className="align-center">Status</th>
                    <th className="align-center">Submitted</th>
                    <th className="align-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <EmptyState
                      colSpan={8}
                      icon="ti ti-users-group"
                      title="No employees in this view."
                    />
                  ) : (
                    items.map((e) => (
                      <tr key={e._id}>
                        <td className="align-left">
                          <div className="fw-bold" style={{ color: "#111827" }}>{e.name}</div>
                          <div className="text-muted small">{e.email}</div>
                          {e.phone && (
                            <div className="text-muted small">{e.phone}</div>
                          )}
                        </td>
                        <td className="align-left">
                          {e.organization?.name || "—"}
                          {e.organization?.type && (
                            <div className="text-muted small">{e.organization.type}</div>
                          )}
                        </td>
                        <td className="align-left">
                          <div>{e.dept || "—"}</div>
                          <div className="text-muted small">{e.role || "—"}</div>
                        </td>
                        <td className="align-center">{e.blood || "—"}</td>
                        <td className="align-center">{e.donor ? "Yes" : "No"}</td>
                        <td className="align-center">
                          <Pill tone={e.status} />
                          {e.status === "rejected" && e.rejectionNote && (
                            <div className="text-muted small mt-1" style={{ maxWidth: 180 }}>
                              {e.rejectionNote}
                            </div>
                          )}
                        </td>
                        <td className="align-center">
                          {new Date(e.createdAt).toLocaleDateString()}
                        </td>
                        <td className="align-center">
                          {e.status !== "approved" && (
                            <button
                              className="btn btn-sm btn-outline-success me-1"
                              onClick={() => approve(e)}
                              title="Approve"
                            >
                              <i className="ti ti-check"></i>
                            </button>
                          )}
                          {e.status !== "rejected" && (
                            <button
                              className="btn btn-sm btn-outline-warning me-1"
                              onClick={() => reject(e)}
                              title="Reject"
                            >
                              <i className="ti ti-x"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => remove(e)}
                            title="Delete"
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
        </div>
      </div>
    </>
  );
};

export default OrgEmployees;
