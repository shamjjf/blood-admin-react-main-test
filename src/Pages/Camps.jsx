import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import swal from "sweetalert";

import Pagination from "../Components/Pagination";
import RequestFilter from "../Components/RequestFilter";
import PageDetails from "../Components/PageDetails";
import { GlobalContext } from "../GlobalContext";
import moment from "moment";
import CampFilter from "../Components/CampFilter";
import SEO from "../SEO";

const STATUS_OPTIONS = ["scheduled", "ongoing", "completed", "cancelled"];

const emptyCampForm = {
  organization: "",
  organizerName: "",
  organizerEmailId: "",
  location: "",
  purpose: "",
  donorsExpected: 50,
  venueDate: "",
  venueTime: "",
  status: "scheduled",
};

const Camps = () => {
  const { setLoading } = useContext(GlobalContext);
  const [camps, setCamps] = useState(null);
  const [searchText, setSearchText] = useState("");

  const [donorsExpected, setDonorsExpected] = useState("All");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  // ===== Create Camp modal state =====
  const [showCreate, setShowCreate] = useState(false);
  const [campForm, setCampForm] = useState(emptyCampForm);
  const [orgs, setOrgs] = useState([]);

  // Load org list when modal opens (so the dropdown is populated)
  useEffect(() => {
    if (!showCreate) return;
    (async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/organizations?active=true`,
          { headers: { Authorization: sessionStorage.getItem("auth") } }
        );
        setOrgs(res?.data?.data?.items || []);
      } catch (err) {
        console.error("load orgs failed:", err);
      }
    })();
  }, [showCreate]);

  // Auto-fill organizerName/Email when an organization is picked
  const handleOrgChange = (orgId) => {
    const org = orgs.find((o) => o._id === orgId);
    setCampForm((prev) => ({
      ...prev,
      organization: orgId,
      organizerName: org?.name || prev.organizerName,
      organizerEmailId: org?.contactEmail || prev.organizerEmailId,
      location: prev.location || org?.address || "",
    }));
  };

  const submitCamp = async () => {
    if (!campForm.organizerName.trim() && !campForm.organization)
      return swal("Error", "Pick an organization or enter an organizer name.", "error");
    if (!campForm.organizerEmailId.trim())
      return swal("Error", "Organizer email is required.", "error");
    if (!campForm.location.trim())
      return swal("Error", "Location is required.", "error");
    if (!campForm.venueDate)
      return swal("Error", "Venue date is required.", "error");
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/camps`,
        {
          ...campForm,
          organization: campForm.organization || null,
          donorsExpected: Number(campForm.donorsExpected) || 0,
        },
        { headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" } }
      );
      swal("Success", "Camp created", "success");
      setShowCreate(false);
      setCampForm(emptyCampForm);
      getData();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to create camp", "error");
    } finally {
      setLoading(false);
    }
  };

  const handelLimit = (e) => {
    setLimit(e);
    setCurrentPage(1);
  };

  const getData = async () => {
    try {
      setIsLoading(true);

      // Use the admin endpoint — it carries registration counts per camp
      // and is authenticated with the admin's JWT.
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/camps?searchText=${searchText}&n=${limit}&p=${currentPage}`,
        {
          headers: { Authorization: sessionStorage.getItem("auth") },
        }
      );

      // Response shape: { data: { camps: [...], count } }. Each camp has
      // a `counts` block ({registered, attended, no-show, cancelled}) which
      // we surface as spotsFilled = registered + attended for the table.
      const fetched = (response?.data?.data?.camps || []).map((c) => ({
        ...c,
        spotsFilled: (c.counts?.registered || 0) + (c.counts?.attended || 0),
      }));
      setCamps(fetched);
      setTotalCount(response?.data?.data?.count || 0);
      setTotalPages(Math.ceil((response?.data?.data?.count || 0) / limit));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    getData();
  }, [searchText, startDate, endDate, donorsExpected, limit, currentPage]);

  return (
    <>
      <div className="content-wrapper">
        <SEO title="Camp" />
        <div className="d-flex mb-4 mt-2 justify-content-between align-items-center">
          <p className="card-title p-0 m-0">Camp</p>
          <button
            className="btn btn-primary"
            style={{ borderRadius: 5 }}
            onClick={() => setShowCreate(true)}
          >
            <i className="ti ti-plus"></i> Create Camp
          </button>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              <CampFilter
                setSearchText={setSearchText}
                setDonorsExpected={setDonorsExpected}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                searchText={searchText}
                startDate={startDate}
                endDate={endDate}
                donorsExpected={donorsExpected}
              />

              {isLoading ? (
                <div className="table-responsive ">
                  <table className="table table-hover-removed my-table">
                    <thead id="request-heading">
                      <tr>
                        <th className="align-left">Organizer Name</th>
                        <th className="align-left">Email id</th>
                        <th className="align-left">Location</th>
                        <th className="align-left">Date</th>
                        <th className="align-left">Time</th>
                        <th className="align-left">Purpose</th>
                        <th className="align-left">Donors Expected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: limit }).map((_, index) => (
                        <tr key={index}>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover-removed my-table">
                    <thead id="request-heading">
                      <tr>
                        <th className="align-left">SR.NO</th>
                        <th className="align-left">Organizer Name</th>
                        <th className="align-left">Email id</th>
                        <th className="align-left">Location</th>
                        <th className="align-left">Purpose</th>
                        <th className="align-left">Date</th>
                        <th className="align-left">Time</th>
                        <th className="align-left">Filled / Capacity</th>
                        <th className="align-left">Status</th>
                        <th className="align-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {camps?.length > 0 ? (
                        camps.map((camp, index) => {
                          const filled = camp.spotsFilled || 0;
                          const capacity = camp.donorsExpected || 0;
                          const statusColor =
                            camp.status === "ongoing" ? "#16A34A" :
                            camp.status === "completed" ? "#6B7280" :
                            camp.status === "cancelled" ? "#DC2626" : "#0EA5E9";
                          return (
                            <tr key={index}>
                              <td className="align-left">{index + 1}</td>
                              <td className="align-left">{camp.organization?.name || camp.organizerName}</td>
                              <td className="align-left">{camp.organizerEmailId}</td>
                              <td className="align-center wrap-text">{camp.location}</td>
                              <td className="align-left">{camp.purpose}</td>
                              <td className="align-left">
                                {camp.venueDate ? moment(camp.venueDate).format("DD-MM-YYYY") : "-"}
                              </td>
                              <td className="align-left">{camp.venueTime || "-"}</td>
                              <td className="align-center">
                                {filled} / {capacity > 0 ? capacity : "∞"}
                              </td>
                              <td className="align-left">
                                <span style={{
                                  padding: "3px 10px",
                                  borderRadius: 10,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#fff",
                                  background: statusColor,
                                  textTransform: "capitalize",
                                }}>
                                  {camp.status || "scheduled"}
                                </span>
                              </td>
                              <td className="align-center">
                                <Link to={`/camp/${camp._id}`}>
                                  <i className="icons fa-regular fa-eye"></i>
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="">
                          <td colSpan={10} className="align-center ">
                            <p className="m-5 p-5 fs-4">No Data Found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="page-info">
                {" "}
                <div className="page-details">
                  <PageDetails totalCount={totalCount} limit={limit} handelLimit={handelLimit} />
                </div>
                <div className="pagination-container">
                  {" "}
                  <Pagination totalPages={totalPages || 1} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                </div>
                <div id="total-counts">
                  <p className="total-count">
                    Page {currentPage} of {totalPages || 1}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Create Camp Modal ===== */}
      {showCreate && (
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
          onClick={() => setShowCreate(false)}
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
              <h5 className="m-0">Create New Camp</h5>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div className="row g-3">
                <div className="col-md-12">
                  <label className="form-label">Organization (optional — leave blank for one-off camps)</label>
                  <select
                    className="form-control"
                    value={campForm.organization}
                    onChange={(e) => handleOrgChange(e.target.value)}
                  >
                    <option value="">— No organization —</option>
                    {orgs.map((o) => (
                      <option key={o._id} value={o._id}>
                        {o.name} ({o.type})
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Selecting an organization auto-fills organizer name and contact email below.
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Organizer Name *</label>
                  <input
                    className="form-control"
                    value={campForm.organizerName}
                    onChange={(e) => setCampForm({ ...campForm, organizerName: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Organizer Email *</label>
                  <input
                    className="form-control"
                    value={campForm.organizerEmailId}
                    onChange={(e) => setCampForm({ ...campForm, organizerEmailId: e.target.value })}
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label">Venue / Location *</label>
                  <input
                    className="form-control"
                    value={campForm.location}
                    onChange={(e) => setCampForm({ ...campForm, location: e.target.value })}
                    placeholder="Address or hall name"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={campForm.venueDate}
                    onChange={(e) => setCampForm({ ...campForm, venueDate: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={campForm.venueTime}
                    onChange={(e) => setCampForm({ ...campForm, venueTime: e.target.value })}
                  />
                  <small className="text-muted">Click to pick start time</small>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Capacity</label>
                  <input
                    type="number"
                    min={0}
                    className="form-control"
                    value={campForm.donorsExpected}
                    onChange={(e) => setCampForm({ ...campForm, donorsExpected: e.target.value })}
                    placeholder="0 = unlimited"
                  />
                </div>

                <div className="col-md-8">
                  <label className="form-label">Purpose</label>
                  <input
                    className="form-control"
                    value={campForm.purpose}
                    onChange={(e) => setCampForm({ ...campForm, purpose: e.target.value })}
                    placeholder="World Blood Donor Day, etc."
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control text-capitalize"
                    value={campForm.status}
                    onChange={(e) => setCampForm({ ...campForm, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button className="btn btn-outline-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={submitCamp}>
                  Create Camp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Camps;
