import React, { useState } from "react";

const VolunteerFilter = ({ setSearchText, statusA, setStatusA }) => {
  const [status, setStatus] = useState([
    { value: "All", name: "All" },
    { value: "verified", name: "Authorized" },
    { value: "not verified", name: "Unauthorized" },
  ]);

  const [showMenu, setShowMenu] = useState(false);

  const handleMenuBar = () => {
    setShowMenu(!showMenu);
  };

  const handleStatusChange = (event) => {
    const selectedStatus = event.target.value;

    setStatusA(selectedStatus);
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
      <div className={` row respadding ${showMenu ? "active handle-menubar" : ""}`} style={{ paddingRight: "20px" }}>
        <div className="input-group mb-2 mb-md-0 input-bar col-md-6 col-sm-12  d-flex flex-column align-items-center justify-content-center mtforres lulEEE">
        <div className="customSearch" style={{ paddingTop: "5px" }}>

          <label htmlFor="b-group" className="filter-label" style={{ paddingTop: "5px" }}>
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
        <div className="col-md-6 col-sm-12 d-flex flex-column mb-3 px-2 pt-2 alignit" id="blood-dropdown">
          <label htmlFor="b-group" className="filter-label">
            Status:{" "}
          </label>
          <select
            name="blod-group"
            className="dropdown-btn newForsen"
            value={statusA}
            id="b-group"
            onChange={(event) => handleStatusChange(event)}
          >
            {status &&
              status.map((element, index) => (
                <option key={index} value={element?.value}>
                  {element?.name}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default VolunteerFilter;
