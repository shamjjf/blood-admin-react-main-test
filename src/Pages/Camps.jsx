import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import Pagination from "../Components/Pagination";
import RequestFilter from "../Components/RequestFilter";
import PageDetails from "../Components/PageDetails";
import { GlobalContext } from "../GlobalContext";
import moment from "moment";
import CampFilter from "../Components/CampFilter";
import SEO from "../SEO";

const Camps = () => {
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

  const handelLimit = (e) => {
    setLimit(e);
    setCurrentPage(1);
  };

  const getData = async () => {
    try {
      setIsLoading(true);

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_CAMPS
        }/camp?searchText=${searchText}&donorsExpected=${donorsExpected}&startDate=${startDate}&endDate=${endDate}&n=${limit}&p=${currentPage}`
      );

      // console.log(response);
      setCamps(response.data.bloodCamps);

      setTotalCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / limit));
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
                        <th className="align-left">Donors Expected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {camps?.length > 0 ? (
                        camps.map((camp, index) => (
                          <tr key={index}>
                            <td className="align-left">{index + 1}</td>
                            <td className="align-left">{camp.organizerName}</td>
                            <td className="align-left">{camp.organizerEmailId}</td>
                            <td className="align-center wrap-text">{camp.location}</td>
                            <td className="align-left">{camp.purpose}</td>
                            <td className="align-left">
                              {camp.venueDate ? moment(camp.venueDate).format("DD-MM-YYYY") : "-"}
                            </td>
                            <td className="align-left">{camp.venueTime ? camp.venueTime : "-"}</td>
                            <td className="align-center">{camp.donorsExpected}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="">
                          <td colSpan={8} className="align-center ">
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

export default Camps;
