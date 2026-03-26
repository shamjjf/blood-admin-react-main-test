import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";
import PhoneInput from "react-phone-input-2";
import swal from "sweetalert";
import { formatDate } from "../Components/FormatedDate";
import SEO from "../SEO";

const UserDetails = () => {
  const [avaURL, setavaURL] = useState(null);
  const [user, setUser] = useState({
    name: "",
    homeaddress: { text: "" },
    officeaddress: { text: "" },
    homeAddress: "",
    officeAddress: "",
    userType: "User",
    donationType: "Blood",
    phone: "",
    phoneCode: "",
    email: "",
    dob: "",
    points: "",
    weight: "",
    gender: "",
    bloodGroup: "A+",
    isAvailable: false,
    hasTattoo: false,
    hasHIV: false,
    wannaVolunteer: false,
    userProfileSkipped: false,
    volunteerProfileSkipped: false,
    setting: {
      dateFormat: "",
      timeFormat: "",
      timeZone: "",
    },
  });
  // const [user, setUser] = useState({})
  const { setLoading, auth, alert } = useContext(GlobalContext);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const { id } = useParams();
  const [phoneError, setPhoneError] = useState(false);

  const [open1, setOpen1] = useState(false);
  const dropdownRef1 = useRef();
  const [open2, setOpen2] = useState(false);
  const dropdownRef2 = useRef();
  const [open3, setOpen3] = useState(false);
  const dropdownRef3 = useRef();

  // location states
  const [address, setAddress] = useState([]);
  const [address1, setAddress1] = useState([]);
  const [tid, setTid] = useState(0);

  const dateFormatOptions = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD", "MM-DD-YYYY", "DD-MM-YYYY", "YYYY-MM-DD"];

  const timeFormatOptions = ["12hrs", "24hrs"];

  const timeZoneOptions = [
    "(UTC-12:00) International Date Line West",
    "(UTC-11:00) Coordinated Universal Time-11",
    "(UTC-10:00) Hawaii",
    "(UTC-09:00) Alaska",
    "(UTC-08:00) Pacific Time (US & Canada)",
    "(UTC-07:00) Mountain Time (US & Canada)",
    "(UTC-06:00) Central Time (US & Canada)",
    "(UTC-05:00) Eastern Time (US & Canada)",
    "(UTC) Coordinated Universal Time",
    "(UTC+01:00) Amsterdam, Berlin, Rome, Vienna",
    "(UTC+02:00) Athens, Bucharest",
    "(UTC+03:00) Moscow, St. Petersburg, Volgograd",
    "(UTC+04:00) Abu Dhabi, Muscat",
    "(UTC+05:00) Islamabad, Karachi",
    "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi",
    "(UTC+06:00) Dhaka",
    "(UTC+07:00) Bangkok, Hanoi, Jakarta",
    "(UTC+08:00) Beijing, Hong Kong, Singapore",
    "(UTC+09:00) Osaka, Sapporo, Tokyo",
    "(UTC+10:00) Canberra, Melbourne, Sydney",
    "(UTC+11:00) Solomon Is., New Caledonia",
    "(UTC+12:00) Auckland, Wellington",
  ];

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/${id}`, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        });
        const { data } = res;
        // if (!isValidUser(data.data.user)) {
        //   throw new Error("Invalid user data");
        // }

        const userData = data.data.user;

        setUser((prevUser) => ({
          ...prevUser,
          ...userData,
          homeAddress: userData?.homeaddress?.text,
          officeAddress: userData?.officeaddress?.text,
        }));
        setavaURL(userData?.avatar?.url);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    // const isValidUser = (user) => {
    //   return user && user.name && user.email && user.homeaddress.text && user.officeaddress.text && user.userType && user.donationType && user.phoneCode && user.phone && user.bloodGroup;
    // };
    getData();
    // if (!isValidUser(user)) {
    //   navigate("/users");
    //   alert({ type: "warning", title: "Warning!", text: "Your details are not valid. Please contact support." });
    // }
  }, [id]);

  const validate = () => {
    let isValid = true;
    const errors = {};

    if (!user.name?.trim()) {
      errors.name = "Name is required";
      swal("Error", "Name is required!", "error");
      isValid = false;
    }

    if (user.name?.length > 20) {
      // console.log("asdasd");
      errors.name = "Maximum characters reached for Name!";
      swal("Error", "Maximum characters reached for Name!", "error");
      isValid = false;
    }

    if (!user.homeaddress.text || !user.officeaddress.text) {
      swal("Error", "Address cannot be empty!", "error");
      isValid = false;
    }

    const selectedDate = new Date(user.dob);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      swal("Error", "Cannot accept a future date!", "error");
      return;
    }

    if (user.weight < 0 || user.points < 0) {
      swal("Error", "Cannot accept a negative value!", "error");
      isValid = false;
    }

    if (!user.phone) {
      errors.phone = "Phone number is required.";
      swal("Error", "Phone number is required!", "error");
      isValid = false;
    } else if (phoneError) {
      errors.phone = "Invalid Phone Number Format.";
      swal("Error", "Invali Phone Number Format!", "error");
      isValid = false;
    }
    if (!user.email?.trim() || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(user.email)) {
      errors.email = "Please enter a valid email Id";
      swal("Error", "Please enter a valid email Id!", "error");
      isValid = false;
    }
    if (user.points === undefined || user.points === null || user.points === "" || isNaN(user.points)) {
      errors.points = "Points must be a number";
      swal("Error", "Points must be a number!", "error");
      isValid = false;
    }
    // setErrors(errors);
    return isValid;
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    const [firstLevel, secondLevel] = name.split(".");
    setUser((prevUser) => {
      if (secondLevel) {
        // If it's a nested property
        return {
          ...prevUser,
          [firstLevel]: {
            ...prevUser[firstLevel],
            [secondLevel]: type === "checkbox" ? checked : value,
          },
        };
      } else {
        // If it's not a nested property
        return {
          ...prevUser,
          [name]: type === "checkbox" ? checked : value,
        };
      }
    });
  };

  const handleUpdate = async () => {
    const isValid = validate();
    if (!isValid) return;
    setIsEditing(false);
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/updateuser/${id}`, user, {
        headers: {
          Authorization: sessionStorage.getItem("auth"),
          "Content-Type": "application/json",
        },
      });
      swal("Success", "User Updated Successfully!", "success");
    } catch (error) {
      alert({
        type: "danger",
        title: "Error!",
        text: error.response.data.error,
      });
    } finally {
      setLoading(false);
    }
  };

  // profile upload
  const uploadProfilePicture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { name, size, type } = file;
    const res = await axios.post(
      `${import.meta.env.VITE_API_UPLOAD}/upload-test`,
      { name, size, mime: type },
      {
        headers: { "content-type": "application/json" },
      }
    );
    const { data } = res;

    // console.log("upload-test log", res);

    const fd = new FormData();
    setUser({
      ...user,
      avatar: data.data._id,
    });
    for (const [key, val] of Object.entries(data.data.fields)) fd.append(key, val);
    fd.append("file", file);
    const ress = await fetch(data.data.url, { method: "POST", body: fd });
    // console.log("the ress is", ress);

    if (data.url) {
      // console.log("this is the avaURL", data.url);
      setavaURL(data.url);
    }
  };

  // dropdown shutters
  useEffect(() => {
    // Handler to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef1.current && !dropdownRef1.current.contains(event.target)) {
        setOpen1(false);
      }
    };

    // Attach event listener to document
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    // Handler to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef2.current && !dropdownRef2.current.contains(event.target)) {
        setOpen2(false);
      }
    };

    // Attach event listener to document
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    // Handler to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef3.current && !dropdownRef3.current.contains(event.target)) {
        setOpen3(false);
      }
    };

    // Attach event listener to document
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // location change
  // handling location change and implementing google placces api
  const handleLocationChange = async (e) => {
    const textQuery = e.target.value;

    if (e.target.name === "homeAddress") {
      if (textQuery === "") {
        setAddress([]);
      }
    }

    if (e.target.name === "officeAddress") {
      if (textQuery === "") {
        setAddress1([]);
      }
    }

    if (e.target.name === "homeAddress") {
      // setting up value in formData to ensure user sees what hes typing
      setUser({
        ...user,
        homeaddress: {
          ...user.homeAddress,
          text: textQuery,
        },
        homeAddress: textQuery,
      });
    } else {
      // setting up value in formData to ensure user sees what hes typing
      setUser({
        ...user,
        officeaddress: {
          ...user.officeAddress,
          text: textQuery,
        },
        officeAddress: textQuery,
      });
    }

    // console.log(textQuery);
    try {
      clearTimeout(tid);
      setTid(
        setTimeout(async () => {
          try {
            if (textQuery != "") {
              // console.log("textquery from frontend->", textQuery);

              const response = await axios.post(`${import.meta.env.VITE_API_URL}/googleapi`, { dummyData: textQuery });
              // console.log(response.data.results);
              if (e.target.name === "homeAddress") {
                setAddress(response.data.results);
              } else {
                setAddress1(response.data.results);
              }
            }
          } catch (error) {
            console.error("Error fetching data:", error);
          }
        }, 500)
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleLocationSubmission = (location, geometry, event) => {
    if (event === "home") {
      setUser({
        ...user,
        homeAddress: location,
        homeaddress: {
          text: location,
          latitude: geometry.lat,
          longitude: geometry.lng,
        },
      });

      setAddress([]);
    } else {
      setUser({
        ...user,
        officeAddress: location,
        officeaddress: {
          text: location,
          latitude: geometry.lat,
          longitude: geometry.lng,
        },
      });

      setAddress1([]);
    }
  };

  return (
    <div className="content-wrapper">
      <SEO title="User Details" />
      <div className="d-flex mb-3 justify-content-between align-items-center">
        <p className="card-title p-0 mb-3">User View</p>
        <div className="d-flex justify-content-end">
          <button
            type="button"
            className={isEditing ? "btn btn-outline-secondary" : "btn btn-primary"}
            onClick={handleEdit}
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
          {isEditing && (
            <button type="button" className="btn btn-primary ml-md-4 " onClick={handleUpdate}>
              Update
            </button>
          )}
        </div>
      </div>
      {user && (
        <div className="d-grid-settings gap-3">
          <div className="card mb-4 mx-0 p-0 bg-white grid-item">
            <div className="card-header bg-primary text-white">
              <h5>Personal Information</h5>
              <p className="small mb-0">
                Details about the individual that help identify and personalize their profile.
              </p>
            </div>
            <div className="card-body">
              <div className={`form-group row d-flex align-items-center ${errors.name ? "has-error" : ""}`}>
                <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  Name<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleInputChange}
                    type="text"
                    name="name"
                    className="form-control"
                    value={user.name && user.name}
                    disabled={!isEditing}
                  />
                  {errors.name && <span className="text-danger">{errors.name}</span>}
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Date Of Birth
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleInputChange}
                    type="date"
                    name="dob"
                    className="form-control"
                    value={formatDate(user.dob)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Gender
                </label>
                <div className="col-sm-9">
                  <select
                    onChange={handleInputChange}
                    className="form-control"
                    name="gender"
                    value={user.gender}
                    disabled={!isEditing}
                  >
                    <option value="" disabled>
                      Select Gender
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Weight
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleInputChange}
                    type="text"
                    name="weight"
                    className="form-control"
                    value={user.weight}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Blood Group
                </label>
                <div className="col-sm-9">
                  <select
                    onChange={handleInputChange}
                    className="form-control"
                    name="bloodGroup"
                    value={user.bloodGroup}
                    disabled={!isEditing}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A1+">A1+</option>
                    <option value="A1-">A1-</option>
                    <option value="A2+">A2+</option>
                    <option value="A2-">A2-</option>
                    <option value="A1B+">A1B+</option>
                    <option value="A1B-">A1B-</option>
                    <option value="A2B+">A2B+</option>
                    <option value="A2B-">A2B-</option>
                    <option value="Bombay Blood Group">Bombay Blood Group</option>
                    <option value="INRA">INRA</option>
                    <option value="Don't Know">Don't Know</option>
                  </select>
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  User Type
                </label>
                <div className="col-sm-3 d-flex align-items-center">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="radio"
                        className="form-check-input"
                        name="userType"
                        value="User"
                        checked={user.userType === "User"}
                        disabled={!isEditing}
                      />
                      User
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="col-sm-3 d-flex align-items-center">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="radio"
                        className="form-check-input"
                        name="userType"
                        value="Volunteer"
                        checked={user.userType === "Volunteer"}
                        disabled={!isEditing}
                      />
                      Volunteer
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="col-sm-3 d-flex align-items-center">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="radio"
                        className="form-check-input"
                        name="userType"
                        value="Both"
                        checked={user.userType === "Both"}
                        disabled={!isEditing}
                      />
                      Both
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card mb-4 mx-0 p-0 bg-white grid-item">
            <div className="card-header bg-primary text-white">
              <h5>Contact Information</h5>
              <p className="small mb-0">
                Essential contact details to reach out to the individual, including addresses, phone number, and email.
              </p>
            </div>
            <div className="card-body">
              <div className="form-group row d-flex align-items-center">
                <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  Home Address<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleLocationChange}
                    name="homeAddress"
                    type="text"
                    className="form-control"
                    value={user.homeAddress}
                    disabled={!isEditing}
                  />

                  {/* {errors.homeaddress && <span className="text-danger">{errors.homeaddress}</span>} */}
                </div>
                {address.length > 0 && (
                  <div
                    className="position-absolute bg-white d-flex justify-content-center zindex-tooltip overflow-auto noscrollbar customz-index1 customdropw"
                    style={{
                      width: "75%",
                      height: "250px",
                      left: "100px",
                      top: "130px",
                      zIndex: "999999",
                    }}
                  >
                    <ul className="new list-unstyled">
                      {address.slice(0, 4).map((add) => (
                        <li key={add.place_id} className="border-bottom mx-0 background">
                          <button
                            className="dropdown-item text-wrap fw-normal fs-3"
                            type="button"
                            name="homeAddress"
                            onClick={() =>
                              handleLocationSubmission(add.formatted_address, add.geometry.location, "home")
                            }
                          >
                            <span
                              style={{
                                wordSpacing: "0.2em",
                                letterSpacing: "1px",
                                fontSize: "14px",
                              }}
                            >
                              {add.formatted_address}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  Office Address<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleLocationChange}
                    type="text"
                    name="officeAddress"
                    className="form-control"
                    value={user.officeAddress}
                    disabled={!isEditing}
                  />
                </div>

                {address1.length > 0 && (
                  <div
                    className="position-absolute container bg-white rounded-3 d-flex justify-content-center zindex-tooltip overflow-auto noscrollbar customz-index1"
                    style={{
                      width: "75%",
                      height: "250px",
                      left: "100px",
                      top: "200px",
                      zIndex: "999999",
                    }}
                  >
                    <ul className="new list-unstyled">
                      {address1.slice(0, 4).map((add) => (
                        <li key={add.place_id} className="border-bottom mx-0 background">
                          <button
                            className="dropdown-item text-wrap fw-normal fs-3"
                            type="button"
                            name="officeAddress"
                            onClick={() =>
                              handleLocationSubmission(add.formatted_address, add.geometry.location, "office")
                            }
                          >
                            <span
                              style={{
                                wordSpacing: "0.2em",
                                letterSpacing: "1px",
                                fontSize: "14px",
                              }}
                            >
                              {add.formatted_address}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="form-group row d-flex align-items-center ${errors.email ? 'has-error' : ''}`}">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Email ID<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleInputChange}
                    type="email"
                    name="email"
                    className="form-control"
                    value={user.email}
                    disabled={!isEditing}
                  />
                  {errors.email && <span className="text-danger">{errors.email}</span>}
                </div>
              </div>
              <div className={`form-group row d-flex align-items-center ${errors.phone ? "has-error" : ""}`}>
                <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  Mobile Number<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <PhoneInput
                    disabled={true}
                    preferredCountries={["in"]}
                    placeholder="+91 12345-67890"
                    buttonStyle={{
                      width: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    country={"in"}
                    value={`+${user.phoneCode} ${user.phone}`}
                    inputStyle={{
                      width: "100%",
                      height: "50px",
                      // marginLeft: "7px",
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
                      setUser({
                        ...user,
                        phoneCode: country.dialCode,
                        phone: newphone,
                      });
                    }}
                  />
                  {errors.phone && <span className="text-danger">{errors.phone}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="card mb-4 mx-0 p-0 bg-white grid-item">
            {" "}
            <div className="card-header bg-primary text-white">
              <h5>Profile Details</h5>
              <p className="small mb-0">
                Information related to the individual's profile status, availability, and specific conditions for
                eligibility or participation.
              </p>
            </div>
            <div className="card-body">
              <div className="  d-flex align-items-center flex-column">
                <label htmlFor="profilePic" className=" w-100 text-center">
                  Profile Picture
                </label>
                <div
                  className="profile-image-div"
                  style={{
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      height: "100%", // Adjust the height of the avatar container as needed
                      width: "100%", // Adjust the width of the avatar container as needed
                      borderRadius: "100%",
                      position: "absolute", // Change position to relative
                      overflow: "hidden",
                    }}
                  >
                    {avaURL && avaURL ? (
                      <img
                        src={avaURL}
                        alt=""
                        style={{
                          position: "absolute", // Position the image absolutely
                          top: 0,
                          left: 0,
                          width: "100%", // Ensure the image fills the container width
                          height: "100%", // Ensure the image fills the container height
                          objectFit: "cover", // Use object-fit: cover to maintain aspect ratio
                        }}
                      />
                    ) : (
                      <img
                        src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y
"
                        alt=""
                        style={{
                          position: "absolute", // Position the image absolutely
                          top: 0,
                          left: 0,
                          width: "100%", // Ensure the image fills the container width
                          height: "100%", // Ensure the image fills the container height
                          objectFit: "cover", // Use object-fit: cover to maintain aspect ratio
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "10%",
                      right: "10px",
                      transform: "translateX(50%)",
                    }}
                  >
                    <label
                      htmlFor="imageUpload"
                      //   className="image-upload-icon"
                      style={{
                        color: "#000000",
                      }}
                    >
                      <span className="material-symbols-outlined">add_a_photo</span>
                      <input
                        onChange={uploadProfilePicture}
                        disabled={!isEditing}
                        type="file"
                        id="imageUpload"
                        className="image-upload-input"
                        accept="image/*"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="row d-flex">
                <div className="form-grou col-12 col-md-6 ">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="checkbox"
                        className="form-check-input"
                        name="isAvailable"
                        checked={user.isAvailable}
                        disabled={!isEditing}
                      />
                      Is Available
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="form-grou col-12 col-md-6 ">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="checkbox"
                        className="form-check-input"
                        name="hasTattoo"
                        checked={user.hasTattoo}
                        disabled={!isEditing}
                      />
                      Has Tattoo
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="form-grou col-12 col-md-6 ">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="checkbox"
                        className="form-check-input"
                        name="hasHIV"
                        checked={user.hasHIV}
                        disabled={!isEditing}
                      />
                      Has HIV
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="form-grou col-12 col-md-6 ">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="checkbox"
                        className="form-check-input"
                        name="wannaVolunteer"
                        checked={user.wannaVolunteer}
                        disabled={!isEditing}
                      />
                      Want To Become Volunteer
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="form-grou col-12 col-md-6 ">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="checkbox"
                        className="form-check-input"
                        name="userProfileSkipped"
                        checked={!user.bloodGroup}
                        disabled={!isEditing}
                      />
                      Has Skipped Profile
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="form-grou col-12 col-md-6 ">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="checkbox"
                        className="form-check-input"
                        name="volunteerProfileSkipped"
                        checked={user.volunteerProfileSkipped}
                        disabled={!isEditing}
                      />
                      Has Skipped Volunteer Profile
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card mb-4 mx-0 p-0 bg-white grid-item">
            <div className="card-header bg-primary text-white">
              <h5>Preferences</h5>
              <p className="small mb-0">
                User-specific preferences for points, date and time formatting, and time zone settings to customize
                their experience.
              </p>
            </div>
            <div className="card-body">
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  Donation Type
                </label>
                <div className="col-sm-3 d-flex align-items-center">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="radio"
                        className="form-check-input"
                        name="donationType"
                        value="Blood"
                        checked={user.donationType === "Blood"}
                        disabled={!isEditing}
                      />
                      Blood
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="col-sm-3 d-flex align-items-center">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="radio"
                        className="form-check-input"
                        name="donationType"
                        value="Platelets"
                        checked={user.donationType === "Platelets"}
                        disabled={!isEditing}
                      />
                      Platelets
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="col-sm-3 d-flex align-items-center">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="radio"
                        className="form-check-input"
                        name="donationType"
                        value="Both"
                        checked={user.donationType === "Both"}
                        disabled={!isEditing}
                      />
                      Both
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
              </div>
              <div className="form-group row d-flex align-items-center ${errors.points ? 'has-error' : ''}`}">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Points<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleInputChange}
                    type="text"
                    name="points"
                    className="form-control"
                    value={user.points}
                    disabled={!isEditing}
                  />
                  {errors.points && <span className="text-danger">{errors.points}</span>}
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className="col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Date format
                </label>
                <div className="col-sm-9">
                  <div
                    className={`position-relative form-control  ${isEditing ? "" : "light-gray-homes"}`}
                    onClick={() => {
                      if (isEditing) {
                        setOpen1((prevOpen) => !prevOpen); // Use functional state update
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {user.setting?.dateFormat}
                  </div>
                  {open1 && (
                    <div
                      className="position-absolute p-0  text-start  shadow 
                                       noscrollbar Z1vol w-100"
                      style={{ height: "200px", maxWidth: 540 }}
                      ref={dropdownRef1}
                    >
                      <ul className="text-start p-0">
                        {dateFormatOptions.map((vall, i) => (
                          <>
                            <li
                              key={i}
                              className={`dropdown-item2`}
                              style={{ cursor: "pointer" }}
                              value={user.setting?.dateFormat}
                              onClick={() => {
                                setUser((prevUser) => ({
                                  ...prevUser,
                                  setting: {
                                    ...prevUser.setting, // Keep existing settings
                                    dateFormat: vall, // Update dateFormat
                                  },
                                }));
                                setOpen1(false);
                              }}
                            >
                              {vall}
                            </li>
                          </>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Time Zone
                </label>
                <div className="col-sm-9">
                  <div
                    className={`position-relative form-control  ${isEditing ? "" : "light-gray-homes"}`}
                    onClick={() => {
                      if (isEditing) {
                        setOpen3((prevOpen) => !prevOpen); // Use functional state update
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {user.setting?.timeZone || "Time Zone"}
                  </div>
                  {open3 && (
                    <div
                      className="position-absolute p-0 w-100 text-start shadow noscrollbar Z1vol"
                      style={{ height: "150px", maxWidth: 540 }}
                      ref={dropdownRef3}
                    >
                      <ul className="text-start p-0">
                        {timeZoneOptions.map((vall, i) => (
                          <>
                            <li
                              key={i}
                              className={`dropdown-item2`}
                              style={{ cursor: "pointer" }}
                              value={user.setting?.timeZone}
                              onClick={() => {
                                setUser((prevUser) => ({
                                  ...prevUser,
                                  setting: {
                                    ...prevUser.setting, // Keep existing settings
                                    timeZone: vall, // Update dateFormat
                                  },
                                }));
                                setOpen3(false);
                              }}
                            >
                              {vall}
                            </li>
                          </>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Time format
                </label>
                <div className="innerdrop w-75">
                  <div
                    className={`position-relative form-control  ${isEditing ? "" : "light-gray-homes"}`}
                    onClick={() => {
                      if (isEditing) {
                        setOpen2((prevOpen) => !prevOpen); // Use functional state update
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {user.setting?.timeFormat}
                  </div>
                  {open2 && (
                    <div
                      className="position-absolute p-0 w-100  text-start  shadow 
                                       noscrollbar Z1vol"
                      style={{ height: "80px", maxWidth: 540 }}
                      ref={dropdownRef2}
                    >
                      <ul className="text-start p-0">
                        {timeFormatOptions.map((vall, i) => (
                          <>
                            <li
                              key={i}
                              className={`dropdown-item2`}
                              style={{ cursor: "pointer" }}
                              value={user.setting?.timeFormat}
                              onClick={() => {
                                setUser((prevUser) => ({
                                  ...prevUser,
                                  setting: {
                                    ...prevUser.setting, // Keep existing settings
                                    timeFormat: vall, // Update dateFormat
                                  },
                                }));
                                setOpen2(false);
                              }}
                            >
                              {vall}
                            </li>
                          </>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="d-flex justify-content-end">
        <button
          type="button"
          className={isEditing ? "btn btn-outline-secondary" : "btn btn-primary"}
          onClick={handleEdit}
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
        {isEditing && (
          <button type="button" className="btn btn-primary ml-md-4 " onClick={handleUpdate}>
            Update
          </button>
        )}
      </div>
    </div>
  );
};

export default UserDetails;
