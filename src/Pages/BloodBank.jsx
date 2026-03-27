import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Country, State, City } from "country-state-city";

import Pagination from "../Components/Pagination";
import { GlobalContext } from "../GlobalContext";
import PageDetails from "../Components/PageDetails";
import TasksFilters from "../Components/TasksFilters";

import { formatDate } from "../Components/FormatedDate";
import AddBloodBank from "../Components/AddBloodBank";
import BloodBankFilters from "../Components/BloodBankFilters";
import SEO from "../SEO";

const BloodBank = () => {
  const { setLoading, alert } = useContext(GlobalContext);
  const [tasks, setTasks] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showAddTaskForm, setShowAddTask] = useState(false);
  const [pointsSelects, setPointsSelects] = useState("All");
  const [statusSelects, setStatusSelects] = useState("All");
  const [tasksCategorySelects, setTasksCategorySelects] = useState("All");
  const [searchText, setSearchText] = useState("");

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [countryForURL, setCountryForURL] = useState("");
  const [stateForURL, setStateForURL] = useState("");

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    // Fetch countries on component mount
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      // Fetch states based on selected country
      setStates(State.getStatesOfCountry(selectedCountry)); // Assume this function filters states based on country
    } else {
      setStates([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState) {
      // Fetch cities based on selected state
      // console.log(selectedState);
      setCities(City.getCitiesOfState(selectedCountry, selectedState)); // Assume this function filters cities based on state
    } else {
      setCities([]);
    }
  }, [selectedState]);

  const [isLoading, setIsLoading] = useState(true);
  const handelLimit = (e) => {
    setLimit(e);
    setCurrentPage(1);
  };

  const getData = async () => {
    try {
      // console.log("city", selectedCity);
      // console.log("state", stateForURL);
      // console.log("country", countryForURL);
      setIsLoading(true);
      let url = `${
        import.meta.env.VITE_API_CONTRI
      }/bloodbank?selectedCity=${selectedCity}&stateForURL=${stateForURL}&countryForURL=${countryForURL}&searchText=${searchText}&limit=${limit}&currentPage=${currentPage}`;
      const res = await axios.get(url);
      const { data } = res;

      // console.log("bloodbanks->>>", data);
      setTasks(data.bloodBanks);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / limit));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    getData();
  }, [limit, currentPage, searchText, selectedCity, stateForURL, countryForURL]);
  return (
    <>
      <SEO title="BloodBank" />

      {showAddTaskForm && (
        <div className="add-form-holder d-flex justify-content-center align-items-center">
          <AddBloodBank setShowAddTask={setShowAddTask} getData={getData} />
        </div>
      )}
      <div className="content-wrapper">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <p className="card-title p-0 m-0">Blood Bank</p>
          <button style={{ borderRadius: 5 }} onClick={() => setShowAddTask(true)} className="btn btn-primary">
            <i className="mr-2 fa-solid fa-plus"></i>
            <span>Add Blood Bank</span>
          </button>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="table-card-border">
              <BloodBankFilters
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                selectedState={selectedState}
                setSelectedState={setSelectedState}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                setSearchText={setSearchText}
                countries={countries}
                states={states}
                cities={cities}
                setCountryForURL={setCountryForURL}
                setStateForURL={setStateForURL}
              />

              {isLoading ? (
                <div className="table-responsive ">
                  <table className="table my-table">
                    <thead id="request-heading">
                      <tr className="tableheaders">
                        <th className="align-left">Bank Name</th>
                        <th className="align-left">Mobile Number</th>
                        <th className="align-left">Location</th>
                        <th className="align-left">City</th>
                        <th className="align-left">State</th>
                        <th className="align-left">Country</th>
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
                <div className="table-responsive">
                  <table className="table my-table">
                    <thead id="request-heading">
                      <tr className="tableheaders">
                        <th className="align-left">SR.NO</th>
                        <th className="align-left">Bank Name</th>
                        <th className="align-left">Mobile Number</th>
                        <th className="align-left">Location</th>
                        <th className="align-left">City</th>
                        <th className="align-left">State</th>
                        <th className="align-left">Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks?.length > 0 ? (
                        tasks.map((task, index) => (
                          <tr key={task._id}>
                            <td className="align-left">{index + 1}</td>
                            <td className="align-left">{task.name}</td>
                            <td className="align-left">+{task.contactNunber}</td>
                            <td className="align-left">{task.location}</td>
                            <td className="align-left">{task.city ? task.city : "-"}</td>
                            <td className="align-left">{task.state ? task.state : "-"}</td>
                            <td className="align-left">{task.country ? task.country : "-"}</td>
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

export default BloodBank;
