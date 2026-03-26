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
import AddVendor from "../Components/AddVendor";
import SearchFilter from "../Components/SearchFilter";

const Vendor = () => {
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
          import.meta.env.VITE_API_CONTRI
        }/vendor?searchText=${searchText}&statusA=${statusA}&n=${limit}&p=${currentPage}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );

      setCamps(response.data?.vendors);
      setTotalCount(response.data?.count);
      setTotalPages(Math.ceil(response.data?.count / limit));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);
  useEffect(() => {
    getData();
  }, [flag, statusA, searchText, limit, currentPage, showAddVendorForm]);

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
  const [viewData, setViewData] = useState("");

  return (
    <>
      <SEO title="Volunteer" />
      {showAddVendorForm && (
        <div className="add-form-holder d-flex justify-content-center align-items-center">
          {" "}
          <AddVendor setShowAddVendorForm={setShowAddVendorForm} viewData={viewData} setViewData={setViewData} />
        </div>
      )}
      <div className="content-wrapper">
        <div className="d-flex mb-3 justify-content-between align-items-center">
          <p className="card-title p-0 m-0">Vendor</p>

          <button
            onClick={() => setShowAddVendorForm(true)}
            style={{
              borderRadius: 5,
            }}
            className="btn btn-primary"
          >
            <i className="mr-2 fa-solid fa-plus"></i>
            <span>Add Vendor</span>
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              {/* <VolunteerFilter
          statusA={statusA}
          setStatusA={setStatusA}
          searchText={searchText}
          setSearchText={setSearchText}
        /> */}
              <SearchFilter setSearchText={setSearchText} />

              {isLoading ? (
                <div className="table-responsive ">
                  <table className="table table-hover-removed my-table">
                    <thead id="request-heading">
                      <tr>
                        <th className="align-left">Shop Name</th>
                        <th className="align-left">Owner Name</th>
                        <th className="align-left">Mobile Number</th>
                        <th className="align-left">Shop Address</th>
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
                        <th className="align-left">Shop Name</th>
                        <th className="align-left">Owner Name</th>
                        <th className="align-left">Mobile Number</th>
                        <th className="align-left">Shop Address</th>
                        <th className="align-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {camps?.length > 0 ? (
                        camps.map((camp, index) => (
                          <tr key={index}>
                            <td className="align-left">{index + 1}</td>
                            <td className="align-left">{camp?.shopName}</td>
                            <td className="align-left">{camp?.ownerName}</td>
                            <td className="align-center wrap-text">{camp?.mobileNumber}</td>
                            <td className="align-left">{camp?.shopAddress}</td>

                            <td className="align-center">
                              <i
                                onClick={() => {
                                  setShowAddVendorForm(true);
                                  setViewData(camp);
                                }}
                                className="icons fa-regular fa-eye view-icon hover-opacity"
                              ></i>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="align-left" colSpan={6}>
                            <p className="m-5 p-5 fs-4">No Data Found</p>{" "}
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

export default Vendor;
