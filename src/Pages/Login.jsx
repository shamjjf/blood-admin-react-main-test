import { useContext, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";
import logo from "../Assets/images/life-logo.png";
import PhoneInput from "react-phone-input-2";
import SEO from "../SEO";

const Login = () => {
  const { dispatch, setLoading, alert } = useContext(GlobalContext);
  const [phoneError, setPhoneError] = useState(false);

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailId: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [passwordShow, setPasswordShow] = useState(false);

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    // Validation for phone
    if (!formData.emailId) {
      errors.emailId = "Email ID is required.";
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.emailId)) {
      errors.emailId = "Invalid Email ID Format.";
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const handelChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handelSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setLoading(true);
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/signin`,
          { ...formData },
          { headers: { "Content-Type": "application/json" } }
        );
        const { data, error } = res;
        if (res.status === 200) {
          dispatch({ type: "SIGNIN", payload: data.token });
          navigate("/");
        } else {
          alert({ type: "warning", title: "Warning!", text: error });
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };
  return (
    <div className="container-scroller">
      <SEO title="Login" />

      <div className="container-fluid page-body-wrapper full-page-wrapper ">
        <div className="content-wrapper d-flex align-items-center justify-content-center auth px-0">
          <div className="row w-100 mx-0">
            <div className="col-lg-4 mx-auto">
              <div
                style={{ maxWidth: "500px", borderRadius: "10px" }}
                className="auth-form-light text-center pb-5 px-2 px-sm-5 mx-auto"
              >
                <div className="brand-logo d-flex align-items-center justify-content-center m-0 mb-4">
                  <img src={logo} alt="logo" />
                </div>
                <h4 className="text-center mb-3 mt-0">Hello! Let's Get Started</h4>
                <h6 className="font-weight-light text-center mb-4">Login to continue</h6>
                <form className="pt-3" onSubmit={handelSubmit}>
                  <div style={{ maxWidth: "400px" }} className="form-group mb-4 ">
                    <input
                      type="email"
                      className={`form-control form-control-lg ${errors.emailId && "is-invalid"}`}
                      placeholder="Email ID"
                      name="emailId"
                      value={formData.emailId}
                      onChange={handelChange}
                      onInvalid={(e) => {
                        e.preventDefault();
                        setErrors({ ...errors, emailId: "Invalid Email ID Format." });
                      }}
                      onInput={(e) => {
                        e.target.setCustomValidity("");
                      }}
                      style={{
                        paddingLeft: "15px",
                        borderRadius: "5px",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    {errors.emailId && <div className="text-danger font-weight-bold mt-2">{errors.emailId}</div>}
                  </div>
                  <div className="form-group mb-4">
                    <div
                      style={{
                        position: "relative",
                        maxWidth: "400px",
                        margin: "0 auto",
                      }}
                      className="d-flex align-items-center"
                    >
                      <input
                        type={`${passwordShow ? "text" : "password"}`}
                        className={`form-control form-control-lg ${errors.password && "is-invalid"}`}
                        id="exampleInputPassword1"
                        required
                        onInvalid={(e) => {
                          e.preventDefault();
                          setErrors({ ...errors, password: "Password is required." });
                        }}
                        placeholder="Password"
                        name="password"
                        value={formData.password}
                        onChange={handelChange}
                        style={{
                          paddingLeft: "15px",
                          borderRadius: "5px",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <i
                        onClick={() => setPasswordShow(!passwordShow)}
                        style={{
                          cursor: "pointer",
                          position: "absolute",
                          right: "10px",
                          top: "17px",
                        }}
                        className={`icons fa-regular fa-eye${passwordShow ? "-slash" : ""}`}
                      ></i>
                    </div>
                    {errors.password && <div className="text-danger font-weight-bold mt-2">{errors.password}</div>}
                  </div>
                  <div className="mt-4">
                    <button
                      type="submit"
                      className="btn btn-block btn-primary btn-lg font-weight-medium auth-form-btn"
                      style={{
                        maxWidth: "400px",
                        backgroundColor: "#6c5ce7",
                        borderRadius: "5px",
                        border: "none",
                        padding: "12px 0",
                        fontSize: "16px",
                        transition: "all 0.3s ease",
                        margin: "0 auto",
                      }}
                    >
                      Login
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
