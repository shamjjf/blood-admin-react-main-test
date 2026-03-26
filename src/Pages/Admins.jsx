import { useContext, useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../Components/Pagination";
import { GlobalContext } from "../GlobalContext";
import PageDetails from "../Components/PageDetails";
import swal from "sweetalert";
import AddAdmin from "../Components/AddAdmin";
import Dropdown from "../Components/Dropdown";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SEO from "../SEO";
import SearchFilter from "../Components/SearchFilter";

const Admins = () => {
  const [admins, setAdmins] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { setLoading, alert } = useContext(GlobalContext);
  const [totalCount, setTotalCount] = useState(0);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const handelLimit = (e) => {
    setLimit(e);
    setCurrentPage(1);
  };

  const getData = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/admins?n=${limit}&p=${currentPage}&searchText=${searchText}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );
      const { data, error } = res;
      setAdmins(data.admins);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    getData();
  }, [refresh, searchText]);

  const handelDelete = async (id) => {
    try {
      setLoading(true);
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/deleteAdmin/${id}`, {
        headers: {
          Authorization: sessionStorage.getItem("auth"),
        },
      });
      if (res.status === 200) {
        swal("Success!", "Admin deleted Successfully!", "success");
        setRefresh(!refresh);
      } else {
        alert({ type: "danger", title: "Error!", text: res.statusText });
      }
    } catch (error) {
      alert({
        type: "danger",
        title: "Error!",
        text: error.response.data.error,
      });
    } finally {
      setLoading(false);
    }
  };

  const handelVerify = async (id) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("auth");
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/verifyAdmin/${id}`,
        {},
        {
          headers: {
            Authorization: token,
          },
        }
      );
      if (res.status === 200) {
        swal("Success!", "Admin Verified Successfully!", "success");
        setRefresh(!refresh);
      } else {
        alert({ type: "danger", title: "Error!", text: res.statusText });
      }
    } catch (error) {
      alert({
        type: "danger",
        title: "Error!",
        text: error.response.data.error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Admins" />

      {showAdminForm && (
        <div className="add-form-holder d-flex justify-content-center align-items-center">
          {" "}
          <AddAdmin setShowAdminForm={setShowAdminForm} getData={getData} />
        </div>
      )}
      <div className="content-wrapper">
        <div className="d-flex mb-3 justify-content-between align-items-center">
          <p className="card-title p-0 m-0">Admins</p>

          <button
            onClick={() => setShowAdminForm(true)}
            style={{
              borderRadius: 5,
            }}
            className="btn btn-primary"
          >
            <i className="mr-2 fa-solid fa-plus"></i>
            <span>Add Admin</span>
          </button>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              <SearchFilter setSearchText={setSearchText} />

              {isLoading ? (
                <div className="table-responsive">
                  <table className="table table-hover-removed">
                    <thead id="request-heading">
                      <tr>
                        <th className="align-left">Name</th>
                        <th className="align-left">Mobile Number</th>
                        <th className="align-left">Email ID</th>
                        <th className="align-left">Verified</th>
                        <th className="align-left">Roles</th>
                        <th className="align-center">Action</th>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ overflowY: "visible", overflowX: "auto", position: "static" }} className="">
                  <table className="table table-hover-removed">
                    <thead id="request-heading">
                      <tr>
                        <th className="align-left">SR.NO</th>
                        <th className="align-left">Name</th>
                        <th className="align-left">Mobile Number</th>
                        <th className="align-left">Email ID</th>
                        <th className="align-left">Verified</th>
                        <th className="align-left">Roles</th>
                        <th className="align-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins?.length > 0 ? (
                        admins.map((admin, index) => (
                          <tr key={index}>
                            <td className="align-left">{index + 1}</td>
                            <td className="align-left">{admin.name}</td>
                            <td className="align-left">
                              +{admin.phoneCode} {admin.phone}
                            </td>
                            <td className="align-left">{admin.emailId}</td>
                            <td className="align-left">
                              <label className={`badge ${admin.verified ? "badge-success" : "badge-warning"}`}>
                                {admin.verified ? "YES" : "NO"}
                              </label>
                            </td>

                            <td className="align-left ">
                              <Dropdown adminId={admin._id} roles={admin.roles} />
                            </td>

                            {admin.verified ? (
                              <td className="align-center" onClick={() => handelDelete(admin._id)}>
                                <label className="icons badge badge-danger">Delete</label>
                              </td>
                            ) : (
                              <td className="align-center" onClick={() => handelVerify(admin._id)}>
                                <label className="icons badge badge-success">Verify</label>
                              </td>
                            )}
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

export default Admins;
