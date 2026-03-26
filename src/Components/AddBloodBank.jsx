import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { GlobalContext } from "../GlobalContext";
import { Country, State, City } from "country-state-city";

const AddBloodBank = ({ setShowAddTask, getData }) => {
  const { dispatch, setLoading, alert } = useContext(GlobalContext);
  const [phoneError, setPhoneError] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    phoneCode: "",
    phone: "",
    country: "india",
  });
  const [errors, setErrors] = useState({});

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState("IN");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

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
      setCities(City.getCitiesOfState(selectedCountry, selectedState)); // Assume this function filters cities based on state
    } else {
      setCities([]);
    }
  }, [selectedState]);

  const validateForm = () => {
    let errors = {};
    let isValid = true;
    // console.log(formData,!formData?.state );
    // Validation for name
    if (!formData.name || formData.name.length < 3) {
      errors.name = "Full name must have minimum 3 letters.";
      isValid = false;
    }

    // Validation for email
    if (!formData.location) {
      errors.location = "Area is required.";
      isValid = false;
    }
    if (!formData?.city || formData.city == "Select City") {
      errors.city = "City is required.";
      isValid = false;
    }
    if (!formData?.state || formData.state == "Select State") {
      errors.state = "State is required.";
      isValid = false;
    }
    if (!formData?.country || formData.country == "Select Country") {
      errors.country = "Country is required.";
      isValid = false;
    }

    // Validation for phone
    if (!formData.phone) {
      errors.phone = "Phone number is required.";
      isValid = false;
    } else if (phoneError) {
      errors.phone = "Invalid Phone Number Format.";
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      if (value.length > 20) {
        swal("Error!", "Name cannot exceed 20 characters!", "error");
      }
    }
    if (name === "location") {
      if (value.length > 150) {
        swal("Error!", "Location cannot exceed 150 characters!", "error");
      }
    }
    if (name === "city") {
      if (value.length > 20) {
        swal("Error!", "City cannot exceed 20 characters!", "error");
      }
    }
    if (name === "state") {
      if (value.length > 20) {
        swal("Error!", "State cannot exceed 20 characters!", "error");
      }
    }
    if (name === "country") {
      if (value.length > 20) {
        swal("Error!", "Country cannot exceed 20 characters!", "error");
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setLoading(true);
        const res = await axios.post(`${import.meta.env.VITE_API_CONTRI}/bloodbank`, formData);
        const { data, error } = res;

        swal("Success!", "Blood Bank Added Successfully!", "success");
        setShowAddTask(false);
        getData();
      } catch (error) {
        console.log(error);
        setShowAddTask(false);

        if (error.response?.data?.error.includes("phone_1")) {
          swal("Error!", "Phone number already exists", "error");
        }
        if (error.response?.data?.error.includes("emailId_1")) {
          swal("Error!", "Email already exists", "error");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="myupdatedcard ">
      <div className="card-body">
        <div className="d-flex align-item-center justify-content-between">
          <h4 className="card-title">Add Blood Bank</h4>
          <button onClick={() => setShowAddTask(false)} className="btn btn-danger btn-rounded btn-icon cusing">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form className="forms-sample" onSubmit={handleSubmit}>
          <div className="d-flex flex-wrap col-12 col-md-12 p-0 m-0">
            <div className="form-grou col-12 col-lg-6  mb-4">
              <label htmlFor="random2">
                Blood Bank Name<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control form-control-lg ${errors.name && "is-invalid"}`}
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Name"
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>
            <div className="form-grou col-12 col-lg-6  mb-4">
              <label htmlFor="random2">
                Location<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control form-control-lg ${errors.location && "is-invalid"}`}
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Area"
              />
              {errors.location && <div className="invalid-feedback">{errors.location}</div>}
            </div>

            <div className="form-grou col-12 col-lg-6  mb-4">
              <label htmlFor="random1">
                Select Country<span className="text-danger">*</span>
              </label>
              <select
                name="random1"
                id="random1"
                className="form-control form-control-lg "
                value={selectedCountry}
                style={{
                  backgroundImage:
                    'url(\'data:image/svg+xml;utf8,<svg fill="black" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>\')',
                  backgroundRepeat: "no-repeat", // Fixed typo here: backgroud -> background
                  backgroundPositionX: "98%",
                  backgroundPositionY: "12px",
                }}
                onChange={(e) => {
                  const newIsoCode = e.target.value;
                  const selectedCountry = countries.find((country) => country.isoCode === newIsoCode);
                  setSelectedCountry(newIsoCode);
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    country: selectedCountry ? selectedCountry.name : "", // Set country name or empty string if not found
                  }));
                }}
              >
                {countries.map((country, i) => (
                  <option key={i} value={country.isoCode}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-grou col-12 col-lg-6  mb-4">
              <label htmlFor="random2">
                Select State<span className="text-danger">*</span>
              </label>
              <select
                name="random2"
                id="random2"
                className={`form-control form-control-lg ${errors.state && "is-invalid border border-danger"}`}
                value={selectedState}
                style={{
                  backgroundImage:
                    'url(\'data:image/svg+xml;utf8,<svg fill="black" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>\')',
                  backgroundRepeat: "no-repeat", // Fixed typo here: backgroud -> background
                  backgroundPositionX: "98%",
                  backgroundPositionY: "12px",
                }}
                onChange={(e) => {
                  const newStateIsoCode = e.target.value;
                  const selectedState = states.find((state) => state.isoCode === newStateIsoCode);
                  setSelectedState(newStateIsoCode);
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    state: selectedState ? selectedState.name : "", // Set state name or empty string if not found
                  }));
                }}
                disabled={!selectedCountry} // Disable if no country is selected
              >
                <option value="Select State">Select State</option>

                {states.map((state, i) => (
                  <option key={i} value={state.isoCode}>
                    {state.name}
                  </option>
                ))}
              </select>

              {errors.state && <div className="invalid-feedback">{errors.state}</div>}
            </div>
            <div className="form-grou col-12 col-lg-6  mb-4">
              <label htmlFor="city">
                Select City<span className="text-danger">*</span>
              </label>
              <select
                name="city"
                id="city"
                className={`form-control form-control-lg ${errors.city && "is-invalid border border-danger"}`}
                disabled={!selectedState} // Disable if no state is selected
                value={selectedCity || "Select State"}
                style={{
                  backgroundImage:
                    'url(\'data:image/svg+xml;utf8,<svg fill="black" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>\')',
                  backgroundRepeat: "no-repeat", // Fixed typo here: backgroud -> background
                  backgroundPositionX: "98%",
                  backgroundPositionY: "12px",
                }}
                onChange={(e) => {
                  const newCityIsoCode = e.target.value;

                  setSelectedCity(newCityIsoCode);
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    city: newCityIsoCode ? newCityIsoCode : "", // Set state name or empty string if not found
                  }));
                }}
              >
                <option value="Select City">Select City</option>
                {cities.map((city, i) => (
                  <option key={i} value={city.isoCode}>
                    {city.name}
                  </option>
                ))}
              </select>
              {errors.city && <div className="invalid-feedback">{errors.city}</div>}
            </div>
            <div className="form-grou col-12 col-lg-6  mb-4">
              <label htmlFor="random2">
                Mobile Number<span className="text-danger">*</span>
              </label>
              <PhoneInput
                preferredCountries={["in"]}
                placeholder="+91 12345-67890"
                buttonStyle={{
                  width: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                country={"in"}
                inputStyle={{
                  width: "100%",
                  height: "50px",
                }}
                onChange={(value, country, e, formattedValue) => {
                  if (country.format.length === formattedValue.length) {
                    setPhoneError(false);
                  } else {
                    setPhoneError(true);
                  }
                  const phone = formattedValue.split(" ");
                  const newphone = phone
                    .filter((ph, i) => i !== 0)
                    .join("")
                    .replace("-", "");
                  setFormData({
                    ...formData,
                    phoneCode: country.dialCode,
                    phone: newphone,
                  });
                }}
              />
              {errors.phone && <div className="text-danger">{errors.phone}</div>}
            </div>
          </div>
          <div className="addtask-btn gap-4 ">
            <button onClick={() => setShowAddTask(false)} className="btn  btn-outline-secondary ">
              Cancel
            </button>
            <button type="submit" className="btn  btn-primary ">
              Add Blood Bank
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBloodBank;
