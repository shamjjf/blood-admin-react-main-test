import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Pagination from "../Components/Pagination";
import UserFilter from "../Components/UserFilter";
import { GlobalContext } from "../GlobalContext";
import PageDetails from "../Components/PageDetails";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SEO from "../SEO";
const Users = () => {
  const { setLoading, alert } = useContext(GlobalContext);
  const [users, setUsers] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [genderSelects, setGenderSelects] = useState("All");
  const [bloodGroupSelects, setBloodGroupSelects] = useState("All");
  const [pointsSelects, setPointsSelects] = useState("0");
  const [searchText, setSearchText] = useState("");
  const [kycStatusSelects, setKycStatusSelects] = useState("All");

  const [isLoading, setIsLoading] = useState(true);

  const handelLimit = (e) => {
    setLimit(e);
    setCurrentPage(1);
  };

  const kycBadgeStyle = (status) => {
    const base = { padding: "4px 12px", borderRadius: 12, fontSize: 11, fontWeight: 700, display: "inline-block", minWidth: 70, textAlign: "center" };
    if (status === "verified") return { ...base, background: "#22C55E", color: "#FFFFFF" };
    if (status === "rejected") return { ...base, background: "#EF4444", color: "#FFFFFF" };
    if (status === "pending") return { ...base, background: "#F59E0B", color: "#FFFFFF" };
    return { ...base, background: "#E5E7EB", color: "#6B7280" };
  };

  const kycLabel = (status) => {
    if (status === "verified") return "Accepted";
    if (status === "rejected") return "Rejected";
    if (status === "pending") return "Pending";
    return "None";
  };

  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoading(true);
        let url = `${import.meta.env.VITE_API_URL}/users?n=${limit}&p=${currentPage}&bloodGroup=${encodeURIComponent(
          bloodGroupSelects
        )}&gender=${genderSelects}&points=${pointsSelects}&searchText=${searchText}&kycStatus=${kycStatusSelects}`;

        const res = await axios.get(url, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        });
        const { data, error } = res;
        setUsers(data.users);
        setTotalCount(data.count);
        setTotalPages(Math.ceil(data.count / limit));
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, [limit, currentPage, bloodGroupSelects, pointsSelects, genderSelects, searchText, kycStatusSelects]);

  return (
    <>
      <SEO title="Users" />

      <div className="content-wrapper pt-5">
        <div className="d-flex mb-3 justify-content-between align-items-center">
          <p className="card-title p-0 m-0">Users</p>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              <UserFilter
                bloodGroupSelects={bloodGroupSelects}
                setBloodGroupSelects={setBloodGroupSelects}
                genderSelects={genderSelects}
                setGenderSelects={setGenderSelects}
                pointsSelects={pointsSelects}
                setPointsSelects={setPointsSelects}
                setSearchText={setSearchText}
                kycStatusSelects={kycStatusSelects}
                setKycStatusSelects={setKycStatusSelects}
              />
              {isLoading ? (
                <div className="table-responsive">
                  <table className="table table-hover-removed my-table">
                    <thead id="request-heading">
                      <tr>
                        <th className="align-left">Name</th>
                        <th className="align-left">Mobile Number</th>
                        <th className="align-left">Gender</th>
                        <th className="align-left">Blood Group</th>
                        <th className="align-left">Points</th>
                        <th className="align-left">User Type</th>
                        <th className="align-left">KYC</th>

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
                            <Skeleton height={20} width={80} />
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
                        <th className="align-left">Name</th>
                        <th className="align-left">Mobile Number</th>
                        <th className="align-left">Gender</th>
                        <th className="align-left">Blood Group</th>
                        <th className="align-left">Points</th>
                        <th className="align-left">User Type</th>
                        <th className="align-left">KYC</th>

                        <th className="align-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.length > 0 ? (
                        users.map((user, index) => (
                          <tr key={index}>
                            <td className="align-left">{index + 1}</td>
                            <td className="align-left">{user.name}</td>
                            <td className="align-left">
                              +{user.phoneCode} {user.phone}
                            </td>
                            <td className="align-left">{user.gender}</td>
                            <td className="align-left">{user.bloodGroup}</td>
                            <td className="align-left">{user.points}</td>
                            <td className="align-left text-capitalize">
                              {user.type == "user" ? "Individual" : user.type}
                            </td>
                            <td className="align-left">
                              {user.kyc?.type ? (
                                <span style={kycBadgeStyle(user.kyc.status)}>
                                  {kycLabel(user.kyc.status)}
                                </span>
                              ) : (
                                <span style={kycBadgeStyle()}>None</span>
                              )}
                            </td>
                            <td className="align-center">
                              <Link to={`/user/${user._id}`}>
                                <i className="icons fa-regular fa-eye"></i>
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

export default Users;
