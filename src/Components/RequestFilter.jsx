import axios from "axios";
import React from "react";
import { useState } from "react";

const RequestFilter = ({
  bloodSelects,
  setBloodSelects,
  statusSelects,
  setStatusSelects,
  gotUnitsSelects,
  setGotUnitsSelects,
  needUnitsSelects,
  setNeedUnitsSelects,
  setRequests,
  getData,
  requests,
  limit,
  currentPage,
  setTotalCount,
  setTotalPages,
  setSearchText,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const [bloodGroup, setBloodGroup] = useState([
    "All",
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
    "A1+",
    "A1-",
    "A2+",
    "A2-",
    "A1B+",
    "A1B-",
    "A2B+",
    "A2B-",
    "Bombay Blood Group",
    "INRA",
  ]);
  const [status, setStatus] = useState(["All", "Open", "Pending", "Close", "Canceled"]);

  const handleMenuBar = () => {
    setShowMenu(!showMenu);
  };

  const handleBloodChange = (event) => {
    const selectedBloodGroup = event.target.value;
    setBloodSelects(selectedBloodGroup);
  };

  const handleStatusChange = (event) => {
    const selectedStatus = event.target.value;
    setStatusSelects(selectedStatus);
  };

  const debouncedSearch = async (e) => {
    setTimeout(async () => {
      if (e.target.value === "") {
        setSearchText("");
      }
      setSearchText(e.target.value);
    }, 300);
  };

  return (
    <div className="filter-layout">
      <div className="hide-menu">
        <i className="fa-solid fa-sliders" id="bar-icon" onClick={handleMenuBar} />
      </div>
      <div
        className={` row respadding ${showMenu ? "active handle-menubar" : ""}`}
        style={{ paddingRight: "20px", paddingLeft: "20px" }}
      >
        <div className="input-group mb-2 mb-md-0 input-bar col-md-4 col-sm-12  d-flex flex-column align-items-center justify-content-center mtforres lulEEE">
          <div className="customSearch" style={{ paddingTop: "5px" }}>
            <label htmlFor="b-group" className="filter-label">
              Search:
            </label>
          </div>
          <div className="input-group pb-3 d-flex align-items-center justify-content-center ">
            <div className="input-group-prepend hover-cursor" id="navbar-search-icon" style={{ height: "34px" }}>
              <span className="input-group-text" id="search">
                <i className="icon-search"></i>
              </span>
            </div>
            <input
              type="text"
              className="form-control"
              id="navbar-search-input"
              placeholder="Search "
              onChange={debouncedSearch}
              aria-label="search"
              aria-describedby="search"
              style={{ height: "34px" }}
            />
          </div>
        </div>

        <div className="col-md-2 col-sm-6 col-cus-12 d-flex flex-column mb-3 px-2 pt-1 alignit" id="blood-dropdown">
          <label htmlFor="b-group" className="filter-label">
            Blood Groups:{" "}
          </label>
          <select
            value={bloodSelects}
            name="blod-group"
            className="dropdown-btn newForsen"
            id="b-group"
            onChange={(e) => handleBloodChange(e)}
          >
            {bloodGroup.length > 0 &&
              bloodGroup.map((element, index) => (
                <option key={index} value={element}>
                  {element}
                </option>
              ))}
          </select>
        </div>
        <div className="col-md-2 col-sm-6 col-cus-12 d-flex flex-column mb-3 px-2 pt-1 alignit" id="status-dropdown">
          <label htmlFor="status" className="filter-label">
            Request Status:{" "}
          </label>
          <select
            name="status"
            value={statusSelects}
            className="dropdown-btn newForsen"
            id="status"
            onChange={() => {
              handleStatusChange(event);
            }}
          >
            {status.length > 0 &&
              status.map((element, index) => (
                <option key={index} value={element}>
                  {element}
                </option>
              ))}
          </select>
        </div>

        <div className="col-md-2 col-sm-6 col-cus-12 d-flex flex-column mb-3 px-2 pt-1 alignit" id="needunits-dropdown">
          <label htmlFor="need-units" className="filter-label">
            Units Needed:{" "}
          </label>
          <select
            name="need-units"
            value={needUnitsSelects}
            className="dropdown-btn newForsen"
            id="need-units"
            onChange={(e) => {
              setNeedUnitsSelects(e.target.value);
            }}
          >
            <option value="All">All</option>
            <option value="-1">High To Low</option>
            <option value="1">Low To High</option>
          </select>
        </div>
        <div className="col-md-2 col-sm-6 col-cus-12 d-flex flex-column mb-3 px-2 pt-1 alignit" id="gotunits-dropdown">
          <label htmlFor="got-units" className="filter-label">
            Units Received:{" "}
          </label>
          <select
            name="got-units"
            value={gotUnitsSelects}
            className="dropdown-btn newForsen"
            id="got-units"
            onChange={(e) => {
              setGotUnitsSelects(e.target.value);
            }}
          >
            <option value="All">All</option>
            <option value="-1">High To Low</option>
            <option value="1">Low To High</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default RequestFilter;
