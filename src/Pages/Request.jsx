import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import Pagination from "../Components/Pagination";
import RequestFilter from "../Components/RequestFilter";
import PageDetails from "../Components/PageDetails";
import { GlobalContext } from "../GlobalContext";
import SEO from "../SEO";
import Tabs from "../Components/Tabs";
import moment from "moment";

const Request = () => {
  const [requests, setRequests] = useState(null);
  const [searchText, setSearchText] = useState("");

  const [refresh, setRefresh] = useState(false);
  const { setLoading, auth, alert } = useContext(GlobalContext);
  const [type, setType] = useState(false);

  const [bloodSelects, setBloodSelects] = useState("All");
  const [statusSelects, setStatusSelects] = useState("All");
  const [needUnitsSelects, setNeedUnitsSelects] = useState("All");
  const [gotUnitsSelects, setGotUnitsSelects] = useState("All");

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const handelLimit = (e) => {
    setLimit(e);
    setCurrentPage(1);
  };

  const getData = async () => {
    try {
      setIsLoading(true);
      let url = `${import.meta.env.VITE_API_URL}/requests?n=${limit}&p=${currentPage}&searchText=${searchText}&type=${
        type ? "Platelet" : "Blood"
      }`;

      if (bloodSelects !== "All") {
        url += `&bloodGroup=${encodeURIComponent(bloodSelects)}`;
      }
      if (statusSelects !== "All") {
        url += `&status=${statusSelects}`;
      }
      if (needUnitsSelects !== "All") {
        url += `&needUnits=${needUnitsSelects}`;
      }
      if (gotUnitsSelects !== "All") {
        url += `&gotUnits=${gotUnitsSelects}`;
      }
      const res = await axios.get(url, {
        headers: {
          Authorization: sessionStorage.getItem("auth"),
        },
      });

      const { data, error } = res;

      if (data && data.data) {
        setTotalCount(data.count);
        setTotalPages(Math.ceil(data.count / limit));

        const updatedData = data.data.map((request) => {
          const date = new Date(request.date);
          const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
          const month = date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
          const year = date.getFullYear();
          return {
            ...request,
            date: `${day}-${month}-${year}`,
          };
        });
        setRequests(updatedData);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    getData();
  }, [
    refresh,
    currentPage,
    limit,
    bloodSelects,
    statusSelects,
    needUnitsSelects,
    gotUnitsSelects,
    setLoading,
    searchText,
    type,
  ]);

  const handleStatusChange = async (id, event) => {
    const status = event.target.value;
    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/request/${id}`,
        { status },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );
      setRefresh(!refresh);
    } catch (error) {
      // console.error(error);
      // alert({
      //   type: "danger",
      //   title: "Error!",
      //   text: error.message,
      // });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="content-wrapper">
        <SEO title="Requests" />

        <div className="d-flex mb-3 justify-content-between align-items-center flex-wrap">
          <p className="card-title p-0 m-0">Requests</p>
        </div>
        <Tabs
          tabs={{
            Blood: {
              label: "Blood",
              render: "",
              onClick: (e) => {
                setType(false);
              },
            },
            Patelet: {
              label: "Patelet",
              render: "",
              onClick: (e) => {
                setType(true);
              },
            },
          }}
        />

        <div className="card">
          <div className="card-body ">
            <div className="table-card-border">
              <RequestFilter
                bloodSelects={bloodSelects}
                setBloodSelects={setBloodSelects}
                statusSelects={statusSelects}
                setStatusSelects={setStatusSelects}
                gotUnitsSelects={gotUnitsSelects}
                setGotUnitsSelects={setGotUnitsSelects}
                needUnitsSelects={needUnitsSelects}
                setNeedUnitsSelects={setNeedUnitsSelects}
                getData={getData}
                requests={requests}
                setRequests={setRequests}
                limit={limit}
                setTotalCount={setTotalCount}
                setTotalPages={setTotalPages}
                setSearchText={setSearchText}
                searchText={setSearchText}
              />

              {isLoading ? (
                <div className="table-responsive ">
                  <table className="table table-hover-removed my-table">
                    <thead id="request-heading">
                      <tr>
                        <th className="align-left">SR NO</th>
                        <th className="align-left">User</th>
                        <th className="align-left">Mobile Number</th>
                        <th className="align-left">Blood Group</th>
                        <th className="align-left">Units Needed</th>
                        <th className="align-left">Units Received</th>
                        <th className="align-left">Date</th>
                        <th className="align-left">Status</th>
                        <th className="align-center">View</th>
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
                          <td className="align-center">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-center">
                            <Skeleton height={20} width={100} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="table-responsive ">
                  <table className="table table-hover-removed my-table">
                    <thead id="request-heading">
                      <tr>
                        <th className="align-left">SR.NO</th>
                        <th className="align-left">User</th>
                        <th className="align-left">Mobile Number</th>
                        <th className="align-left">Blood Group</th>
                        <th className="align-left">Units Needed</th>
                        <th className="align-left">Units Received</th>
                        <th className="align-left">Critical</th>
                        <th className="align-left">Date</th>
                        <th className="align-left">Status</th>
                        <th className="align-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests?.length > 0 ? (
                        requests.map((request, index) => (
                          <tr key={index}>
                            <td className="align-left">{index + 1}</td>
                            <td className="align-left">{request.name}</td>
                            <td className="align-left">{request.phone}</td>
                            <td className="align-left">{request.bloodGroup}</td>
                            <td className="align-left">{request.needUnits}</td>
                            <td className="align-left">{request.gotUnits}</td>
                            <td className="align-left">{request.isCritical ? "Yes" : "No"}</td>

                            <td className="align-left">
                              {moment(request.date, "DD-MM-YYYY").format("DD-MM-YYYY h:mm A")}
                            </td>
                            <td className="align-left">
                              <select
                                style={{
                                  borderRadius: 5,
                                  borderRight: "10px solid transparent !important",
                                  borderLeft: 0,
                                  borderTop: 0,
                                  borderBottom: 0,
                                }}
                                className={`
                                ${
                                  request.status === "Open"
                                    ? "bg bg-success"
                                    : request.status === "Canceled"
                                    ? "bg bg-danger"
                                    : request.status === "Close"
                                    ? "bg bg-dark"
                                    : "bg bg-warning"
                                }  py-2 px-4`}
                                value={request.status}
                                onChange={(event) => handleStatusChange(request._id, event)}
                              >
                                <option className="bg-white" value="Open">
                                  Open
                                </option>
                                <option className="bg-white" value="Pending">
                                  Pending
                                </option>
                                <option className="bg-white" value="Close">
                                  Close
                                </option>
                                <option className="bg-white" value="Canceled">
                                  Canceled
                                </option>
                              </select>
                            </td>
                            <td className="align-center">
                              <Link to={`/request/${request._id}`}>
                                <i className="icons fa-regular fa-eye view-icon"></i>
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="">
                          <td colSpan={10} className="align-center">
                            <p className="m-5 p-5 fs-4">No Data Found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="page-info ">
                {" "}
                <div className="page-details ">
                  <PageDetails totalCount={totalCount} limit={limit} handelLimit={handelLimit} />
                </div>
                <div className="pagination-container">
                  {" "}
                  <Pagination totalPages={totalPages || 1} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                </div>
                <div className="" id="total-counts">
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

export default Request;
