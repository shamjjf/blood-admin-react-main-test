import { useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import Pagination from "../Components/Pagination";

import PageDetails from "../Components/PageDetails";
import { GlobalContext } from "../GlobalContext";
import BulkUserFilter from "../Components/BulkUserFilter";
import SEO from "../SEO";

const BulkUsers = () => {
  const [bulkrequests, setBulkRequests] = useState([]);
  const [specialUsers, setSpecialUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState([]);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusA, setStatusA] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const handelLimit = (e) => {
    setLimit(e);
    setCurrentPage(1);
  };

  const getData = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/bulkrequests?n=${limit}&p=${currentPage}&su=${selectedUser}&s=${statusA}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );

      const { data } = response.data;

      // console.log("bulk user data-->", data);

      setSpecialUsers(data.specialusers);
      setBulkRequests(data.requests);

      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / limit));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, selectedUser, statusA]);
  useEffect(() => {
    getData();
  }, [getData]);

  const handleStatusChange = async (id, event) => {
    try {
      const status = event.target.value;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/bulkrequest/${id}`,
        { status },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );

      // console.log(response);

      getData();
    } catch (error) {
      console.log(error);
    }
  };

  const fncToFetchName = (id) => {
    const specialName = specialUsers.find((sp) => sp._id === id);

    return specialName?.name;
  };

  return (
    <>
      <SEO title="Bulk Users" />

      <div className="content-wrapper">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <p className="card-title p-0 m-0">Bulk Users</p>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              <BulkUserFilter
                statusA={statusA}
                setStatusA={setStatusA}
                specialUsers={specialUsers}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
              />

              {isLoading ? (
                <div className="table-responsive ">
                  <table className="table table-hover-removed my-table">
                    <thead id="request-heading">
                      <tr>
                        <th className="align-left">Special User Name</th>
                        <th className="align-left">Number of bulk users</th>
                        <th className="align-left">Status</th>
                        <th className="align-left">View</th>
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
                        <th className="align-left">SR.No</th>
                        <th className="align-left">Special User Name</th>
                        <th className="align-left">Number of bulk users</th>
                        <th className="align-left">Status</th>
                        <th className="align-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkrequests?.length > 0 ? (
                        bulkrequests.map((req, index) => (
                          <tr key={index}>
                            <td className="align-left">{index + 1}</td>
                            <td className="align-left">{fncToFetchName(req.specialuser)}</td>
                            <td className="align-left">{req.records}</td>

                            <td className="align-left">
                              <select
                                style={{
                                  borderRadius: 5,
                                  borderRight: "10px solid transparent !important",
                                  borderLeft: 0,
                                  borderTop: 0,
                                  borderBottom: 0,
                                }}
                                className={
                                  req.status === "denied"
                                    ? "bg-danger py-2 px-4"
                                    : req.status === "init"
                                    ? "bg-warning py-2 px-4"
                                    : "bg-success py-2 px-4"
                                }
                                value={req.status}
                                onChange={(event) => {
                                  handleStatusChange(req._id, event);
                                }}
                              >
                                <option className="bg-white" value="init" disabled>
                                  Pending
                                </option>
                                <option className="bg-white" value="approved">
                                  Approved
                                </option>
                                <option className="bg-white" value="denied">
                                  Denied
                                </option>
                              </select>
                            </td>

                            <td className="align-center">
                              <Link to={`/bulkuser/${req._id}`}>
                                <i className="icons fa-regular fa-eye view-icon"></i>
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="">
                          <td colSpan={9} className="align-center">
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
    </>
  );
};

export default BulkUsers;
