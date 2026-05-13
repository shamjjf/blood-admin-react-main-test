import { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";
import axios from "axios";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ key: "dashboard", icon: "ti ti-layout-dashboard", name: "Dashboard", path: "/" }],
  },
  {
    label: "Operations",
    items: [
      { key: "requests",    icon: "ti ti-droplet-filled",   name: "Requests",     badgeKey: "requests" },
      { key: "tasks",       icon: "ti ti-checkup-list",     name: "Tasks",        badgeKey: "tasks" },
      { key: "camp",        icon: "ti ti-calendar-event",   name: "Camp" },
      { key: "contribution",icon: "ti ti-coin",             name: "Contribution" },
      { key: "volunteer",   icon: "ti ti-heart-handshake",  name: "Volunteer",    badgeKey: "volunteers" },
      { key: "bloodbank",   icon: "ti ti-building-hospital",name: "Blood Bank" },
    ],
  },
  {
    label: "People",
    items: [
      { key: "users",       icon: "ti ti-users",       name: "Users" },
      { key: "specialuser", icon: "ti ti-star-filled",   name: "Special Users" },
      { key: "admins",      icon: "ti ti-user-check",    name: "Sub-Admins" },
      { key: "bulkuser",    icon: "ti ti-list-details",  name: "Bulk Users" },
    ],
  },
  {
    label: "Rewards",
    items: [
      { key: "leaderboard", icon: "ti ti-trophy", name: "Leaderboard" },
      { key: "badges",      icon: "ti ti-medal",  name: "Badges" },
      { key: "onboarding",  icon: "ti ti-school", name: "Volunteer 101" },
    ],
  },
  {
    label: "Settings",
    items: [
      { key: "settings",        icon: "ti ti-adjustments",    name: "Settings" },
      { key: "awssetting",      icon: "ti ti-cloud-upload",   name: "AWS Settings" },
      { key: "smtpsetting",     icon: "ti ti-mail",           name: "SMTP Settings" },
      { key: "firebasesetting", icon: "ti ti-brand-firebase", name: "Firebase" },
    ],
  },
];

const BADGE_COLOR = {
  requests:  { bg: "#C0392B",  color: "#fff" },
  tasks:     { bg: "#d97706",  color: "#fff" },
  volunteers:{ bg: "#16a34a",  color: "#fff" },
};

const Sidebar = ({ sidebar, setSidebar }) => {
  const { pathname } = useLocation();
  const { auth } = useContext(GlobalContext);
  const lastPart = pathname.split("/").filter(Boolean).pop() || "";

  const [counts, setCounts] = useState({ requests: 0, tasks: 0, volunteers: 0 });

  const initials = auth?.name
    ? auth.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "AD";

  const [adminRoles] = useState(
    auth.isSuperAdmin
      ? ["requests","tasks","users","specialuser","admins","settings","leaderboard","badges","onboarding",
         "camp","contribution","volunteer","bloodbank","awssetting","smtpsetting","firebasesetting","bulkuser"]
      : auth.roles || []
  );

  const canShow = (key) =>
    key === "dashboard" || auth.isSuperAdmin || adminRoles.includes(key);

  // Fetch live counts for badges
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const headers = { Authorization: sessionStorage.getItem("auth") };
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/stats`, { headers });
        const d = res.data;
        setCounts({
          requests:  (d.bloodRequestCountCrit ?? 0) + (d.bloodRequestCountNoCrit ?? 0),
          tasks:     d.openTasks ?? 0,
          volunteers: d.volunteersCount ?? 0,
        });
      } catch (e) {
        console.log(e);
      }
    };
    fetchCounts();
  }, [pathname]);

  return (
    <nav className={`sidebar lsa-sidebar sidebar-offcanvas ${sidebar ? "active" : ""}`} id="sidebar">
      <ul className="nav" style={{ flexDirection: "column" }}>
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => canShow(item.key));
          if (!visibleItems.length) return null;
          return (
            <li key={group.label} style={{ listStyle: "none", width: "100%" }}>
              <span className="lsa-nav-group">{group.label}</span>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {visibleItems.map((item) => {
                  const path = item.path || `/${item.key}`;
                  const isActive =
                    item.key === "dashboard" ? pathname === "/" : lastPart === item.key;
                  const badgeCount = item.badgeKey ? counts[item.badgeKey] : null;
                  const badgeStyle = item.badgeKey ? BADGE_COLOR[item.badgeKey] : null;

                  return (
                    <li key={item.key} className={`nav-item ${isActive ? "active" : ""}`}>
                      <Link
                        className="nav-link"
                        to={path}
                        onClick={() => setSidebar(false)}
                        style={{ justifyContent: "flex-start" }}
                      >
                        <i className={`${item.icon} menu-icon`} style={{ fontSize: 17, width: 19, flexShrink: 0 }} />
                        <span className="menu-title" style={{ flex: 1 }}>
                          {item.name}
                        </span>
                        {item.badgeKey && badgeCount > 0 && (
                          <span style={{
                            marginLeft: "auto",
                            background: badgeStyle.bg,
                            color: badgeStyle.color,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 99,
                            fontFamily: "var(--f-display)",
                            minWidth: 20,
                            textAlign: "center",
                            lineHeight: "16px",
                          }}>
                            {badgeCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>

      {/* Sidebar footer */}
      <div className="lsa-sidebar-footer">
        <div className="lsa-sf-inner">
          <div className="lsa-sf-av">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="lsa-sf-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {auth?.name || "Admin"}
            </div>
            <div className="lsa-sf-role">{auth?.isSuperAdmin ? "Super Admin" : "Admin"}</div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
