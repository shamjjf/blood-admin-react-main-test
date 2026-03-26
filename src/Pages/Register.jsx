import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import axios from "axios";
import swal from "sweetalert";

import { GlobalContext } from "../GlobalContext";
// import logo from "../Assets/images/main_logo.png";

const Register = () => {
  const { dispatch, setLoading, alert } = useContext(GlobalContext);
  const [phoneError, setPhoneError] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    emailId: "",
    phoneCode: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    // Validation for name
    if (!formData.name || formData.name.length < 3) {
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
    if (
      !formData.password ||
      !/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}/.test(formData.password)
    ) {
      errors.password =
        "Password must contain at least one capital letter, one small letter, one special character, one number, and be at least 6 characters long.";
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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
        dispatch({ type: "SIGNIN", payload: data.token });
        swal("Success!", "Registration Successful!", "success");
        navigate("/");
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container-scroller">
      <div className="container-fluid page-body-wrapper full-page-wrapper">
        <div className="content-wrapper d-flex align-items-center auth px-0">
          <div className="row w-100 mx-0">
            <div className="col-lg-4 mx-auto">
              <div className="auth-form-light text-left py-5 px-4 px-sm-5">
                {/* <div className="brand-logo d-flex align-item-center justify-content-center">
                  <img src={logo} alt="logo" />
                </div> */}
                {/* <h4>New here?</h4>
                <h6 className="font-weight-light">
                  Signing up is easy. It only takes a few steps
                </h6> */}
                <form className="pt-3" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <input
                      type="text"
                      className={`form-control form-control-lg ${
                        errors.name && "is-invalid"
                      }`}
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Name"
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <input
                      type="email"
                      className={`form-control form-control-lg ${
                        errors.emailId && "is-invalid"
                      }`}
                      id="emailId"
                      name="emailId"
                      value={formData.emailId}
                      onChange={handleInputChange}
                      placeholder="Email"
                    />
                    {errors.emailId && (
                      <div className="invalid-feedback">{errors.emailId}</div>
                    )}
                  </div>
                  <div className="form-group">
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
                    {errors.phone && (
                      <div className="invalid-feedback">{errors.phone}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      className={`form-control form-control-lg ${
                        errors.password && "is-invalid"
                      }`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                    />
                    {errors.password && (
                      <div className="invalid-feedback">{errors.password}</div>
                    )}
                  </div>
                  <div className="mt-3">
                    <button
                      type="submit"
                      className="btn btn-block btn-primary btn-lg font-weight-medium auth-form-btn"
                    >
                      Add
                    </button>
                  </div>
                  {/* <div className="text-center mt-4 font-weight-light">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary">
                      Login
                    </Link>
                  </div> */}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
