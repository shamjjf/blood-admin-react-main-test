import axios from "axios";
import { useEffect, useState } from "react";
import { Country, State, City } from "country-state-city";

const BloodBankFilters = ({
  selectedCountry,
  setSelectedCountry,
  selectedState,
  setSelectedState,
  selectedCity,
  setSelectedCity,
  setSearchText,
  countries,
  states,
  cities,
  setCountryForURL,
  setStateForURL,
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
          <div className="input-group pb-2 d-flex align-items-center justify-content-center mb-1 pb-2">
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
        <div className="col-md-3 col-sm-12 d-flex flex-column mb-3 px-2 pt-2 alignit" id="status-dropdown">
          <label htmlFor="points" className="filter-label">
            Country:{" "}
          </label>
          <select
            name="random1"
            id="random1"
            className="dropdown-btn newForsen"
            value={selectedCountry}
            onChange={(e) => {
              const newIsoCode = e.target.value;
              const selectedCountry = countries.find((country) => country.isoCode === newIsoCode);
              setSelectedCountry(newIsoCode);
              //  saving name of country instead of countrycode
              setCountryForURL(selectedCountry.name);
            }}
          >
              <option className="option-style" value="" disabled selected>
              Select Country
            </option>
            {countries.map((country, i) => (
              <option key={i} value={country.isoCode}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3 col-sm-12 d-flex flex-column mb-3 px-2 pt-2 alignit" id="status-dropdown">
          <label htmlFor="points" className="filter-label">
            State:{" "}
          </label>
          <select
            className="dropdown-btn newForsen"
            value={selectedState}
            onChange={(e) => {
              const newStateIsoCode = e.target.value;
              const selectedState = states.find((state) => state.isoCode === newStateIsoCode);
              setSelectedState(newStateIsoCode);
              setStateForURL(selectedState.name);
            }}
            disabled={!selectedCountry} // Disable if no country is selected
          >
            <option className="option-style" value="" disabled selected>
              Select State
            </option>
            {states.map((state, i) => (
              <option key={i} value={state.isoCode}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3 col-sm-12 d-flex flex-column mb-3 px-2 pt-2 alignit" id="blood-dropdown">
          <label htmlFor="b-group" className="filter-label">
            City:{" "}
          </label>
          <select
            name="city"
            id="city"
            className="dropdown-btn newForsen"
            disabled={!selectedState} // Disable if no state is selected
            value={selectedCity}
            onChange={(e) => {
              const newCityIsoCode = e.target.value;

              setSelectedCity(newCityIsoCode);
            }}
          >
            <option value="" disabled selected>
              Select City
            </option>
            {cities.map((city, i) => (
              <option key={i} value={city.isoCode}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default BloodBankFilters;
