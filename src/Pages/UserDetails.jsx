import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";
import PhoneInput from "react-phone-input-2";
import swal from "sweetalert";
import { formatDate } from "../Components/FormatedDate";
import SEO from "../SEO";

const UserDetails = () => {
  const [avaURL, setavaURL] = useState(null);
  const [user, setUser] = useState({
    name: "",
    homeaddress: { text: "" },
    officeaddress: { text: "" },
    homeAddress: "",
    officeAddress: "",
    userType: "User",
    donationType: "Blood",
    phone: "",
    phoneCode: "",
    email: "",
    dob: "",
    points: "",
    weight: "",
    gender: "",
    bloodGroup: "A+",
    isAvailable: false,
    hasTattoo: false,
    hasHIV: false,
    wannaVolunteer: false,
    userProfileSkipped: false,
    volunteerProfileSkipped: false,
    setting: {
      dateFormat: "",
      timeFormat: "",
      timeZone: "",
    },
  });
  // const [user, setUser] = useState({})
  const { setLoading, auth, alert } = useContext(GlobalContext);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const { id } = useParams();
  const [phoneError, setPhoneError] = useState(false);

  const [open1, setOpen1] = useState(false);
  const dropdownRef1 = useRef();
  const [open2, setOpen2] = useState(false);
  const dropdownRef2 = useRef();
  const [open3, setOpen3] = useState(false);
  const dropdownRef3 = useRef();

  // location states
  const [address, setAddress] = useState([]);
  const [address1, setAddress1] = useState([]);
  const [tid, setTid] = useState(0);

  // KYC action state
  const [kycBusy, setKycBusy] = useState(false);

  // ====== Roles & Permissions state ======
  const ADMIN_AREAS = ["users", "requests", "tasks", "settings"];
  const [rolesForm, setRolesForm] = useState({
    isBloodDonor: false,
    isPlateletDonor: false,
    isBloodRecipient: false,
    isPlateletRecipient: false,
    isVolunteer: false,
    isStaff: false,
    isSuperAdmin: false,
    staffAreas: [],
    blocked: false,
  });
  const [rolesBusy, setRolesBusy] = useState(false);

  // Sync the roles form with the latest user data whenever it loads.
  useEffect(() => {
    if (!user) return;
    setRolesForm({
      isBloodDonor: !!user.isBloodDonor,
      isPlateletDonor: !!user.isPlateletDonor,
      isBloodRecipient: !!user.isBloodRecipient,
      isPlateletRecipient: !!user.isPlateletRecipient,
      isVolunteer: !!user.volunteer,
      isStaff: !!user.adminLink && !user.adminLink?.isSuperAdmin,
      isSuperAdmin: !!user.adminLink?.isSuperAdmin,
      staffAreas: user.adminLink?.roles || [],
      blocked: !!user.blocked,
    });
  }, [user?._id, user?.adminLink?.isSuperAdmin, user?.blocked, user?.volunteer]);

  const toggleRole = (key) => {
    setRolesForm((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Staff and Super Admin are mutually exclusive — toggling one off the other.
      if (key === "isStaff" && next.isStaff) next.isSuperAdmin = false;
      if (key === "isSuperAdmin" && next.isSuperAdmin) {
        next.isStaff = false;
        next.staffAreas = [];
      }
      // Unchecking Staff clears the selected areas.
      if (key === "isStaff" && !next.isStaff) next.staffAreas = [];
      return next;
    });
  };

  const toggleStaffArea = (area) => {
    setRolesForm((prev) => {
      const has = prev.staffAreas.includes(area);
      return {
        ...prev,
        staffAreas: has ? prev.staffAreas.filter((a) => a !== area) : [...prev.staffAreas, area],
      };
    });
  };

  const handleSaveRoles = async () => {
    if (rolesForm.isStaff && rolesForm.staffAreas.length === 0) {
      swal("Error", "Pick at least one Staff area (Users, Requests, Tasks or Settings).", "error");
      return;
    }
    try {
      setRolesBusy(true);
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/user/${id}/roles`,
        rolesForm,
        {
          headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
        }
      );
      const payload = res?.data?.data;
      setUser((prev) => ({
        ...prev,
        isBloodDonor: payload?.user?.isBloodDonor ?? prev.isBloodDonor,
        isPlateletDonor: payload?.user?.isPlateletDonor ?? prev.isPlateletDonor,
        isBloodRecipient: payload?.user?.isBloodRecipient ?? prev.isBloodRecipient,
        isPlateletRecipient: payload?.user?.isPlateletRecipient ?? prev.isPlateletRecipient,
        volunteer: payload?.user?.volunteer ?? prev.volunteer,
        blocked: payload?.user?.blocked ?? prev.blocked,
        adminLink: payload?.adminLink ?? null,
      }));
      if (payload?.tempPasswordIssued) {
        swal({
          title: "Admin account created",
          text: `A temporary password was emailed to ${user.email}.\n\nFor your reference (also logged to server): ${payload.tempPasswordIssued}`,
          icon: "success",
        });
      } else {
        swal("Success", "Roles updated successfully.", "success");
      }
    } catch (error) {
      console.error("updateUserRoles error:", error);
      swal("Error", error?.response?.data?.error || "Failed to update roles", "error");
    } finally {
      setRolesBusy(false);
    }
  };

  const roleBadgeStyle = (bg) => ({
    background: bg,
    color: "#FFFFFF",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    display: "inline-block",
    marginRight: 6,
  });

  // ====== Gamification state (snapshot from the /admin/user/:id response) ======
  const [gameInfo, setGameInfo] = useState(null);
  const [gameBusy, setGameBusy] = useState(false);

  // Fetch the user's badges + computed level snapshot from the dedicated endpoint
  // (the regular user detail call doesn't include the level snapshot).
  const refreshGamification = async () => {
    try {
      // Re-fetch the user from admin (it carries badges via the populated path).
      // For level we compute from the four Setting fields and the user's points.
      const [userRes, settingRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/user/${id}`, {
          headers: { Authorization: sessionStorage.getItem("auth") },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/settings`, {
          headers: { Authorization: sessionStorage.getItem("auth") },
        }),
      ]);
      const u = userRes?.data?.data?.user || {};
      const s = settingRes?.data?.data?.setting || {};
      const points = Number(u.points || 0);
      const t = {
        Bronze: Number(s.levelBronzeAt) || 0,
        Silver: Number(s.levelSilverAt) || 500,
        Gold: Number(s.levelGoldAt) || 2000,
        Platinum: Number(s.levelPlatinumAt) || 5000,
      };
      let level = "Bronze";
      if (points >= t.Platinum) level = "Platinum";
      else if (points >= t.Gold) level = "Gold";
      else if (points >= t.Silver) level = "Silver";
      const order = ["Bronze", "Silver", "Gold", "Platinum"];
      const i = order.indexOf(level);
      const nextLevel = i < 3 ? order[i + 1] : null;
      const nextAt = nextLevel ? t[nextLevel] : null;
      setGameInfo({
        points,
        level,
        nextLevel,
        nextLevelAt: nextAt,
        pointsToNext: nextAt != null ? Math.max(0, nextAt - points) : 0,
        levelAt: t[level],
        badges: u.badges || [],
        thresholds: t,
      });
    } catch (err) {
      console.error("refreshGamification error:", err);
    }
  };

  useEffect(() => {
    if (user?._id) refreshGamification();
  }, [user?._id, user?.points]);

  const handleRecheckBadges = async () => {
    try {
      setGameBusy(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/${id}/recheck-badges`,
        {},
        { headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" } }
      );
      const awarded = res?.data?.data?.awarded ?? 0;
      swal(
        awarded > 0 ? "Badges awarded" : "No new badges",
        awarded > 0 ? `${awarded} new badge(s) granted.` : "User already has every badge they qualify for.",
        awarded > 0 ? "success" : "info"
      );
      await refreshGamification();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to recheck badges", "error");
    } finally {
      setGameBusy(false);
    }
  };

  const levelColor = (lvl) => {
    if (lvl === "Platinum") return "#94A3B8";
    if (lvl === "Gold") return "#EAB308";
    if (lvl === "Silver") return "#9CA3AF";
    return "#B45309"; // Bronze
  };
  const kycBadgeStyle = (status) => {
    const base = { padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, textTransform: "capitalize", display: "inline-block" };
    if (status === "verified") return { ...base, background: "#DCFCE7", color: "#166534" };
    if (status === "rejected") return { ...base, background: "#FEE2E2", color: "#991B1B" };
    if (status === "pending") return { ...base, background: "#FEF3C7", color: "#92400E" };
    return { ...base, background: "#F3F4F6", color: "#6B7280" };
  };

  const handleKycDecision = async (decision) => {
    if (!user?.kyc?.type) return;
    let reason = null;
    if (decision === "rejected") {
      const r = window.prompt("Enter a reason for rejecting this KYC (shown to the user):", "");
      if (r === null) return; // cancelled
      reason = String(r).trim();
      if (!reason) {
        swal("Error", "Rejection reason is required", "error");
        return;
      }
    } else {
      const confirm = await swal({
        title: "Approve KYC?",
        text: `Mark ${user.kyc.type === "pan" ? "PAN" : "Aadhar"} as verified for this user?`,
        icon: "info",
        buttons: ["Cancel", "Approve"],
      });
      if (!confirm) return;
    }

    try {
      setKycBusy(true);
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/user/${id}/kyc`,
        { status: decision, reason },
        { headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" } }
      );
      const updatedKyc = res?.data?.data?.kyc;
      setUser((prev) => ({ ...prev, kyc: { ...(prev.kyc || {}), ...(updatedKyc || {}) } }));
      swal("Success", `KYC ${decision === "verified" ? "approved" : "rejected"} successfully!`, "success");
    } catch (error) {
      console.log(error);
      swal("Error", error?.response?.data?.error || "Failed to update KYC status", "error");
    } finally {
      setKycBusy(false);
    }
  };

  const dateFormatOptions = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD", "MM-DD-YYYY", "DD-MM-YYYY", "YYYY-MM-DD"];

  const timeFormatOptions = ["12hrs", "24hrs"];

  const timeZoneOptions = [
    "(UTC-12:00) International Date Line West",
    "(UTC-11:00) Coordinated Universal Time-11",
    "(UTC-10:00) Hawaii",
    "(UTC-09:00) Alaska",
    "(UTC-08:00) Pacific Time (US & Canada)",
    "(UTC-07:00) Mountain Time (US & Canada)",
    "(UTC-06:00) Central Time (US & Canada)",
    "(UTC-05:00) Eastern Time (US & Canada)",
    "(UTC) Coordinated Universal Time",
    "(UTC+01:00) Amsterdam, Berlin, Rome, Vienna",
    "(UTC+02:00) Athens, Bucharest",
    "(UTC+03:00) Moscow, St. Petersburg, Volgograd",
    "(UTC+04:00) Abu Dhabi, Muscat",
    "(UTC+05:00) Islamabad, Karachi",
    "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi",
    "(UTC+06:00) Dhaka",
    "(UTC+07:00) Bangkok, Hanoi, Jakarta",
    "(UTC+08:00) Beijing, Hong Kong, Singapore",
    "(UTC+09:00) Osaka, Sapporo, Tokyo",
    "(UTC+10:00) Canberra, Melbourne, Sydney",
    "(UTC+11:00) Solomon Is., New Caledonia",
    "(UTC+12:00) Auckland, Wellington",
  ];

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/${id}`, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        });
        const { data } = res;
        // if (!isValidUser(data.data.user)) {
        //   throw new Error("Invalid user data");
        // }

        const userData = data.data.user;

        setUser((prevUser) => ({
          ...prevUser,
          ...userData,
          homeAddress: userData?.homeaddress?.text,
          officeAddress: userData?.officeaddress?.text,
        }));
        setavaURL(userData?.avatar?.url);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    // const isValidUser = (user) => {
    //   return user && user.name && user.email && user.homeaddress.text && user.officeaddress.text && user.userType && user.donationType && user.phoneCode && user.phone && user.bloodGroup;
    // };
    getData();
    // if (!isValidUser(user)) {
    //   navigate("/users");
    //   alert({ type: "warning", title: "Warning!", text: "Your details are not valid. Please contact support." });
    // }
  }, [id]);

  const validate = () => {
    let isValid = true;
    const errors = {};

    if (!user.name?.trim()) {
      errors.name = "Name is required";
      swal("Error", "Name is required!", "error");
      isValid = false;
    }

    if (user.name?.length > 20) {
      // console.log("asdasd");
      errors.name = "Maximum characters reached for Name!";
      swal("Error", "Maximum characters reached for Name!", "error");
      isValid = false;
    }

    if (!user.homeaddress.text || !user.officeaddress.text) {
      swal("Error", "Address cannot be empty!", "error");
      isValid = false;
    }

    const selectedDate = new Date(user.dob);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      swal("Error", "Cannot accept a future date!", "error");
      return;
    }

    if (user.weight < 0 || user.points < 0) {
      swal("Error", "Cannot accept a negative value!", "error");
      isValid = false;
    }

    if (!user.phone) {
      errors.phone = "Phone number is required.";
      swal("Error", "Phone number is required!", "error");
      isValid = false;
    } else if (phoneError) {
      errors.phone = "Invalid Phone Number Format.";
      swal("Error", "Invali Phone Number Format!", "error");
      isValid = false;
    }
    if (!user.email?.trim() || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(user.email)) {
      errors.email = "Please enter a valid email Id";
      swal("Error", "Please enter a valid email Id!", "error");
      isValid = false;
    }
    if (user.points === undefined || user.points === null || user.points === "" || isNaN(user.points)) {
      errors.points = "Points must be a number";
      swal("Error", "Points must be a number!", "error");
      isValid = false;
    }
    // setErrors(errors);
    return isValid;
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    const [firstLevel, secondLevel] = name.split(".");
    setUser((prevUser) => {
      if (secondLevel) {
        // If it's a nested property
        return {
          ...prevUser,
          [firstLevel]: {
            ...prevUser[firstLevel],
            [secondLevel]: type === "checkbox" ? checked : value,
          },
        };
      } else {
        // If it's not a nested property
        return {
          ...prevUser,
          [name]: type === "checkbox" ? checked : value,
        };
      }
    });
  };

  const handleUpdate = async () => {
    const isValid = validate();
    if (!isValid) return;
    setIsEditing(false);
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/updateuser/${id}`, user, {
        headers: {
          Authorization: sessionStorage.getItem("auth"),
          "Content-Type": "application/json",
        },
      });
      swal("Success", "User Updated Successfully!", "success");
    } catch (error) {
      alert({
        type: "danger",
        title: "Error!",
        text: error.response.data.error,
      });
    } finally {
      setLoading(false);
    }
  };

  // profile upload
  const uploadProfilePicture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { name, size, type } = file;
    const res = await axios.post(
      `${import.meta.env.VITE_API_UPLOAD}/upload-test`,
      { name, size, mime: type },
      {
        headers: { "content-type": "application/json" },
      }
    );
    const { data } = res;

    // console.log("upload-test log", res);

    const fd = new FormData();
    setUser({
      ...user,
      avatar: data.data._id,
    });
    for (const [key, val] of Object.entries(data.data.fields)) fd.append(key, val);
    fd.append("file", file);
    const ress = await fetch(data.data.url, { method: "POST", body: fd });
    // console.log("the ress is", ress);

    if (data.url) {
      // console.log("this is the avaURL", data.url);
      setavaURL(data.url);
    }
  };

  // dropdown shutters
  useEffect(() => {
    // Handler to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef1.current && !dropdownRef1.current.contains(event.target)) {
        setOpen1(false);
      }
    };

    // Attach event listener to document
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    // Handler to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef2.current && !dropdownRef2.current.contains(event.target)) {
        setOpen2(false);
      }
    };

    // Attach event listener to document
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    // Handler to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef3.current && !dropdownRef3.current.contains(event.target)) {
        setOpen3(false);
      }
    };

    // Attach event listener to document
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // location change
  // handling location change and implementing google placces api
  const handleLocationChange = async (e) => {
    const textQuery = e.target.value;

    if (e.target.name === "homeAddress") {
      if (textQuery === "") {
        setAddress([]);
      }
    }

    if (e.target.name === "officeAddress") {
      if (textQuery === "") {
        setAddress1([]);
      }
    }

    if (e.target.name === "homeAddress") {
      // setting up value in formData to ensure user sees what hes typing
      setUser({
        ...user,
        homeaddress: {
          ...user.homeAddress,
          text: textQuery,
        },
        homeAddress: textQuery,
      });
    } else {
      // setting up value in formData to ensure user sees what hes typing
      setUser({
        ...user,
        officeaddress: {
          ...user.officeAddress,
          text: textQuery,
        },
        officeAddress: textQuery,
      });
    }

    // console.log(textQuery);
    try {
      clearTimeout(tid);
      setTid(
        setTimeout(async () => {
          try {
            if (textQuery != "") {
              // console.log("textquery from frontend->", textQuery);

              const response = await axios.post(`${import.meta.env.VITE_API_URL}/googleapi`, { dummyData: textQuery });
              // console.log(response.data.results);
              if (e.target.name === "homeAddress") {
                setAddress(response.data.results);
              } else {
                setAddress1(response.data.results);
              }
            }
          } catch (error) {
            console.error("Error fetching data:", error);
          }
        }, 500)
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleLocationSubmission = (location, geometry, event) => {
    if (event === "home") {
      setUser({
        ...user,
        homeAddress: location,
        homeaddress: {
          text: location,
          latitude: geometry.lat,
          longitude: geometry.lng,
        },
      });

      setAddress([]);
    } else {
      setUser({
        ...user,
        officeAddress: location,
        officeaddress: {
          text: location,
          latitude: geometry.lat,
          longitude: geometry.lng,
        },
      });

      setAddress1([]);
    }
  };

  return (
    <div className="content-wrapper">
      <SEO title="User Details" />
      <div className="d-flex mb-3 justify-content-between align-items-center">
        <p className="card-title p-0 mb-3">User View</p>
        <div className="d-flex justify-content-end">
          <button
            type="button"
            className={isEditing ? "btn btn-outline-secondary" : "btn btn-primary"}
            onClick={handleEdit}
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
          {isEditing && (
            <button type="button" className="btn btn-primary ml-md-4 " onClick={handleUpdate}>
              Update
            </button>
          )}
        </div>
      </div>
      {user && (
        <div className="d-grid-settings gap-3">
          <div className="card mb-4 mx-0 p-0 bg-white grid-item">
            <div className="card-header bg-primary text-white">
              <h5>Personal Information</h5>
              <p className="small mb-0">
                Details about the individual that help identify and personalize their profile.
              </p>
            </div>
            <div className="card-body">
              <div className={`form-group row d-flex align-items-center ${errors.name ? "has-error" : ""}`}>
                <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  Name<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleInputChange}
                    type="text"
                    name="name"
                    className="form-control"
                    value={user.name && user.name}
                    disabled={!isEditing}
                  />
                  {errors.name && <span className="text-danger">{errors.name}</span>}
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Date Of Birth
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleInputChange}
                    type="date"
                    name="dob"
                    className="form-control"
                    value={formatDate(user.dob)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Gender
                </label>
                <div className="col-sm-9">
                  <select
                    onChange={handleInputChange}
                    className="form-control"
                    name="gender"
                    value={user.gender}
                    disabled={!isEditing}
                  >
                    <option value="" disabled>
                      Select Gender
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Weight
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleInputChange}
                    type="text"
                    name="weight"
                    className="form-control"
                    value={user.weight}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Blood Group
                </label>
                <div className="col-sm-9">
                  <select
                    onChange={handleInputChange}
                    className="form-control"
                    name="bloodGroup"
                    value={user.bloodGroup}
                    disabled={!isEditing}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A1+">A1+</option>
                    <option value="A1-">A1-</option>
                    <option value="A2+">A2+</option>
                    <option value="A2-">A2-</option>
                    <option value="A1B+">A1B+</option>
                    <option value="A1B-">A1B-</option>
                    <option value="A2B+">A2B+</option>
                    <option value="A2B-">A2B-</option>
                    <option value="Bombay Blood Group">Bombay Blood Group</option>
                    <option value="INRA">INRA</option>
                    <option value="Don't Know">Don't Know</option>
                  </select>
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  User Type
                </label>
                <div className="col-sm-3 d-flex align-items-center">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="radio"
                        className="form-check-input"
                        name="userType"
                        value="User"
                        checked={user.userType === "User"}
                        disabled={!isEditing}
                      />
                      User
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="col-sm-3 d-flex align-items-center">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="radio"
                        className="form-check-input"
                        name="userType"
                        value="Volunteer"
                        checked={user.userType === "Volunteer"}
                        disabled={!isEditing}
                      />
                      Volunteer
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="col-sm-3 d-flex align-items-center">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="radio"
                        className="form-check-input"
                        name="userType"
                        value="Both"
                        checked={user.userType === "Both"}
                        disabled={!isEditing}
                      />
                      Both
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card mb-4 mx-0 p-0 bg-white grid-item">
            <div className="card-header bg-primary text-white">
              <h5>Contact Information</h5>
              <p className="small mb-0">
                Essential contact details to reach out to the individual, including addresses, phone number, and email.
              </p>
            </div>
            <div className="card-body">
              <div className="form-group row d-flex align-items-center">
                <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  Home Address<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleLocationChange}
                    name="homeAddress"
                    type="text"
                    className="form-control"
                    value={user.homeAddress}
                    disabled={!isEditing}
                  />

                  {/* {errors.homeaddress && <span className="text-danger">{errors.homeaddress}</span>} */}
                </div>
                {address.length > 0 && (
                  <div
                    className="position-absolute bg-white d-flex justify-content-center zindex-tooltip overflow-auto noscrollbar customz-index1 customdropw"
                    style={{
                      width: "75%",
                      height: "250px",
                      left: "100px",
                      top: "130px",
                      zIndex: "999999",
                    }}
                  >
                    <ul className="new list-unstyled">
                      {address.slice(0, 4).map((add) => (
                        <li key={add.place_id} className="border-bottom mx-0 background">
                          <button
                            className="dropdown-item text-wrap fw-normal fs-3"
                            type="button"
                            name="homeAddress"
                            onClick={() =>
                              handleLocationSubmission(add.formatted_address, add.geometry.location, "home")
                            }
                          >
                            <span
                              style={{
                                wordSpacing: "0.2em",
                                letterSpacing: "1px",
                                fontSize: "14px",
                              }}
                            >
                              {add.formatted_address}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  Office Address<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleLocationChange}
                    type="text"
                    name="officeAddress"
                    className="form-control"
                    value={user.officeAddress}
                    disabled={!isEditing}
                  />
                </div>

                {address1.length > 0 && (
                  <div
                    className="position-absolute container bg-white rounded-3 d-flex justify-content-center zindex-tooltip overflow-auto noscrollbar customz-index1"
                    style={{
                      width: "75%",
                      height: "250px",
                      left: "100px",
                      top: "200px",
                      zIndex: "999999",
                    }}
                  >
                    <ul className="new list-unstyled">
                      {address1.slice(0, 4).map((add) => (
                        <li key={add.place_id} className="border-bottom mx-0 background">
                          <button
                            className="dropdown-item text-wrap fw-normal fs-3"
                            type="button"
                            name="officeAddress"
                            onClick={() =>
                              handleLocationSubmission(add.formatted_address, add.geometry.location, "office")
                            }
                          >
                            <span
                              style={{
                                wordSpacing: "0.2em",
                                letterSpacing: "1px",
                                fontSize: "14px",
                              }}
                            >
                              {add.formatted_address}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="form-group row d-flex align-items-center ${errors.email ? 'has-error' : ''}`}">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Email ID<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleInputChange}
                    type="email"
                    name="email"
                    className="form-control"
                    value={user.email}
                    disabled={!isEditing}
                  />
                  {errors.email && <span className="text-danger">{errors.email}</span>}
                </div>
              </div>
              <div className={`form-group row d-flex align-items-center ${errors.phone ? "has-error" : ""}`}>
                <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  Mobile Number<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <PhoneInput
                    disabled={true}
                    preferredCountries={["in"]}
                    placeholder="+91 12345-67890"
                    buttonStyle={{
                      width: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    country={"in"}
                    value={`+${user.phoneCode} ${user.phone}`}
                    inputStyle={{
                      width: "100%",
                      height: "50px",
                      // marginLeft: "7px",
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
                      setUser({
                        ...user,
                        phoneCode: country.dialCode,
                        phone: newphone,
                      });
                    }}
                  />
                  {errors.phone && <span className="text-danger">{errors.phone}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="card mb-4 mx-0 p-0 bg-white grid-item">
            {" "}
            <div className="card-header bg-primary text-white">
              <h5>Profile Details</h5>
              <p className="small mb-0">
                Information related to the individual's profile status, availability, and specific conditions for
                eligibility or participation.
              </p>
            </div>
            <div className="card-body">
              <div className="  d-flex align-items-center flex-column">
                <label htmlFor="profilePic" className=" w-100 text-center">
                  Profile Picture
                </label>
                <div
                  className="profile-image-div"
                  style={{
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      height: "100%", // Adjust the height of the avatar container as needed
                      width: "100%", // Adjust the width of the avatar container as needed
                      borderRadius: "100%",
                      position: "absolute", // Change position to relative
                      overflow: "hidden",
                    }}
                  >
                    {avaURL && avaURL ? (
                      <img
                        src={avaURL}
                        alt=""
                        style={{
                          position: "absolute", // Position the image absolutely
                          top: 0,
                          left: 0,
                          width: "100%", // Ensure the image fills the container width
                          height: "100%", // Ensure the image fills the container height
                          objectFit: "cover", // Use object-fit: cover to maintain aspect ratio
                        }}
                      />
                    ) : (
                      <img
                        src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y
"
                        alt=""
                        style={{
                          position: "absolute", // Position the image absolutely
                          top: 0,
                          left: 0,
                          width: "100%", // Ensure the image fills the container width
                          height: "100%", // Ensure the image fills the container height
                          objectFit: "cover", // Use object-fit: cover to maintain aspect ratio
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "10%",
                      right: "10px",
                      transform: "translateX(50%)",
                    }}
                  >
                    <label
                      htmlFor="imageUpload"
                      //   className="image-upload-icon"
                      style={{
                        color: "#000000",
                      }}
                    >
                      <span className="material-symbols-outlined">add_a_photo</span>
                      <input
                        onChange={uploadProfilePicture}
                        disabled={!isEditing}
                        type="file"
                        id="imageUpload"
                        className="image-upload-input"
                        accept="image/*"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="row d-flex">
                <div className="form-grou col-12 col-md-6 ">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="checkbox"
                        className="form-check-input"
                        name="isAvailable"
                        checked={user.isAvailable}
                        disabled={!isEditing}
                      />
                      Is Available
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="form-grou col-12 col-md-6 ">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="checkbox"
                        className="form-check-input"
                        name="hasTattoo"
                        checked={user.hasTattoo}
                        disabled={!isEditing}
                      />
                      Has Tattoo
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="form-grou col-12 col-md-6 ">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="checkbox"
                        className="form-check-input"
                        name="hasHIV"
                        checked={user.hasHIV}
                        disabled={!isEditing}
                      />
                      Has HIV
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="form-grou col-12 col-md-6 ">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="checkbox"
                        className="form-check-input"
                        name="wannaVolunteer"
                        checked={user.wannaVolunteer}
                        disabled={!isEditing}
                      />
                      Want To Become Volunteer
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="form-grou col-12 col-md-6 ">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="checkbox"
                        className="form-check-input"
                        name="userProfileSkipped"
                        checked={!user.bloodGroup}
                        disabled={!isEditing}
                      />
                      Has Skipped Profile
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="form-grou col-12 col-md-6 ">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="checkbox"
                        className="form-check-input"
                        name="volunteerProfileSkipped"
                        checked={user.volunteerProfileSkipped}
                        disabled={!isEditing}
                      />
                      Has Skipped Volunteer Profile
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card mb-4 mx-0 p-0 bg-white grid-item">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <h5>KYC Verification</h5>
                <p className="small mb-0">Aadhar / PAN identity verification submitted at signup.</p>
              </div>
              {user?.kyc?.type && (
                <span style={kycBadgeStyle(user.kyc.status)}>{user.kyc.status || "pending"}</span>
              )}
            </div>
            <div className="card-body">
              {!user?.kyc?.type ? (
                <p className="text-muted m-0">This user has not submitted any KYC.</p>
              ) : (
                <>
                  <div className="form-group row d-flex align-items-center">
                    <label className="col-form-label" style={{ width: "140px", paddingLeft: "10px" }}>KYC Type</label>
                    <div className="col-sm-8">
                      <input type="text" className="form-control" value={user.kyc.type === "pan" ? "PAN Card" : "Aadhar Card"} disabled />
                    </div>
                  </div>
                  <div className="form-group row d-flex align-items-center">
                    <label className="col-form-label" style={{ width: "140px", paddingLeft: "10px" }}>
                      {user.kyc.type === "pan" ? "PAN Number" : "Aadhar Number"}
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control"
                        value={user.kyc.type === "pan" ? (user.kyc.panNumber || "") : (user.kyc.aadharNumber || "")}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="form-group row d-flex align-items-center">
                    <label className="col-form-label" style={{ width: "140px", paddingLeft: "10px" }}>Document</label>
                    <div className="col-sm-8">
                      {user.kyc.document?.url ? (
                        <>
                          <a
                            href={user.kyc.document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm me-2"
                          >
                            <i className="fa-regular fa-eye"></i> View Document
                          </a>
                          <span className="text-muted small ms-2">
                            {user.kyc.document.name} ({user.kyc.document.mime})
                          </span>
                          {/^image\//.test(user.kyc.document.mime || "") && (
                            <div className="mt-3">
                              <img
                                src={user.kyc.document.url}
                                alt="KYC document"
                                style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 6, border: "1px solid #E5E7EB" }}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted">No document uploaded</span>
                      )}
                    </div>
                  </div>
                  {user.kyc.submittedAt && (
                    <div className="form-group row d-flex align-items-center">
                      <label className="col-form-label" style={{ width: "140px", paddingLeft: "10px" }}>Submitted On</label>
                      <div className="col-sm-8">
                        <input type="text" className="form-control" value={formatDate(user.kyc.submittedAt)} disabled />
                      </div>
                    </div>
                  )}
                  {user.kyc.status === "verified" && user.kyc.verifiedAt && (
                    <div className="form-group row d-flex align-items-center">
                      <label className="col-form-label" style={{ width: "140px", paddingLeft: "10px" }}>Verified On</label>
                      <div className="col-sm-8">
                        <input type="text" className="form-control" value={formatDate(user.kyc.verifiedAt)} disabled />
                      </div>
                    </div>
                  )}
                  {user.kyc.status === "rejected" && user.kyc.rejectionReason && (
                    <div className="form-group row d-flex align-items-center">
                      <label className="col-form-label" style={{ width: "140px", paddingLeft: "10px" }}>Reason</label>
                      <div className="col-sm-8">
                        <textarea className="form-control" rows={2} value={user.kyc.rejectionReason} disabled />
                      </div>
                    </div>
                  )}

                  {user.kyc.status !== "verified" && (
                    <div className="d-flex justify-content-end mt-3" style={{ gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-success"
                        disabled={kycBusy}
                        onClick={() => handleKycDecision("verified")}
                      >
                        {kycBusy ? "Working..." : "Approve KYC"}
                      </button>
                      {user.kyc.status !== "rejected" && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          disabled={kycBusy}
                          onClick={() => handleKycDecision("rejected")}
                        >
                          Reject KYC
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {/* ===== Gamification Card (level + badges) ===== */}
          <div className="card mb-4 mx-0 p-0 bg-white grid-item">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <h5>Gamification</h5>
                <p className="small mb-0">Current level, points and earned badges.</p>
              </div>
              {gameInfo?.level && (
                <span style={{
                  background: levelColor(gameInfo.level),
                  color: "#fff",
                  padding: "4px 14px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {gameInfo.level}
                </span>
              )}
            </div>
            <div className="card-body">
              {gameInfo ? (
                <>
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <div className="text-muted small">Total Points</div>
                      <div className="fs-3 fw-bold">{gameInfo.points}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted small">Current Level</div>
                      <div className="fs-3 fw-bold" style={{ color: levelColor(gameInfo.level) }}>
                        {gameInfo.level}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted small">To next level</div>
                      <div className="fs-3 fw-bold">
                        {gameInfo.nextLevel
                          ? `${gameInfo.pointsToNext} pts → ${gameInfo.nextLevel}`
                          : "Max level"}
                      </div>
                    </div>
                  </div>

                  {gameInfo.nextLevel && (
                    <div style={{
                      height: 10,
                      background: "#E5E7EB",
                      borderRadius: 5,
                      overflow: "hidden",
                      marginBottom: 20,
                    }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(0, ((gameInfo.points - gameInfo.levelAt) / Math.max(1, gameInfo.nextLevelAt - gameInfo.levelAt)) * 100))}%`,
                        height: "100%",
                        background: levelColor(gameInfo.level),
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                  )}

                  <hr />

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="m-0">Earned Badges ({gameInfo.badges.length})</h6>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      disabled={gameBusy}
                      onClick={handleRecheckBadges}
                    >
                      {gameBusy ? "Checking…" : "Re-check Eligibility"}
                    </button>
                  </div>

                  {gameInfo.badges.length === 0 ? (
                    <p className="text-muted small mb-0">No badges earned yet.</p>
                  ) : (
                    <div className="d-flex flex-wrap" style={{ gap: 12 }}>
                      {gameInfo.badges.map((entry, i) => (
                        <div key={i} style={{
                          minWidth: 130,
                          padding: 10,
                          border: "1px solid #E5E7EB",
                          borderRadius: 8,
                          textAlign: "center",
                          background: "#FAFAFA",
                        }}>
                          <div style={{ fontSize: 28 }}>{entry.badge?.icon || "🏅"}</div>
                          <div className="fw-bold small">{entry.badge?.name || "Badge"}</div>
                          {entry.badge?.description && (
                            <div className="text-muted" style={{ fontSize: 11 }}>{entry.badge.description}</div>
                          )}
                          <div className="text-muted" style={{ fontSize: 10, marginTop: 4 }}>
                            {entry.awardedBy === "admin" ? "Manual" : "Auto"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted small mb-0">Loading…</p>
              )}
            </div>
          </div>

          {/* ===== Roles & Permissions Card ===== */}
          <div className="card mb-4 mx-0 p-0 bg-white grid-item">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <h5>Roles & Permissions</h5>
                <p className="small mb-0">Manage what this user is on the platform. Roles overlap freely.</p>
              </div>
              <div>
                {user?.adminLink?.isSuperAdmin ? (
                  <span style={roleBadgeStyle("#7C3AED")}>Super Admin</span>
                ) : user?.adminLink ? (
                  <span style={roleBadgeStyle("#0EA5E9")}>Staff</span>
                ) : null}
              </div>
            </div>
            <div className="card-body">
              <p className="text-uppercase fw-bold text-muted small mb-2" style={{ letterSpacing: 0.5 }}>
                Operational Roles (User App)
              </p>

              <div className="form-check mb-2">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={rolesForm.isBloodDonor}
                    onChange={() => toggleRole("isBloodDonor")}
                  />
                  Blood Donor
                  <i className="input-helper" />
                </label>
              </div>
              <div className="form-check mb-2">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={rolesForm.isPlateletDonor}
                    onChange={() => toggleRole("isPlateletDonor")}
                  />
                  Platelet Donor
                  <i className="input-helper" />
                </label>
              </div>
              <div className="form-check mb-2">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={rolesForm.isBloodRecipient}
                    onChange={() => toggleRole("isBloodRecipient")}
                  />
                  Blood Recipient (Patient)
                  <i className="input-helper" />
                </label>
              </div>
              <div className="form-check mb-2">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={rolesForm.isPlateletRecipient}
                    onChange={() => toggleRole("isPlateletRecipient")}
                  />
                  Platelet Recipient (Patient)
                  <i className="input-helper" />
                </label>
              </div>
              <div className="form-check mb-3">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={rolesForm.isVolunteer}
                    onChange={() => toggleRole("isVolunteer")}
                  />
                  Volunteer
                  <i className="input-helper" />
                </label>
              </div>

              <hr />

              <p className="text-uppercase fw-bold text-muted small mb-2" style={{ letterSpacing: 0.5 }}>
                Admin Portal Access
              </p>

              <div className="form-check mb-2">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={rolesForm.isSuperAdmin}
                    onChange={() => toggleRole("isSuperAdmin")}
                  />
                  Super Admin (full access)
                  <i className="input-helper" />
                </label>
              </div>
              <div className="form-check mb-2">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={rolesForm.isStaff}
                    onChange={() => toggleRole("isStaff")}
                  />
                  Staff (Sub-Admin)
                  <i className="input-helper" />
                </label>
              </div>

              {rolesForm.isStaff && (
                <div style={{ marginLeft: 24, marginBottom: 12 }}>
                  <p className="small text-muted mb-2">Pick which areas this Staff can manage:</p>
                  {ADMIN_AREAS.map((area) => (
                    <div key={area} className="form-check d-inline-block me-3">
                      <label className="form-check-label text-capitalize">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={rolesForm.staffAreas.includes(area)}
                          onChange={() => toggleStaffArea(area)}
                        />
                        {area}
                        <i className="input-helper" />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <hr />

              <p className="text-uppercase fw-bold text-muted small mb-2" style={{ letterSpacing: 0.5 }}>
                Account State
              </p>
              <div className="form-check mb-3">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={rolesForm.blocked}
                    onChange={() => toggleRole("blocked")}
                  />
                  Deactivate account (blocks all login)
                  <i className="input-helper" />
                </label>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={rolesBusy}
                  onClick={handleSaveRoles}
                >
                  {rolesBusy ? "Saving…" : "Save Roles"}
                </button>
              </div>
            </div>
          </div>

          <div className="card mb-4 mx-0 p-0 bg-white grid-item">
            <div className="card-header bg-primary text-white">
              <h5>Preferences</h5>
              <p className="small mb-0">
                User-specific preferences for points, date and time formatting, and time zone settings to customize
                their experience.
              </p>
            </div>
            <div className="card-body">
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                  Donation Type
                </label>
                <div className="col-sm-3 d-flex align-items-center">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="radio"
                        className="form-check-input"
                        name="donationType"
                        value="Blood"
                        checked={user.donationType === "Blood"}
                        disabled={!isEditing}
                      />
                      Blood
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="col-sm-3 d-flex align-items-center">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="radio"
                        className="form-check-input"
                        name="donationType"
                        value="Platelets"
                        checked={user.donationType === "Platelets"}
                        disabled={!isEditing}
                      />
                      Platelets
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
                <div className="col-sm-3 d-flex align-items-center">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input
                        onChange={handleInputChange}
                        type="radio"
                        className="form-check-input"
                        name="donationType"
                        value="Both"
                        checked={user.donationType === "Both"}
                        disabled={!isEditing}
                      />
                      Both
                      <i className="input-helper" />
                    </label>
                  </div>
                </div>
              </div>
              <div className="form-group row d-flex align-items-center ${errors.points ? 'has-error' : ''}`}">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Points<span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <input
                    onChange={handleInputChange}
                    type="text"
                    name="points"
                    className="form-control"
                    value={user.points}
                    disabled={!isEditing}
                  />
                  {errors.points && <span className="text-danger">{errors.points}</span>}
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className="col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Date format
                </label>
                <div className="col-sm-9">
                  <div
                    className={`position-relative form-control  ${isEditing ? "" : "light-gray-homes"}`}
                    onClick={() => {
                      if (isEditing) {
                        setOpen1((prevOpen) => !prevOpen); // Use functional state update
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {user.setting?.dateFormat}
                  </div>
                  {open1 && (
                    <div
                      className="position-absolute p-0  text-start  shadow 
                                       noscrollbar Z1vol w-100"
                      style={{ height: "200px", maxWidth: 540 }}
                      ref={dropdownRef1}
                    >
                      <ul className="text-start p-0">
                        {dateFormatOptions.map((vall, i) => (
                          <>
                            <li
                              key={i}
                              className={`dropdown-item2`}
                              style={{ cursor: "pointer" }}
                              value={user.setting?.dateFormat}
                              onClick={() => {
                                setUser((prevUser) => ({
                                  ...prevUser,
                                  setting: {
                                    ...prevUser.setting, // Keep existing settings
                                    dateFormat: vall, // Update dateFormat
                                  },
                                }));
                                setOpen1(false);
                              }}
                            >
                              {vall}
                            </li>
                          </>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Time Zone
                </label>
                <div className="col-sm-9">
                  <div
                    className={`position-relative form-control  ${isEditing ? "" : "light-gray-homes"}`}
                    onClick={() => {
                      if (isEditing) {
                        setOpen3((prevOpen) => !prevOpen); // Use functional state update
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {user.setting?.timeZone || "Time Zone"}
                  </div>
                  {open3 && (
                    <div
                      className="position-absolute p-0 w-100 text-start shadow noscrollbar Z1vol"
                      style={{ height: "150px", maxWidth: 540 }}
                      ref={dropdownRef3}
                    >
                      <ul className="text-start p-0">
                        {timeZoneOptions.map((vall, i) => (
                          <>
                            <li
                              key={i}
                              className={`dropdown-item2`}
                              style={{ cursor: "pointer" }}
                              value={user.setting?.timeZone}
                              onClick={() => {
                                setUser((prevUser) => ({
                                  ...prevUser,
                                  setting: {
                                    ...prevUser.setting, // Keep existing settings
                                    timeZone: vall, // Update dateFormat
                                  },
                                }));
                                setOpen3(false);
                              }}
                            >
                              {vall}
                            </li>
                          </>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group row d-flex align-items-center">
                <label className=" col-form-label" style={{ width: "90px", paddingLeft: "15px" }}>
                  Time format
                </label>
                <div className="innerdrop w-75">
                  <div
                    className={`position-relative form-control  ${isEditing ? "" : "light-gray-homes"}`}
                    onClick={() => {
                      if (isEditing) {
                        setOpen2((prevOpen) => !prevOpen); // Use functional state update
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {user.setting?.timeFormat}
                  </div>
                  {open2 && (
                    <div
                      className="position-absolute p-0 w-100  text-start  shadow 
                                       noscrollbar Z1vol"
                      style={{ height: "80px", maxWidth: 540 }}
                      ref={dropdownRef2}
                    >
                      <ul className="text-start p-0">
                        {timeFormatOptions.map((vall, i) => (
                          <>
                            <li
                              key={i}
                              className={`dropdown-item2`}
                              style={{ cursor: "pointer" }}
                              value={user.setting?.timeFormat}
                              onClick={() => {
                                setUser((prevUser) => ({
                                  ...prevUser,
                                  setting: {
                                    ...prevUser.setting, // Keep existing settings
                                    timeFormat: vall, // Update dateFormat
                                  },
                                }));
                                setOpen2(false);
                              }}
                            >
                              {vall}
                            </li>
                          </>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="d-flex justify-content-end">
        <button
          type="button"
          className={isEditing ? "btn btn-outline-secondary" : "btn btn-primary"}
          onClick={handleEdit}
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
        {isEditing && (
          <button type="button" className="btn btn-primary ml-md-4 " onClick={handleUpdate}>
            Update
          </button>
        )}
      </div>
    </div>
  );
};

export default UserDetails;
