import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Pagination from "../Components/Pagination";
import PageDetails from "../Components/PageDetails";
import { GlobalContext } from "../GlobalContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import ContributionFilter from "../Components/ContrubutionFilter";
import AddContribution from "../Components/AddContribution";
import SEO from "../SEO";

const Contribution = () => {
  const [contributions, setContributions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showAddContributionForm, setShowAddContributionForm] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const { setLoading } = useContext(GlobalContext);
  const [isLoading, setIsLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const [contributionType, setContributionType] = useState("All");
  const [searchText, setSearchText] = useState("");

  const handelLimit = (e) => {
    setLimit(e);
    setCurrentPage(1);
  };

  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(
          `${
            import.meta.env.VITE_API_CONTRI
          }/contributionreqadmin?contributionType=${contributionType}&searchText=${searchText}&currentPage=${currentPage}&limit=${limit}`
        );

        // console.log(res);

        setTotalCount(res.data.totalCount);
        setTotalPages(Math.ceil(res.data.totalCount / limit));

        // const filteredForEmptytotal = res.data.requests.filter(
        //   (contri) => contri.grandTotal !== 0
        // );

        const filteredForEmptytotal = res.data.requests;

        // console.log(filteredForEmptytotal);

        setContributions(filteredForEmptytotal);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, [contributionType, searchText, limit, currentPage, refresh]);
  console.log(refresh);
  const navigate = useNavigate();
  return (
    <>
      <SEO title="Contribution" />

      {showAddContributionForm && (
        <div className="add-form-holder d-flex justify-content-center align-items-center">
          {" "}
          <AddContribution setShowAddContributionForm={setShowAddContributionForm} setRefresh={setRefresh} />
        </div>
      )}
      <div className="content-wrapper">
        <div className="d-flex mb-3 justify-content-between align-items-center">
          <p className="card-title p-0 m-0">Contribution</p>
          <div className="d-flex gap-3">
            <button
              onClick={() => navigate("/vendor")}
              style={{
                borderRadius: 5,
              }}
              className="btn btn-outline-primary"
            >
              <span>Manage Vendor</span>
            </button>
            <button
              onClick={() => setShowAddContributionForm(true)}
              style={{
                borderRadius: 5,
              }}
              className="btn btn-primary"
            >
              <i className="mr-2 fa-solid fa-plus"></i>
              <span>Add Contribution Request</span>
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              <ContributionFilter
                setContributionType={setContributionType}
                contributionType={contributionType}
                setSearchText={setSearchText}
                searchText={searchText}
              />
              {isLoading ? (
                <div className="table-responsive">
                  <table className="table table-hover-removed">
                    <thead id="request-heading">
                      <tr>
                        <th className="align-left">Title</th>
                        <th className="align-left">Contribution Type</th>
                        <th className="align-left">Vendor</th>
                        <th className="align-left">Requested Items</th>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover-removed">
                    <thead id="request-heading">
                      <tr>
                        <th className="align-left">SR.NO</th>
                        <th className="align-left">Title</th>
                        <th className="align-left">Contribution Type</th>
                        <th className="align-left">Vendor</th>
                        <th className="align-left">Requested Items</th>
                        <th className="align-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contributions?.length > 0 ? (
                        contributions.map((eachContribution, index) => (
                          <tr key={index}>
                            <td className="align-left">{index + 1}</td>
                            <td className="align-left">{eachContribution.title}</td>
                            <td className="align-left">{eachContribution.type}</td>
                            <td className="align-left">
                              {eachContribution.vendor[0]?.shopName ? eachContribution.vendor[0]?.shopName : "-"}
                            </td>

                            <td className="align-left">
                              {eachContribution.requestedItems.map((reqitem, index) => (
                                <div
                                  key={index}
                                  className="d-flex justify-content-between align-items-center bg-light text-primary px-3 py-2 my-2 border border-primary"
                                  style={{
                                    borderRadius: 5,
                                    border: "1px solid #ddd",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: "600",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {reqitem.itemName}
                                  </span>
                                </div>
                              ))}
                            </td>

                            <td className="align-center">
                              <Link
                                to={
                                  eachContribution.type === "vendor"
                                    ? `/contribution/${eachContribution._id}`
                                    : `/contributionNorm/${eachContribution._id}`
                                }
                              >
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

export default Contribution;
