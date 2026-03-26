import React, { useState } from "react";

const BulkUserFilter = ({ specialUsers, selectedUser, setSelectedUser, statusA, setStatusA }) => {
  const [status, setStatus] = useState(["All", "Approved", "Denied", "Pending"]);

  const [showMenu, setShowMenu] = useState(false);

  const handleMenuBar = () => {
    setShowMenu(!showMenu);
  };

  const handleStatusChange = (event) => {
    const selectedStatus = event.target.value;

    setStatusA(selectedStatus);
  };
  const handleSpecialUserChange = (event) => {
    const selectedSpecialUser = event.target.value;

    setSelectedUser(selectedSpecialUser);
  };

  //   const debouncedSearch = async (e) => {
  //     setTimeout(() => {
  //       if (e.target.value === "") {
  //         setSearchText("");
  //       }
  //       setSearchText(e.target.value);
  //     }, 300);
  //   };

  return (
    <div className="filter-layout">
      <div className="hide-menu">
        <i className="fa-solid fa-sliders" id="bar-icon" onClick={handleMenuBar} />
      </div>
      <div className={` row respadding ${showMenu ? "active handle-menubar" : ""}`} style={{ paddingRight: "20px" }}>
        <div className="input-group mb-2 mb-md-0 input-bar col-md-6 col-sm-12  d-flex flex-column align-items-center justify-content-center mtforres lulEEE">
        <div className="customSearch" style={{ paddingTop: "5px" }}>

          <label htmlFor="b-group" className="filter-label" style={{ paddingTop: "5px" }}>
            Special user:
          </label>
          </div>
          <div className="input-group point8rem d-flex align-items-center justify-content-center">
            <select
              name="blod-group"
              className="dropdown-btn newForsen w-100"
              value={selectedUser}
              id="b-group"
              onChange={(event) => handleSpecialUserChange(event)}
            >
              <option value="">All</option>
              {specialUsers &&
                specialUsers.map((element, index) => (
                  <option key={index} value={element._id}>
                    {element.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="col-md-6 col-sm-12 d-flex flex-column mb-3 px-2 pt-2 alignit" id="blood-dropdown">
          <label htmlFor="b-group" className="filter-label">
            Status :{" "}
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
                <option
                  key={index}
                  value={
                    element === "Approved"
                      ? "approved"
                      : element === "Denied"
                      ? "denied"
                      : element === "Pending"
                      ? "init"
                      : ""
                  }
                >
                  {element}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default BulkUserFilter;
