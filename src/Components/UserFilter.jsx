import React, { useState } from "react";

const UserFilter = ({
  bloodGroupSelects,
  setBloodGroupSelects,
  genderSelects,
  setGenderSelects,
  pointsSelects,
  setPointsSelects,
  setSearchText,
}) => {
  const [gender, setGender] = useState(["All", "Male", "Female"]);
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
    "Don't Know",
  ]);

  const [showMenu, setShowMenu] = useState(false);

  const handleMenuBar = () => {
    setShowMenu(!showMenu);
  };

  const handleBloodChange = (event) => {
    const selectedBloodGroup = event.target.value;
    // console.log(selectedBloodGroup);
    setBloodGroupSelects(selectedBloodGroup);
  };
  const handleGenderChange = (event) => {
    const selectedGender = event.target.value;
    setGenderSelects(selectedGender);
  };
  const handlePointsChange = (event) => {
    const selectedPoints = event.target.value;
    setPointsSelects(selectedPoints);
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
            Blood Groups:{" "}
          </label>
          <select
            name="blod-group"
            className="dropdown-btn newForsen"
            value={bloodGroupSelects}
            id="b-group"
            onChange={(event) => handleBloodChange(event)}
          >
            {bloodGroup &&
              bloodGroup.map((element, index) => (
                <option key={index} value={element}>
                  {element}
                </option>
              ))}
          </select>
        </div>
        <div className="col-md-3 col-sm-12 d-flex flex-column mb-3 px-2 pt-2 alignit" id="needunits-dropdown">
          <label htmlFor="gender" className="filter-label">
            Gender:{" "}
          </label>
          <select
            name="gender"
            value={genderSelects}
            className="dropdown-btn newForsen"
            id="need-units"
            onChange={(event) => {
              handleGenderChange(event);
            }}
          >
            {gender &&
              gender.map((element, index) => (
                <option key={index} value={element}>
                  {element}
                </option>
              ))}
          </select>
        </div>
        <div className="col-md-3 col-sm-12 d-flex flex-column mb-3 px-2 pt-2 alignit" id="status-dropdown">
          <label htmlFor="points" className="filter-label">
            Points:{" "}
          </label>
          <select
            name="points"
            value={pointsSelects}
            className="dropdown-btn newForsen"
            id="status"
            onChange={(event) => {
              handlePointsChange(event);
            }}
          >
            <option value={0}>All</option>
            <option value={1}>Low To High</option>
            <option value={-1}>High To Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default UserFilter;
