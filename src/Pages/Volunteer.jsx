import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import Pagination from "../Components/Pagination";

import PageDetails from "../Components/PageDetails";
import { GlobalContext } from "../GlobalContext";
import VolunteerFilter from "../Components/VolunteerFilter";
import SEO from "../SEO";

const Volunteer = () => {
  const [camps, setCamps] = useState([]);
  const [flag, setFlag] = useState(false);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusA, setStatusA] = useState("All");
  const [searchText, setSearchText] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const handelLimit = (e) => {
    setLimit(e);
    setCurrentPage(1);
  };

  const getData = async () => {
    try {
      setIsLoading(true);

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/vollist?searchText=${searchText}&statusA=${statusA}&limit=${limit}&currentPage=${currentPage}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );

      // console.log("volunteer-->", response);
      setCamps(response.data.volunteers);
      setTotalCount(response.data.totalCount);
      setTotalPages(Math.ceil(response.data.totalCount / limit));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    getData();
  }, [flag, statusA, searchText, limit, currentPage]);

  const handleStatusChange = async (id, event) => {
    try {
      const isVerified = event.target.value === "true";

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/vollistupdate/${id}`,
        { isVerified },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );

      // console.log(response);
      setFlag(!flag);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <SEO title="Volunteer" />

      <div className="content-wrapper">
        <div className="d-flex mb-4 mt-2 justify-content-between align-items-center">
          <p className="card-title p-0 m-0">Volunteer</p>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              <VolunteerFilter
                statusA={statusA}
                setStatusA={setStatusA}
                searchText={searchText}
                setSearchText={setSearchText}
              />

              {isLoading ? (
                <div className="table-responsive">
                  <table className="table table-hover-removed my-table">
                    <thead id="request-heading">
                      <tr>
                        <th className="align-left">Volunteer Name</th>
                        <th className="align-left">Education</th>
                        <th className="align-left">Interests</th>
                        <th className="align-left">Skills</th>
                        <th className="align-left">Languages</th>
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
                        <th className="align-left">Volunteer Name</th>
                        <th className="align-left">Education</th>
                        <th className="align-left">Interests</th>
                        <th className="align-left">Skills</th>
                        <th className="align-left">Languages</th>
                        <th className="align-left">Status</th>
                        <th className="align-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {camps?.length > 0 ? (
                        camps?.map((camp, index) => (
                          <tr key={index}>
                            <td className="align-left">{index + 1}</td>
                            <td className="align-left">{camp?.user?.name}</td>
                            <td className="align-left">{camp?.education}</td>
                            <td className="align-center wrap-text">{camp?.interests[0]}</td>
                            <td className="align-left">{camp?.skills[0]}</td>
                            <td className="align-left">{camp?.langs[0]}</td>

                            <td className="align-left">
                              <select
                                style={{
                                  borderRadius: 5,
                                  borderRight: "10px solid transparent !important",
                                  borderLeft: 0,
                                  borderTop: 0,
                                  borderBottom: 0,
                                }}
                                className={camp?.isVerified === false ? "bg-danger py-2 px-4" : "bg-success py-2 px-4"}
                                value={camp?.isVerified ? "true" : "false"}
                                onChange={(event) => handleStatusChange(camp?._id, event)}
                              >
                                <option className="bg-white" value="true">
                                  Authorize
                                </option>
                                <option className="bg-white" value="false">
                                  Unauthorize
                                </option>
                              </select>
                            </td>

                            <td className="align-center">
                              <Link to={`/volunteerdetails/${camp?._id}`}>
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

export default Volunteer;
