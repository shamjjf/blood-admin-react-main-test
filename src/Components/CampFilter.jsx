import React, { useState } from "react";

const CampFilter = ({
  setSearchText,
  setDonorsExpected,
  setStartDate,
  setEndDate,
  searchText,
  startDate,
  endDate,
  donorsExpected,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuBar = () => {
    setShowMenu(!showMenu);
  };

  const handleStartDate = (event) => {
    const selectedStartDate = event.target.value;

    setStartDate(selectedStartDate);
  };
  const handleEndDate = (event) => {
    const selectedEndDate = event.target.value;

    setEndDate(selectedEndDate);
  };

  const handleExpectedDonors = (event) => {
    const selectedExpectedDonors = event.target.value;
    setDonorsExpected(selectedExpectedDonors);
  };

  const debouncedSearch = async (e) => {
    setTimeout(() => {
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
        <div className="input-group mb-2 mb-md-0 input-bar col-md-3 col-sm-12  d-flex flex-column align-items-center justify-content-center mtforres lulEEE">
          <div className="customSearch" style={{ paddingTop: "5px" }}>
            <label htmlFor="b-group" className="filter-label">
              Search:
            </label>
          </div>
          <div className="input-group point8rem d-flex align-items-center justify-content-center">
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
        <div className="col-md-3 col-sm-12 d-flex flex-column mb-3 px-2 pt-2 alignit" id="blood-dropdown">
          <label htmlFor="b-group" className="filter-label">
            Start Date:{" "}
          </label>
          <input
            type="date"
            name="date"
            className="dropdown-btn newForsen "
            value={startDate}
            id="b-group"
            onChange={(event) => handleStartDate(event)}
            style={{ height: "34px" }}
          />
        </div>
        <div className="col-md-3 col-sm-12 d-flex flex-column mb-3 px-2 pt-2 alignit" id="blood-dropdown">
          <label htmlFor="b-group" className="filter-label">
            End Date:{" "}
          </label>
          <input
            type="date"
            name="date"
            className="dropdown-btn newForsen "
            value={endDate}
            id="b-group"
            onChange={(event) => handleEndDate(event)}
            style={{ height: "34px" }}
          />
        </div>
        <div className="col-md-3 col-sm-12 d-flex flex-column mb-3 px-2 pt-2 alignit" id="status-dropdown">
          <label htmlFor="expecteddonors" className="filter-label">
            Donors Expected:{" "}
          </label>
          <select
            name="expecteddonors"
            value={donorsExpected}
            className="dropdown-btn newForsen"
            id="status"
            onChange={(event) => {
              handleExpectedDonors(event);
            }}
          >
            <option value="">All</option>
            <option value={1}>Low To High</option>
            <option value={-1}>High To Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CampFilter;
