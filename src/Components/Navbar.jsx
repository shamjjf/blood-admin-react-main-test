import { useContext, useState, useRef, useEffect } from "react";
import { GlobalContext } from "../GlobalContext";
import logo from "../Assets/images/life-logo.png";
import logoMini from "../Assets/images/life-small-logo.png";
import newlogo from "../Assets/images/newlogopng.png";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import userImage from "../Assets/images/profileplaceholder.png";

function Navbar({ setSidebar }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const { auth, dispatch } = useContext(GlobalContext);
  const { pathname } = useLocation();
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

  useEffect(() => {
    if (!auth?.id) return;

    const fetchUnread = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/notifications/unread-count`,
          { headers: { Authorization: sessionStorage.getItem("auth") } }
        );
        setUnreadCount(res.data?.data?.count || 0);
      } catch (err) {
        console.log("unread count fetch failed", err?.message);
      }
    };

    fetchUnread();
    const id = setInterval(fetchUnread, 60000);
    return () => clearInterval(id);
  }, [auth?.id, pathname]);
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
        <ul
          className="navbar-nav navbar-nav-right d-flex align-items-center flex-row"
          style={{ gap: "20px", paddingRight: "32px" }}
        >
          {auth.id && (
            <li
              className="nav-item d-flex align-items-center"
              style={{ margin: 0 }}
            >
              <Link
                to="/notifications"
                title="Notifications"
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  color: "#444",
                  fontSize: "20px",
                  textDecoration: "none",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f0f0f0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <i className="fa-solid fa-bell"></i>
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "#dc3545",
                      color: "#fff",
                      borderRadius: "999px",
                      fontSize: "10px",
                      lineHeight: 1,
                      padding: "3px 5px",
                      minWidth: "18px",
                      textAlign: "center",
                      fontWeight: 700,
                      border: "2px solid #fff",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </li>
          )}
          <li className="nav-item nav-profile dropdown " ref={dropdownRef} style={{ margin: 0 }}>
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
