import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";
import PhoneInput from "react-phone-input-2";
import swal from "sweetalert";
import { formatDate } from "../Components/FormatedDate";
import SEO from "../SEO";

const SpecialUserDetails = () => {
  const [avaURL, setavaURL] = useState(null);
  const [user, setUser] = useState({
    name: "",
    address: { text: "" }, 
    userType: "NGO",
    phone: "",
    phoneCode: "",
    email: "",
    setting: {
      dateFormat: "",
      timeFormat: "",
      timeZone: "",
    },
  });
  const { setLoading, auth, alert } = useContext(GlobalContext);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const { id } = useParams();
  const [phoneError, setPhoneError] = useState(false);

  // location states
  const [address, setAddress] = useState([]);
  const [tid, setTid] = useState(0);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/specialuser/${id}`, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        });
        const { data } = res;
        // if (!isValidUser(data.data.user)) {
        //   throw new Error("Invalid user data");
        // }

        const userData = data.data.specialuser;

        setUser((prevUser) => ({
          ...prevUser,
          ...userData,
          address: userData?.address || { text: "" },
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

    if (!user.address.text?.trim()) {
      swal("Error", "Address cannot be empty!", "error");
      isValid = false;
    }

    if ( user.points < 0) {
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
      await axios.post(`${import.meta.env.VITE_API_URL}/updatespecialuser/${id}`, user, {
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

  // handling location change and implementing google placces api
  const handleLocationChange = async (e) => {
    const textQuery = e.target.value;

    if (textQuery === "") {
      setAddress([]);
    }

    // setting up value in formData to ensure user sees what hes typing
    setUser({
      ...user,
      address: {
        ...user.address,
        text: textQuery,
      },
    });

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
              setAddress(response.data.results);
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

  const handleLocationSubmission = (location, geometry) => {
    setUser({
      ...user,
      address: {
        text: location,
        latitude: geometry.lat,
        longitude: geometry.lng,
      },
    });

    setAddress([]);
  };

  return (
    <div className="content-wrapper">
      <SEO title="Special User Details" />
      <div className="d-flex mb-3 justify-content-between align-items-center">
        <p className="card-title p-0 mb-3">Special User View</p>
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
              <h5>User Information</h5>
              <p className="small mb-0">
                Details about the organization that help identify and personalize their profile.
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
                      influencer
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
                        value="User"
                        checked={user.userType === "User"}
                        disabled={!isEditing}
                      />
                      company
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
                        value="User"
                        checked={user.userType === "User"}
                        disabled={!isEditing}
                      />
                      university
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
                      NGO
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
                      school  
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
                Essential contact details to reach out to the  organization, including addresses, phone number, and email.
              </p>
            </div>
            <div className="card-body">
              <div className="form-group row d-flex align-items-center">
                <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  Address<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9" style={{ position: "relative" }}>
                  <input
                    onChange={handleLocationChange}
                    type="text"
                    name="address"
                    className="form-control"
                    value={user.address?.text || ""}
                    disabled={!isEditing}
                  />

                  {address.length > 0 && (
                    <div
                      className="position-absolute bg-white rounded-3 overflow-auto noscrollbar"
                      style={{
                        width: "100%",
                        maxHeight: "250px",
                        top: "100%",
                        left: 0,
                        marginTop: "5px",
                        zIndex: "999999",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                    <ul className="new list-unstyled">
                      {address.slice(0, 4).map((add) => (
                        <li key={add.place_id} className="border-bottom mx-0 background">
                          <button
                            className="dropdown-item text-wrap fw-normal"
                            type="button"
                            name="address"
                            onClick={() =>
                              handleLocationSubmission(add.formatted_address, add.geometry.location)
                            }
                          >
                            <span
                              style={{
                                wordSpacing: "0.2em",
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
              </div>
              <div className="form-group row d-flex align-items-center">
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

export default SpecialUserDetails;
