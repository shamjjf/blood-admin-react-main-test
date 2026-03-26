import axios from "axios";
import { useEffect, useState } from "react";

const TasksFilters = ({
  pointsSelects,
  setPointsSelects,
  statusSelects,
  setStatusSelects,
  tasksCategorySelects,
  setTasksCategorySelects,
  setSearchText,
}) => {
  const [taskCategory, setTaskCategory] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const [status, setStatus] = useState(["All", "Open", "Pending", "Closed"]);
  useEffect(() => {
    const getCategories = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/gettaskcategories`, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        });
        const { data } = res;
        // console.log("categories------------>", data);
        setTaskCategory(data.categories);
      } catch (error) {
        console.log(error);
      }
    };
    getCategories();
  }, []);

  const handleMenuBar = () => {
    setShowMenu(!showMenu);
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
        className={`row respadding ${showMenu ? "active handle-menubar" : ""}`}
        style={{ paddingRight: "20px", paddingLeft: "20px" }}
      >
        <div className="input-group mb-2 mb-md-0 input-bar col-md-3 col-sm-12 d-flex flex-column align-items-center justify-content-center mtforres lulEEE">
          <div className="customSearch" style={{ paddingTop: "5px" }}>
            <label htmlFor="b-group" className="filter-label">
              Search:
            </label>
          </div>
          <div className="input-group pb-3 d-flex align-items-center justify-content-center">
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
            Status:{" "}
          </label>
          <select
            name="status"
            value={statusSelects}
            className="dropdown-btn newForsen"
            id="b-group"
            onChange={() => handleStatusChange(event)}
          >
            {status.length > 0 &&
              status.map((element, index) => (
                <option key={index} value={element}>
                  {element}
                </option>
              ))}
          </select>
        </div>
        <div className="col-md-3 col-sm-12 d-flex flex-column mb-3 px-2 pt-2 alignit" id="status-dropdown">
          <label htmlFor="points" className="filter-label">
            Task Category:{" "}
          </label>
          <select
            name="task-category"
            value={tasksCategorySelects}
            className="dropdown-btn newForsen"
            id="status"
            onChange={(e) => {
              setTasksCategorySelects(e.target.value);
            }}
          >
            <option value={"All"}>All</option>
            {taskCategory &&
              taskCategory.length > 0 &&
              taskCategory.map((element, index) => (
                <option key={index} value={element._id}>
                  {element.title}
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
            onChange={(e) => {
              setPointsSelects(e.target.value);
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

export default TasksFilters;
