import { useContext, useEffect, useState } from "react";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import moment from "moment";

import Pagination from "../Components/Pagination";
import PageDetails from "../Components/PageDetails";
import { GlobalContext } from "../GlobalContext";
import SEO from "../SEO";

const NOTIFICATION_TYPES = [
  "All",
  "blood_request",
  "blood_request_nearby",
  "donation_matched",
  "donation_confirmed",
  "appointment_reminder",
  "appointment_cancelled",
  "profile_update",
  "profile_approved",
  "profile_rejected",
  "new_user_registered",
  "system_alert",
  "announcement",
  "other",
];

const PRIORITIES = ["All", "low", "normal", "high", "urgent"];

const priorityBadge = (p) => {
  switch (p) {
    case "urgent":
      return "bg-danger";
    case "high":
      return "bg-warning";
    case "low":
      return "bg-secondary";
    default:
      return "bg-info";
  }
};

const Notifications = () => {
  const { setLoading, alert } = useContext(GlobalContext);

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [recipientType, setRecipientType] = useState("All");
  const [notificationType, setNotificationType] = useState("All");
  const [readState, setReadState] = useState("All");
  const [priority, setPriority] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [refresh, setRefresh] = useState(false);

  const handelLimit = (e) => {
    setLimit(parseInt(e));
    setCurrentPage(1);
  };

  const getData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        n: limit,
        p: currentPage,
        recipient_type: recipientType,
        notification_type: notificationType,
        is_read: readState,
        priority,
        searchText,
      });

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/notifications?${params.toString()}`,
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );

      const { data, count } = res.data;
      setNotifications(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.max(Math.ceil((count || 0) / limit), 1));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [refresh, currentPage, limit, recipientType, notificationType, readState, priority, searchText]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchText(searchInput);
  };

  const markAsRead = async (id) => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/notification/${id}/read`,
        {},
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setRefresh(!refresh);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/notifications/read-all`,
        recipientType !== "All" ? { recipient_type: recipientType } : {},
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      setRefresh(!refresh);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const removeNotification = async (id) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/notification/${id}`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      setRefresh(!refresh);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="content-wrapper">
        <SEO title="Notifications" />

        <div className="d-flex mb-3 justify-content-between align-items-center flex-wrap">
          <p className="card-title p-0 m-0">Notifications</p>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={markAllAsRead}
          >
            Mark all as read
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              <div className="d-flex flex-wrap gap-2 align-items-end p-3">
                <div>
                  <label className="form-label mb-1 small fw-bold">Recipient</label>
                  <select
                    className="form-control form-control-sm"
                    value={recipientType}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setRecipientType(e.target.value);
                    }}
                  >
                    <option value="All">All</option>
                    <option value="user">User (Donor / Recipient)</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="form-label mb-1 small fw-bold">Type</label>
                  <select
                    className="form-control form-control-sm"
                    value={notificationType}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setNotificationType(e.target.value);
                    }}
                  >
                    {NOTIFICATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t === "All" ? "All" : t.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label mb-1 small fw-bold">Status</label>
                  <select
                    className="form-control form-control-sm"
                    value={readState}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setReadState(e.target.value);
                    }}
                  >
                    <option value="All">All</option>
                    <option value="false">Unread</option>
                    <option value="true">Read</option>
                  </select>
                </div>

                <div>
                  <label className="form-label mb-1 small fw-bold">Priority</label>
                  <select
                    className="form-control form-control-sm"
                    value={priority}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setPriority(e.target.value);
                    }}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p === "All" ? "All" : p}
                      </option>
                    ))}
                  </select>
                </div>

                <form className="d-flex gap-2" onSubmit={handleSearchSubmit}>
                  <div>
                    <label className="form-label mb-1 small fw-bold">Search</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Title or message"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm align-self-end">
                    Search
                  </button>
                </form>
              </div>

              <div className="table-responsive">
                <table className="table table-hover-removed my-table">
                  <thead id="request-heading">
                    <tr>
                      <th className="align-left">SR.NO</th>
                      <th className="align-left">Date</th>
                      <th className="align-left">Recipient</th>
                      <th className="align-left">Type</th>
                      <th className="align-left">Title</th>
                      <th className="align-left">Message</th>
                      <th className="align-left">Priority</th>
                      <th className="align-left">Status</th>
                      <th className="align-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: limit }).map((_, index) => (
                        <tr key={index}>
                          {Array.from({ length: 9 }).map((__, i) => (
                            <td key={i} className="align-left">
                              <Skeleton height={20} width={100} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : notifications.length > 0 ? (
                      notifications.map((n, index) => (
                        <tr key={n._id} style={{ background: n.is_read ? "transparent" : "rgba(13,110,253,0.05)" }}>
                          <td className="align-left">{(currentPage - 1) * limit + index + 1}</td>
                          <td className="align-left">
                            {moment(n.created_at).format("DD-MM-YYYY h:mm A")}
                          </td>
                          <td className="align-left">
                            <div className="d-flex flex-column">
                              <span className="fw-bold text-capitalize">{n.recipient_type}</span>
                              <small className="text-muted">
                                {n.recipient_id?.name || n.recipient_id?.email || n.recipient_id || "—"}
                              </small>
                            </div>
                          </td>
                          <td className="align-left">
                            <span className="text-capitalize">
                              {n.notification_type?.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td className="align-left">{n.title}</td>
                          <td
                            className="align-left"
                            style={{ maxWidth: "320px", whiteSpace: "normal", wordBreak: "break-word" }}
                          >
                            {n.message}
                          </td>
                          <td className="align-left">
                            <span className={`badge ${priorityBadge(n.priority)}`}>
                              {n.priority}
                            </span>
                          </td>
                          <td className="align-left">
                            {n.is_read ? (
                              <span className="badge bg-success">Read</span>
                            ) : (
                              <span className="badge bg-warning">Unread</span>
                            )}
                          </td>
                          <td className="align-center">
                            <div className="d-flex justify-content-center gap-2">
                              {!n.is_read && (
                                <button
                                  type="button"
                                  title="Mark as read"
                                  className="btn btn-sm btn-outline-success p-1"
                                  onClick={() => markAsRead(n._id)}
                                >
                                  <i className="fa-regular fa-circle-check"></i>
                                </button>
                              )}
                              <button
                                type="button"
                                title="Delete"
                                className="btn btn-sm btn-outline-danger p-1"
                                onClick={() => removeNotification(n._id)}
                              >
                                <i className="fa-regular fa-trash-can"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="align-center">
                          <p className="m-5 p-5 fs-4">No Notifications Found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="page-info">
                <div className="page-details">
                  <PageDetails totalCount={totalCount} limit={limit} handelLimit={handelLimit} />
                </div>
                <div className="pagination-container">
                  <Pagination
                    totalPages={totalPages || 1}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                  />
                </div>
                <div id="total-counts">
                  <p className="total-count text-white">
                    Page {currentPage} of {totalPages || 1}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Notifications;
