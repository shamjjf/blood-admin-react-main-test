import { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";

const Sidebar = ({ sidebar, setSidebar }) => {
  const { pathname } = useLocation();
  const pathParts = pathname.split("/"); // Split the pathname into an array of parts
  const lastPathPart = pathParts[pathParts.length - 1];

  const { auth } = useContext(GlobalContext);

  const [adminRoles, setAdminRoles] = useState(
    auth.isSuperAdmin
      ? [
          "requests",
          "tasks",
          "users",
          "admins",
          "settings",
          "leaderboard",
          "camp",
          "contribution",
          "volunteer",
          // "vendor",
          "bloodbank",
          "awssetting",
          "smtpsetting",
          "firebasesetting",
          "bulkuser",
        ]
      : auth.roles
  );

  const iconMapping = {
    requests: "fa-solid fa-code-pull-request",
    tasks: "fa-solid fa-list-check",
    users: "fa-solid fa-user-plus",
    admins: "fa fa-user-check",
    settings: "fa-solid fa-gear",
    leaderboard: "ti-bar-chart-alt",
    camp: "fa-solid fa-map-marker-alt",
    contribution: "fa-solid fa-hand-holding-heart",
    volunteer: "fa-solid fa-handshake-angle",
    bloodbank: "fa-solid fa-droplet",
    firebasesetting: "fa-solid fa-cloud",
    awssetting: "fa-solid fa-cloud",
    smtpsetting: "fa-solid fa-server",
    bulkuser: "fa fa-list-alt",
    // vendor: "fa fa-user-tie",
  };
  const nameMapping = {
    requests: "Requests",
    tasks: "Tasks",
    users: "Users",
    admins: "Admins",
    settings: "Settings",
    leaderboard: "Leaderboard",
    camp: "Camp",
    contribution: "Contribution",
    volunteer: "Volunteer",
    bloodbank: "Blood Bank",
    firebasesetting: "Firebase Setting",
    awssetting: "AWS Setting",
    smtpsetting: "SMTP Setting",
    bulkuser: "Bulk User",
    // vendor: "Vendor",
  };
  

  return (
    <nav className={`sidebar sidebar-offcanvas ${sidebar && "active"}`} id="sidebar">
      <ul className="nav">
        <li className={`nav-item ${lastPathPart === "" && "active"}`}>
          <Link className="nav-link asdfg" onClick={() => setSidebar(false)} to="/">
            <i className="icon-grid menu-icon"></i>
            <span className="menu-title text-capitalize">Dashboard</span>
          </Link>
        </li>
        {adminRoles &&
          adminRoles.map((role, i) => (
            <li className={`nav-item ${lastPathPart === role && "active"}`} key={i}>
              <Link
                className="nav-link asdfg "
                data-toggle="collapse"
                to={`/${role}`}
                aria-expanded="false"
                aria-controls="ui-basic"
                onClick={() => setSidebar(false)}
              >
                <i className={`${iconMapping[role]} menu-icon `}></i>
                <span style={{ height: "100%" }} className="menu-title  text-capitalize">
                  {nameMapping[role]}
                </span>
              </Link>
            </li>
          ))}
          <br />
      </ul>
    </nav>
  );
};

export default Sidebar;
