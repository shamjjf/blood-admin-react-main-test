import { useContext, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { GlobalContext } from "../GlobalContext";

const AddAdmin = ({ setShowAdminForm, getData }) => {
  const { dispatch, setLoading, alert } = useContext(GlobalContext);
  const [phoneError, setPhoneError] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    emailId: "",
    phoneCode: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const [showPass, setShowPass] = useState(false);

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    // Validation for name
    if (!formData.name || formData.name.trim().length < 3) {
      errors.name = "Full name must have minimum 3 letters.";
      isValid = false;
    }

    // Validation for email
    if (!formData.emailId) {
      errors.emailId = "Email is required.";
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

    // Validation for password
    if (!formData.password || !/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}/.test(formData.password)) {
      errors.password =
        "Password must contain at least one capital letter, one small letter, one special character, one number, and be at least 6 characters long.";

      swal(
        "Error!",
        "Password must contain at least one capital letter, one small letter, one special character, one number, and be at least 6 characters long.",
        "error"
      );
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
    if (name === "emailId") {
      if (value.length > 40) {
        swal("Error!", "Email cannot exceed 40 characters!", "error");
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setLoading(true);
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/signup`,
          { ...formData },
          { headers: { "Content-Type": "application/json" } }
        );
        const { data, error } = res;
        // dispatch({ type: "SIGNIN", payload: data.token });
        swal("Success!", "Admin Added Successfully!", "success");
        setShowAdminForm(false);
        getData();
      } catch (error) {
        console.log(error);
        setShowAdminForm(false);

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
    <div className="myupdatedcard add-admin">
      <div className="card-body">
        <div className="d-flex align-item-center justify-content-between">
          <h4 className="card-title">Add Admin</h4>
          <button onClick={() => setShowAdminForm(false)} className="btn btn-danger btn-rounded btn-icon cusing">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form className="pt-3" onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label htmlFor="">Full Name<span className="text-danger">*</span></label>
            <input
              type="text"
              className={`form-control form-control-lg ${errors.name && "is-invalid"}`}
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full Name"
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>
          <div className="form-group mb-4">
          <label htmlFor="">Email<span className="text-danger">*</span></label>

            <input
              type="email"
              className={`form-control form-control-lg ${errors.emailId && "is-invalid"}`}
              id="emailId"
              name="emailId"
              value={formData.emailId}
              onChange={handleInputChange}
              placeholder="Email"
            />
            {errors.emailId && <div className="invalid-feedback">{errors.emailId}</div>}
          </div>
          <div className="form-group mb-4">
          <label htmlFor="">Phone Number<span className="text-danger">*</span></label>

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
          {/* <div className="form-group mb-4 d-flex flex-row position-relative">
            <input
              type={showPass ? "text" : "password"}
              className={`form-control form-control-lg ${
                errors.password && "is-invalid"
              }`}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              style={{ border: "none" }}
            />

            {showPass ? (
              <svg
                className="h-6 text-gray-700"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 512"
              >
                <path
                  fill="#00553E"
                  d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z"
                ></path>
              </svg>
            ) : (
              <svg
                className="h-6 text-gray-700"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
              >
                <path
                  fill="#00553E"
                  d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"
                ></path>
              </svg>
            )}

            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div> */}
<div className="form-group">
  <label htmlFor="" className="font-weight-normal">Password<span className="text-danger">*</span></label>

          <div
            className={` d-flex flex-row cust-border align-items-center px-3 cursor-pointer ${
              errors.password ? "is-invalid" : ""
            }`}
            >

            <input
              type={showPass ? "text" : "password"}
              className={`form-control form-control-lg `}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              style={{
                paddingRight: "2.5rem",
                border: "none",
                paddingLeft: "15px",
              }} // Add padding for the icon
              data-toggle="tooltip"
              data-placement="top"
              title={errors.password ?? errors.password}
              />

            {!showPass ? (
              <svg
              className="h-6 text-gray-700 cursor-pointer"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 512"
              width="24" // Set desired width
              height="24" // Set desired height
              onClick={() => setShowPass(!showPass)}
              style={{ cursor: "pointer" }}
              >
                <path
                  fill="#4B49AC"
                  d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z"
                ></path>
              </svg>
            ) : (
              <svg
                className="h-6 text-gray-700 cursor-pointer"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
                width="24" // Set desired width
                height="24" // Set desired height
                onClick={() => setShowPass(!showPass)}
                style={{ cursor: "pointer" }}
                >
                <path
                  fill="#4B49AC"
                  d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"
                  ></path>
              </svg>
            )}
            </div>
          </div>

          <div className="text-end  mt-4 d-flex justify-content-end gap-4">
            <button onClick={() => setShowAdminForm(false)} className="btn btn-outline-secondary ">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAdmin;
