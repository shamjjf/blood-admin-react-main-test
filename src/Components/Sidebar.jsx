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
    // Partner & institution entities grouped together so they read as one
    // related set rather than being scattered through Operations.
    label: "Partners & Institutions",
    items: [
      { key: "ngos",          icon: "ti ti-heart-handshake", name: "NGO Partners",            badgeKey: undefined },
      { key: "organizations", icon: "ti ti-building-bank",   name: "Organizations" },
      { key: "influencers",   icon: "ti ti-speakerphone",    name: "Influencer",   badgeKey: "influencers" },
      { key: "colleges",      icon: "ti ti-school",          name: "Colleges & Universities" },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "requests",    icon: "ti ti-droplet-filled",   name: "Requests",     badgeKey: "requests" },
      { key: "recurring-requests", icon: "ti ti-rotate",    name: "Recurring Requests" },
      { key: "tasks",       icon: "ti ti-checkup-list",     name: "Tasks",        badgeKey: "tasks" },
      { key: "camp",          icon: "ti ti-calendar-event",  name: "Camp" },
      { key: "contribution",  icon: "ti ti-coin",            name: "Contribution" },
      { key: "volunteer",   icon: "ti ti-heart-handshake",  name: "Volunteer",    badgeKey: "volunteers" },
      { key: "bloodbank",   icon: "ti ti-building-hospital",name: "Blood Bank" },
      { key: "blood-drives", icon: "ti ti-calendar-heart",  name: "Blood Donation Drives" },
    ],
  },
  {
    label: "People",
    items: [
      { key: "users",       icon: "ti ti-users",       name: "Users" },
      { key: "admins",      icon: "ti ti-user-check",    name: "Sub-Admins" },
    ],
  },
  {
    label: "Rewards",
    items: [
      { key: "leaderboard",       icon: "ti ti-trophy",       name: "Leaderboard" },
      { key: "badges",            icon: "ti ti-medal",        name: "Badges" },
      { key: "gifts",             icon: "ti ti-gift",         name: "Gifts Catalog" },
      { key: "missions",          icon: "ti ti-target-arrow", name: "Missions" },
      { key: "spin-rewards",      icon: "ti ti-confetti",     name: "Lucky Spin" },
      { key: "onboarding",        icon: "ti ti-school",       name: "Volunteer 101" },
      { key: "training-modules",  icon: "ti ti-book",         name: "Training Modules" },
    ],
  },
  {
    label: "Communication",
    items: [
      { key: "reminders", icon: "ti ti-bell-ringing", name: "Reminders & Campaigns" },
      { key: "promotions", icon: "ti ti-speakerphone", name: "Promotions & Ads" },
      // { key: "community", icon: "ti ti-users-group", name: "Community Feed" }, // hidden for now
    ],
  },
  {
    label: "Donations",
    items: [
      { key: "donations-report",       icon: "ti ti-report-money",      name: "Donations Report" },
      { key: "certificate-orders",     icon: "ti ti-certificate",       name: "Claimed Reward Awards" },
      { key: "certificate-management", icon: "ti ti-file-certificate",  name: "Certificate Config" },
    ],
  },
  {
    label: "Settings",
    items: [
      { key: "settings",        icon: "ti ti-adjustments",    name: "Settings" },
      { key: "analytics",       icon: "ti ti-chart-pie",      name: "Analytics" },
      { key: "audit-logs",      icon: "ti ti-history",        name: "Audit Logs" },
      { key: "india-content",   icon: "ti ti-map-2",          name: "India Content" },
      { key: "awssetting",      icon: "ti ti-cloud-upload",   name: "AWS Settings" },
      { key: "smtpsetting",     icon: "ti ti-mail",           name: "SMTP Settings" },
      { key: "firebasesetting", icon: "ti ti-brand-firebase", name: "Firebase" },
    ],
  },
];

// Only these lower/secondary groups collapse into dropdowns. The primary
// groups above (Overview, Partners, Operations, People) stay always-expanded.
const COLLAPSIBLE = new Set(["Rewards", "Communication", "Donations", "Settings"]);

const BADGE_COLOR = {
  requests:  { bg: "#FFFFFF",  color: "#C0392B" },
  tasks:     { bg: "#FFFFFF",  color: "#C0392B" },
  volunteers:{ bg: "#FFFFFF",  color: "#C0392B" },
};

const Sidebar = ({ sidebar, setSidebar }) => {
  const { pathname } = useLocation();
  const { auth } = useContext(GlobalContext);
  // Match on the FIRST path segment (the top-level section), not the last,
  // so detail routes like /organizations/:id keep their parent nav item
  // ("Organizations") highlighted. Every nav item routes to `/${key}`, so
  // the first segment equals the item key for all sections.
  const topSegment = pathname.split("/").filter(Boolean)[0] || "";

  const [counts, setCounts] = useState({ requests: 0, tasks: 0, volunteers: 0 });

  // Collapsible nav groups (Rewards / Communication / Donations / Settings).
  // The dropdown that owns the current route starts open; the rest collapsed.
  const findActiveGroup = () =>
    NAV_GROUPS.find((g) =>
      g.items.some((it) =>
        it.key === "dashboard" ? pathname === "/" : topSegment === it.key
      )
    );
  const [openGroups, setOpenGroups] = useState(() => {
    const g = findActiveGroup();
    return new Set(g ? [g.label] : []);
  });
  const toggleGroup = (label) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  useEffect(() => {
    const g = findActiveGroup();
    if (g) setOpenGroups((prev) => new Set(prev).add(g.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const initials = auth?.name
    ? auth.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "AD";

  const [adminRoles] = useState(
    auth.isSuperAdmin
      ? ["requests","recurring-requests","tasks","users","admins","settings","leaderboard","badges","gifts","onboarding","training-modules","organizations","ngos","colleges",
         "camp","contribution","volunteer","influencers","bloodbank","blood-drives","awssetting","smtpsetting","firebasesetting",
         "donations-report","certificate-orders","certificate-management","reminders","promotions","spin-rewards","missions","analytics","audit-logs","india-content"]
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
    <>
      {/* Mobile backdrop — dim layer behind the offcanvas sidebar so the user
          has an obvious way to dismiss it on touch devices. CSS hides it on
          desktop where the sidebar is permanently visible. */}
      {sidebar && (
        <div
          className="lsa-sidebar-backdrop"
          onClick={() => setSidebar(false)}
          aria-hidden="true"
        />
      )}
      <nav className={`sidebar lsa-sidebar sidebar-offcanvas ${sidebar ? "active" : ""}`} id="sidebar">
        <ul className="nav" style={{ flexDirection: "column" }}>
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => canShow(item.key));
          if (!visibleItems.length) return null;
          const collapsible = COLLAPSIBLE.has(group.label);
          // When the rail is minimized (`sidebar` true) there are no dropdown
          // toggles, so force every group open so all icons stay reachable.
          const isOpen = !collapsible || openGroups.has(group.label) || sidebar;
          return (
            <li key={group.label} className="lsa-nav-section" style={{ listStyle: "none", width: "100%" }}>
              {collapsible ? (
                <button
                  type="button"
                  className={`lsa-nav-group-toggle${isOpen ? " open" : ""}`}
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={isOpen}
                >
                  <span className="lsa-nav-group">{group.label}</span>
                  <i className="ti ti-chevron-right lsa-nav-caret" />
                </button>
              ) : (
                <div className="lsa-nav-group-header" style={{ padding: "12px 10px 6px" }}>
                  <span className="lsa-nav-group">{group.label}</span>
                </div>
              )}
              {isOpen && (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {visibleItems.map((item) => {
                  const path = item.path || `/${item.key}`;
                  const isActive =
                    item.key === "dashboard" ? pathname === "/" : topSegment === item.key;
                  const badgeCount = item.badgeKey ? counts[item.badgeKey] : null;
                  const badgeStyle = item.badgeKey ? BADGE_COLOR[item.badgeKey] : null;

                  return (
                    <li key={item.key} className={`nav-item ${isActive ? "active" : ""}`}>
                      <Link
                        className="nav-link"
                        to={path}
                        title={item.name}
                        onClick={() => {
                          // Only auto-close on mobile (dismiss the offcanvas).
                          // On desktop, keep the rail's collapsed/expanded state.
                          if (window.innerWidth < 992) setSidebar(false);
                        }}
                        style={{ justifyContent: "flex-start" }}
                      >
                        <i className={`${item.icon} menu-icon`} style={{ fontSize: 17, width: 19, flexShrink: 0 }} />
                        <span className="menu-title" style={{ flex: 1 }}>
                          {item.name}
                        </span>
                        {item.badgeKey && badgeCount > 0 && (
                          <span style={{
                            marginLeft: "auto",
                            // Inactive row (red sidebar) → white circle, red text.
                            // Active row (white tab) → flip to red circle, white
                            // text so the count stays visible, not white-on-white.
                            background: isActive ? "#C0392B" : badgeStyle.bg,
                            color: isActive ? "#FFFFFF" : badgeStyle.color,
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
              )}
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
    </>
  );
};

export default Sidebar;
