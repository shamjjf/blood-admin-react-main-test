import { useContext, useState, useRef, useEffect } from "react";
import { GlobalContext } from "../GlobalContext";
import logo from "../Assets/images/life-logo.png";
import logoMini from "../Assets/images/life-small-logo.png";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

function Navbar({ setSidebar }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { auth, dispatch } = useContext(GlobalContext);
  const { pathname } = useLocation();
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setDropdownOpen((p) => !p);
  const handelLogout = () => dispatch({ type: "SIGNOUT" });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      } catch {}
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 60000);
    return () => clearInterval(id);
  }, [auth?.id, pathname]);

  const initials = auth?.name
    ? auth.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "AD";

  return (
    <nav className="navbar lsa-navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
      <div className="text-center navbar-brand-wrapper d-flex align-items-center justify-content-center">
        <Link className="navbar-brand brand-logo" to="/">
          <img src={logo} alt="Life Saver Army" style={{ height: 50, width: "auto", maxWidth: 170, objectFit: "contain", filter: "brightness(1.1)" }} />
        </Link>
        <Link className="navbar-brand brand-logo-mini" to="/">
          <img src={logoMini} alt="LSA" style={{ maxHeight: 32, width: "auto" }} />
        </Link>
      </div>

      <div className="navbar-menu-wrapper d-flex align-items-center" style={{ gap: 10, paddingRight: 20 }}>
        <button onClick={() => setSidebar((p) => !p)} className="navbar-toggler navbar-toggler align-self-center" type="button"
          style={{ color: "rgba(255,255,255,0.6)", fontSize: 20, background: "none", border: "none" }}>
          <span className="icon-menu" />
        </button>

        <div className="lsa-search-wrap" style={{ display: "flex" }}>
          <i className="ti ti-search" />
          <input type="text" placeholder="Search users, requests, camps…" />
        </div>

        <div style={{ flex: 1 }} />

        <div className="lsa-live-wrap" style={{ marginRight: 4 }}>
          <span className="lsa-live-dot" /> Live
        </div>

        {auth.id && (
          <Link to="/notifications" className="lsa-notif-btn" title="Notifications" style={{ textDecoration: "none" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
              <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
            </svg>
            {unreadCount > 0 && <span className="lsa-notif-badge" />}
          </Link>
        )}

        <Link to="/settings" className="lsa-notif-btn" title="Settings" style={{ textDecoration: "none" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
              <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
          </svg>
        </Link>

        <div style={{ position: "relative" }} ref={dropdownRef}>
          <div className="lsa-admin-chip" onClick={toggleDropdown}>
            <div className="lsa-admin-av">{initials}</div>
            <div>
              <div className="lsa-name">{auth?.name || "Admin"}</div>
              <div className="lsa-role">{auth?.isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}</div>
            </div>
            <i className="ti ti-chevron-down" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 2 }} />
          </div>

          {dropdownOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10,
              padding: "6px 0", minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999,
            }}>
              <Link to="/profile" onClick={() => setDropdownOpen(false)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
                textDecoration: "none", color: "#1a1a1a", fontSize: 13, fontWeight: 500,
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F4F1")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <i className="ti ti-user" style={{ fontSize: 16, color: "#C0392B" }} /> Profile
              </Link>
              <Link to="/settings" onClick={() => setDropdownOpen(false)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
                textDecoration: "none", color: "#1a1a1a", fontSize: 13, fontWeight: 500,
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F4F1")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <i className="ti ti-settings" style={{ fontSize: 16, color: "#C0392B" }} /> Settings
              </Link>
              <div style={{ height: 1, background: "rgba(0,0,0,0.07)", margin: "4px 0" }} />
              <button onClick={handelLogout} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
                background: "none", border: "none", cursor: "pointer", width: "100%",
                color: "#C0392B", fontSize: 13, fontWeight: 600,
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF5F5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <i className="ti ti-logout" style={{ fontSize: 16 }} /> Logout
              </button>
            </div>
          )}
        </div>

        <button onClick={() => setSidebar((p) => !p)} className="navbar-toggler navbar-toggler-right d-lg-none align-self-center"
          type="button" style={{ color: "rgba(255,255,255,0.6)", fontSize: 20, background: "none", border: "none" }}>
          <span className="icon-menu" />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
