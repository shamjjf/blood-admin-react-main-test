import { useContext, useState, useRef, useEffect } from "react";
import { GlobalContext } from "../GlobalContext";
import logo from "../Assets/images/life-logo.png";
import logoMini from "../Assets/images/life-small-logo.png";
import newlogo from "../Assets/images/newlogopng.png";
import { Link } from "react-router-dom";
import userImage from "../Assets/images/profileplaceholder.png";

function Navbar({ setSidebar }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const { auth, dispatch } = useContext(GlobalContext);
  const handelLogout = () => {
    dispatch({ type: "SIGNOUT" });
  };

  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <nav className="navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
      <div className="text-center navbar-brand-wrapper d-flex align-items-center justify-content-center">
        <Link className="navbar-brand brand-logo" to="/">
          <img
            style={{ width: "100%", height: "100%" }}
            src={logo}
            width={200}
            className="m-2"
            alt="logo"
          />
        </Link>
        <Link className="navbar-brand brand-logo-mini" to="/">
          <img src={logoMini} alt="logo" />
        </Link>
      </div>
      <div className="navbar-menu-wrapper d-flex align-items-center justify-content-end">
        <button
          onClick={() => setSidebar((pre) => !pre)}
          className="navbar-toggler navbar-toggler align-self-center"
          type="button"
          data-toggle="minimize"
        >
          <span className="icon-menu"></span>
        </button>
        <ul className="navbar-nav navbar-nav-right ">
          <li className="nav-item nav-profile dropdown " ref={dropdownRef}>
            {auth.id ? (
              <div className="dropdown  " id="profile-dropdown ">
                <div
                  style={{ cursor: "pointer" }}
                  className="dropdown-toggle mt-1 "
                  id="profileDropdown"
                  onClick={toggleDropdown}
                  aria-expanded={dropdownOpen ? "true" : "false"}
                >
                  <img src={userImage} alt="profile" />
                </div>
                {dropdownOpen && (
                  <div
                    className="dropdown-menu dropdown-menu-right show"
                    aria-labelledby="profileDropdown"
                  >
                     <Link
                      className="dropdown-item"
                      to="/profile"
                      onClick={toggleDropdown}
                    >
                      <i className="ti-user text-primary"></i>
                      Profile
                    </Link>
                    <Link
                      className="dropdown-item"
                      to="/settings"
                      onClick={toggleDropdown}
                    >
                      <i className="ti-settings text-primary"></i>
                      Settings
                    </Link>
                    <button
                      className="dropdown-item"
                      id=""
                      onFocus={handelLogout}
                    >
                      <i className="ti-power-off text-primary"></i>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="profileDropdown"
                  role="button"
                  onClick={toggleDropdown}
                  aria-expanded={dropdownOpen ? "true" : "false"}
                >
                  Login
                </a>
                {dropdownOpen && (
                  <div
                    className="dropdown-menu dropdown-menu-right show"
                    aria-labelledby="profileDropdown"
                  >
                    <a className="dropdown-item">
                      <i className="ti-settings text-primary"></i>
                      Settings
                    </a>
                    <Link className="dropdown-item" to="/login">
                      Login
                    </Link>
                  </div>
                )}
              </div>
            )}
          </li>
        </ul>

        <button
          onClick={() => setSidebar((pre) => !pre)}
          className="navbar-toggler navbar-toggler-right d-lg-none align-self-center"
          type="button"
          data-toggle="offcanvas"
        >
          <span className="icon-menu"></span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
