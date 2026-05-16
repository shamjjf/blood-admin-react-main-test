import "./Assets/vendors/feather/feather.css";
// Themify Icons removed — it collides with Tabler Icons (both use the `.ti`
// class). Tabler is loaded via CDN in index.html and powers all sidebar /
// dashboard glyphs (e.g. ti-gift, ti-book, ti-heart-handshake, ti-rotate).
import "./Assets/vendors/css/vendor.bundle.base.css";
import "./Assets/css/custom.css";
import "./Assets/css/custom2.css";
import "react-phone-input-2/lib/style.css";

// Plugin css for this page
import "./Assets/vendors/datatables.net-bs4/dataTables.bootstrap4.css";
// Note: The next line seems incorrect. Corrected it to match the file extension.
// import "./Assets/js/select.dataTables.min.css";
// End plugin css for this page
import "./Assets/css/vertical-layout-light/style.css";
import "./Assets/css/admin-theme.css";
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";
import Home from "./Pages/Home";
import { Route, Routes } from "react-router-dom";
import Request from "./Pages/Request";
import NotFound from "./Pages/NotFound";
import Auth from "./Autherization/Auth";
import RequestDetails from "./Pages/RequestsDetails";
import Tasks from "./Pages/Tasks";
import Users from "./Pages/Users";
import Admins from "./Pages/Admins";
import Setting from "./Pages/Setting";
import UserDetails from "./Pages/UserDetails";
import TaskDetails from "./Pages/TaskDetail";
import Leaderboard from "./Pages/Leaderboard";
import { useContext, useState } from "react";
import { AlertContainer } from "./Components/Alerts";
import { GlobalContext } from "./GlobalContext";
import Camps from "./Pages/Camps";
import Contribution from "./Pages/Contribution";
import ContributionDetails from "./Pages/ContributionDetails";
import ContributionDetailsNorm from "./Pages/ContributionDetailsNorm";
import BulkUserDetails from "./Pages/BulkUserDetails";
import Volunteer from "./Pages/Volunteer";
import VolunteerDetails from "./Pages/VolunteerDetails";
import BloodBank from "./Pages/BloodBank";
import AWSSetting from "./Pages/AWSSetting";
import SMTPSetting from "./Pages/SMTPSetting";
import BulkUsers from "./Pages/BulkUsers";
import FirebaseSetting from "./Pages/Firebase";
import Vendor from "./Pages/Vender";
import Profile from "./Pages/Profile";
import SpecialUser from "./Pages/SpecialUser";
import SpecialUserDetails from "./Pages/SpecialUserDetails";
import Notifications from "./Pages/Notifications";
import Badges from "./Pages/Badges";
import Onboarding from "./Pages/Onboarding";
import Gifts from "./Pages/Gifts";
import TrainingModules from "./Pages/TrainingModules";
import RecurringRequests from "./Pages/RecurringRequests";
import Organizations from "./Pages/Organizations";
import CampDetails from "./Pages/CampDetails";
import DonationsReport from "./Pages/DonationsReport";
import CertificateOrders from "./Pages/CertificateOrders";
import CertificateManagement from "./Pages/CertificateManagement";
import Reminders from "./Pages/Reminders";
import Analytics from "./Pages/Analytics";
import AuditLogs from "./Pages/AuditLogs";
import IndiaContent from "./Pages/IndiaContent";

// import { DndProvider } from "react-dnd";
// import { HTML5Backend } from "react-dnd-html5-backend";
// import Login from "./Pages/Login";

const Layout = () => {
  const { alerts } = useContext(GlobalContext);
  const [sidebar, setSidebar] = useState(false);
  return (
    <div className={`container-scroller ${sidebar && "sidebar-icon-only"}`}>
      <Navbar setSidebar={setSidebar} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <div className="main-panel me-0">
          {/* <DndProvider backend={HTML5Backend}> */}
          <Routes>
            <Route path="*" element={<NotFound />} />
            <Route element={<Auth />}>
              <Route path="/" element={<Home />} />
              <Route path="/requests" element={<Request />} />
              <Route path="/request/:id" element={<RequestDetails />} />

              <Route path="/tasks" element={<Tasks />} />
              <Route path="/camp" element={<Camps />} />
              <Route path="/task/:id" element={<TaskDetails />} />
              <Route path="/contribution/:id" element={<ContributionDetails />} />
              <Route path="/contributionNorm/:id" element={<ContributionDetailsNorm />} />

              <Route path="/users" element={<Users />} />
              <Route path="/user/:id" element={<UserDetails />} />
              <Route path="/profile" element={<Profile />} />

              <Route path="/specialuser" element={<SpecialUser />} />
              <Route path="/specialuser/:id" element={<SpecialUserDetails />} />
              <Route path="/admins" element={<Admins />} />
              <Route path="/settings" element={<Setting />} />

              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/gifts" element={<Gifts />} />
              <Route path="/training-modules" element={<TrainingModules />} />
              <Route path="/recurring-requests" element={<RecurringRequests />} />
              <Route path="/organizations" element={<Organizations />} />
              <Route path="/camp/:id" element={<CampDetails />} />
              <Route path="/donations-report" element={<DonationsReport />} />
              <Route path="/certificate-orders" element={<CertificateOrders />} />
              <Route path="/certificate-management" element={<CertificateManagement />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/india-content" element={<IndiaContent />} />
              <Route path="/contribution" element={<Contribution />} />
              <Route path="/volunteer" element={<Volunteer />} />
              <Route path="/vendor" element={<Vendor />} />
              <Route path="/bulkuser" element={<BulkUsers />} />
              <Route path="/bulkuser/:id" element={<BulkUserDetails />} />
              <Route path="/bloodbank" element={<BloodBank />} />
              <Route path="/awssetting" element={<AWSSetting />} />
              <Route path="/smtpsetting" element={<SMTPSetting />} />
              <Route path="/firebasesetting" element={<FirebaseSetting />} />
              <Route path="/volunteerdetails/:id" element={<VolunteerDetails />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Routes>
          {/* </DndProvider> */}
          <AlertContainer alerts={alerts} />
        </div>
      </div>
    </div>
  );
};

export default Layout;
