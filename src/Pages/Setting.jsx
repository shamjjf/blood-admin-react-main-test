import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import { GlobalContext } from "../GlobalContext";
import phoneCode from "../../ValidPhoneCodes.json";
import SEO from "../SEO";
import ConfirmModal from "../Components/ConfirmModal";
import { useNavigate } from "react-router-dom";

const InputField = ({ label, value, name, onChange, disabled }) => {
  return (
    <div className="mb-4  ">
      <label htmlFor={name}>{label}</label>
      <input
        type="number"
        value={value}
        name={name}
        onChange={onChange}
        className="form-control form-control-sm"
        id={name}
        disabled={disabled}
      />
    </div>
  );
};

const Setting = () => {
  const [phoneCodes, setPhoneCodes] = useState(phoneCode.phoneCode);
  const [validatePhoneCodes, setValidatePhoneCodes] = useState(null);
  const [setting, setSetting] = useState({ maxQueueDistance: 0 });
  const [isEditable, setIsEditable] = useState(false);
  const { setLoading, alert } = useContext(GlobalContext);
  const [open, setOpen] = useState(false);
  const [open1, setOpen1] = useState(false);

  const dropdownRef = useRef(null);
  const dropdownRef1 = useRef(null);
  const [refetchUseEffect, setRefetchUseEffect] = useState(false);

  useEffect(() => {
    const getSettings = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/settings`, {
          headers: { Authorization: sessionStorage.getItem("auth") },
        });
        const { data } = res.data;

        const processedSettings = {
          ...data.setting,
          maxQueueDistance: data.setting.maxQueueDistance / 1000, // Adjust maxQueueDistance by dividing by 1000
        };
        setSetting(processedSettings);
        setValidatePhoneCodes(data.setting.validPhoneCodes);
      } catch (error) {
        // console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    getSettings();
  }, [setLoading, alert, refetchUseEffect]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // validation for the time intervals
    if (name === "phoneSmsTime" || name === "whatsappSmsTime" || name === "phoneCallTime") {
      if (value < 0 || value > setting.queueCriticalLoopMins) {
        swal("Error", "value cannot be greater than queue loop time or less than 0", "error");
        return;
      }
    }

    if (
      name === "bloodDays" ||
      name === "platelateDays" ||
      name === "queueRange" ||
      name === "queueCriticalLoopMins" ||
      name === "queueStableLoopMins" ||
      name === "maxQueueDistance"
    ) {
      if (value < 0) {
        swal("Error!", "Cannot accept a negative number!", "error");
        return;
      }
    }

    // Notification config bounds
    const intVal = parseInt(value);
    if (
      name === "notifyRadiusFirst" ||
      name === "notifyRadiusSecond" ||
      name === "notifyRadiusThird"
    ) {
      if (intVal < 1 || intVal > 500) {
        swal("Error!", "Radius must be between 1 and 500 km.", "error");
        return;
      }
    }
    if (name === "notifyBatchSize") {
      if (intVal < 1 || intVal > 100) {
        swal("Error!", "Batch size must be between 1 and 100.", "error");
        return;
      }
    }
    if (name === "autoCancelHours") {
      if (intVal < 1 || intVal > 168) {
        swal("Error!", "Auto-cancel hours must be between 1 and 168 (7 days).", "error");
        return;
      }
    }
    if (name === "reminderEveryDays") {
      if (intVal < 1 || intVal > 365) {
        swal("Error!", "Reminder frequency must be between 1 and 365 days.", "error");
        return;
      }
    }

    // Level thresholds must be ascending: Bronze <= Silver <= Gold <= Platinum
    if (
      name === "levelBronzeAt" ||
      name === "levelSilverAt" ||
      name === "levelGoldAt" ||
      name === "levelPlatinumAt"
    ) {
      if (intVal < 0) {
        swal("Error!", "Level threshold cannot be negative.", "error");
        return;
      }
      const next = { ...setting, [name]: intVal };
      if (next.levelBronzeAt > next.levelSilverAt || next.levelSilverAt > next.levelGoldAt || next.levelGoldAt > next.levelPlatinumAt) {
        swal("Error!", "Level thresholds must be in ascending order: Bronze ≤ Silver ≤ Gold ≤ Platinum.", "error");
        return;
      }
    }

    setSetting({
      ...setting,
      [name]: parseInt(value),
    });
  };

  // const handelPhondecodechange = (e) => {
  //   const selectedValues = Array.from(
  //     e.target.selectedOptions,
  //     (option) => option.value
  //   );
  //   // console.log(("Setting before", setting));
  //   const updation = setting;
  //   if (!updation.validPhoneCodes.includes(selectedValues[0])) {
  //     updation.validPhoneCodes.push(selectedValues[0]);
  //   } else {
  //     updation.validPhoneCodes = updation.validPhoneCodes.filter(
  //       (phcode) => phcode !== selectedValues[0]
  //     );
  //   }
  //   setSetting(updation);
  //   // console.log(("Setting after", updation));
  // };

  const handlePhoneCodeClick = (phcode) => {
    const updatedSetting = { ...setting };
    if (!updatedSetting.validPhoneCodes?.includes(phcode)) {
      updatedSetting.validPhoneCodes?.push(phcode);
    } else {
      updatedSetting.validPhoneCodes = updatedSetting.validPhoneCodes?.filter((code) => code !== phcode);
    }
    setSetting(updatedSetting);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);

      const updatedSettings = {
        ...setting,
        maxQueueDistance: setting.maxQueueDistance * 1000, // Convert to meters or the appropriate unit
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/updatesetting`, updatedSettings, {
        headers: {
          Authorization: sessionStorage.getItem("auth"),
          "content-type": "application/json",
        },
      });
      swal("Success!", "Your settings have been updated successfully!", "success");
      setIsEditable(false);
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

  const handleEditToggle = () => {
    setIsEditable(!isEditable);
    setRefetchUseEffect(!refetchUseEffect);
  };

  useEffect(() => {
    // Handler to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
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
  const [confirmModal, setConfirmModal] = useState(false);
  const navigate = useNavigate();
  const handlePurge = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      await axios.get(`${import.meta.env.VITE_API_URL}/add-test-data`, {
        headers: {
          Authorization: sessionStorage.getItem("auth"),
          "content-type": "application/json",
        },
      });
      swal("Success!", "Your have purged successfully!", "success");
      navigate("/login");
    } catch (error) {
      alert({
        type: "danger",
        title: "Error!",
        text: error.response.data.error,
      });
    } finally {
      setLoading(false);
      setConfirmModal(false);
    }
  };
  // console.log(confirmModal);
  return (
    <>
      <SEO title="Settings" />
      {confirmModal && <ConfirmModal setConfirmModal={setConfirmModal} handleSubmit={handlePurge} />}
      <div className="content-wrapper">
        <div className="d-flex mb-3 justify-content-between align-items-center">
          <p className="card-title p-0 m-0">Settings</p>
          <div className="d-flex gap-3">
            <button
              style={{
                maxWidth: "fit-content",
                borderRadius: "5px",
              }}
              className={`${isEditable ? "btn btn-outline-primary" : "btn btn-primary"}`}
              onClick={handleEditToggle}
            >
              {isEditable ? "Cancel" : "Edit"}
            </button>
            {isEditable && (
              <button
                style={{
                  maxWidth: "fit-content",
                  borderRadius: "5px",
                }}
                className={`btn btn-primary`}
                onClick={handleUpdate}
                disabled={!isEditable}
              >
                Save Settings
              </button>
            )}
          </div>
        </div>
        {/* <h4 className="card-title">Settings</h4> */}
        {setting ? (
          <div>
            <div className="d-grid-settings gap-3 ">
              {[
                {
                  title: "Blood Donation Settings",
                  description: "Manage settings related to blood and platelet donation timeframes.",
                  inputs: [
                    {
                      label: "Blood Donation Expiry (Days)",
                      value: setting.bloodDays,
                      name: "bloodDays",
                    },
                    {
                      label: "Platelet Donation Expiry (Days)",
                      value: setting.platelateDays,
                      name: "platelateDays",
                    },
                    {
                      label: "Logging Email Address",
                      value: setting.logEmail,
                      name: "logEmail",
                    },
                  ],
                },
                {
                  title: "Queue Management",
                  description: "Configure how the queue system should operate for requests.",
                  inputs: [
                    {
                      label: "Maximum Queue Distance (kms)",
                      value: setting.maxQueueDistance,
                      name: "maxQueueDistance",
                    },
                    {
                      label: "Queue Range (Requests)",
                      value: setting.queueRange,
                      name: "queueRange",
                    },
                    {
                      label: "Critical Queue Check Interval (Minutes)",
                      value: setting.queueCriticalLoopMins,
                      name: "queueCriticalLoopMins",
                    },
                    {
                      label: "Normal Queue Check Interval (Minutes)",
                      value: setting.queueStableLoopMins,
                      name: "queueStableLoopMins",
                    },
                  ],
                },
                {
                  title: "Communication Settings",
                  description: "Set time intervals for sending notifications to users.",
                  inputs: [
                    {
                      label: "SMS Time Interval (Minutes)",
                      value: setting.phoneSmsTime,
                      name: "phoneSmsTime",
                    },
                    {
                      label: "WhatsApp Time Interval (Minutes)",
                      value: setting.whatsappSmsTime,
                      name: "whatsappSmsTime",
                    },
                    {
                      label: "Phone Call Time Interval (Minutes)",
                      value: setting.phoneCallTime,
                      name: "phoneCallTime",
                    },
                  ],
                },
                {
                  title: "Points Allocation",
                  description: "Allocate points for user activities to encourage participation.",
                  inputs: [
                    {
                      label: "Referral Points",
                      value: setting.referalPoints,
                      name: "referalPoints",
                    },
                    {
                      label: "Donation Points",
                      value: setting.donationPoints,
                      name: "donationPoints",
                    },
                    {
                      label: "Contribution Points",
                      value: setting.contributionPoints,
                      name: "contributionPoints",
                    },
                  ],
                },
                {
                  title: "Notification Configuration",
                  description:
                    "Configure how blood requests fan out to nearby donors and how often inactive users are reminded.",
                  inputs: [
                    {
                      label: "First Reminder Radius (km)",
                      value: setting.notifyRadiusFirst,
                      name: "notifyRadiusFirst",
                    },
                    {
                      label: "Second Reminder Radius (km)",
                      value: setting.notifyRadiusSecond,
                      name: "notifyRadiusSecond",
                    },
                    {
                      label: "Third / Expansion Radius (km)",
                      value: setting.notifyRadiusThird,
                      name: "notifyRadiusThird",
                    },
                    {
                      label: "Donors Notified Per Batch (1–100)",
                      value: setting.notifyBatchSize,
                      name: "notifyBatchSize",
                    },
                    {
                      label: "Auto-cancel Unanswered Invite After (hours)",
                      value: setting.autoCancelHours,
                      name: "autoCancelHours",
                    },
                    {
                      label: "Reminder Frequency For Inactive Users (days)",
                      value: setting.reminderEveryDays,
                      name: "reminderEveryDays",
                    },
                  ],
                },
                {
                  title: "Gamification — Level Thresholds (points)",
                  description:
                    "Points needed to reach each tier. Levels are computed automatically from each user's points balance.",
                  inputs: [
                    { label: "Bronze starts at",   value: setting.levelBronzeAt,   name: "levelBronzeAt" },
                    { label: "Silver starts at",   value: setting.levelSilverAt,   name: "levelSilverAt" },
                    { label: "Gold starts at",     value: setting.levelGoldAt,     name: "levelGoldAt" },
                    { label: "Platinum starts at", value: setting.levelPlatinumAt, name: "levelPlatinumAt" },
                  ],
                },
                {
                  title: "Volunteer Settings",
                  description: "Control volunteer-related preferences and approvals.",
                  dropdowns: [
                    {
                      label: "Auto-Approve Volunteers",
                      value: setting.volunteerAutoApprove ? "Enabled" : "Disabled",
                      options: ["true", "false"],
                      onSelect: (value) => setSetting({ ...setting, volunteerAutoApprove: value === "true" }),
                    },
                    {
                      label: "Valid Phone Codes",
                      value: `${setting.validPhoneCodes?.length} codes selected`,
                      options: phoneCodes.map((code) => code.textCode),
                      onSelect: handlePhoneCodeClick,
                    },
                  ],
                },

                {
                  title: "Third-Party Integrations",
                  description: "Manage keys and IDs for external services.",
                  inputs: [
                    {
                      label: "MSG91 Auth Key",
                      value: setting.MSG91_AUTH_KEY,
                      name: "MSG91_AUTH_KEY",
                    },
                    {
                      label: "SMS Template ID",
                      value: setting.REQSMSTEMPLATEID,
                      name: "REQSMSTEMPLATEID",
                    },
                    {
                      label: "WhatsApp Integrated Number",
                      value: setting.REQINTEGRATEDNO,
                      name: "REQINTEGRATEDNO",
                    },
                    {
                      label: "Voice Call Template ID",
                      value: setting.REQVOICETEMPLATEID,
                      name: "REQVOICETEMPLATEID",
                    },
                    {
                      label: "Voice Caller ID",
                      value: setting.REQCALLERID,
                      name: "REQCALLERID",
                    },
                  ],
                },
              ].map((section, idx) => (
                <div className="card mb-4 mx-0 p-0  bg-white grid-item" key={idx}>
                  <div className="card-header bg-primary text-white">
                    <h5>{section.title}</h5>
                    <p className="small mb-0">{section.description}</p>
                  </div>
                  <div className="card-body ">
                    {section.inputs?.map((input, index) => (
                      <InputField
                        key={index}
                        label={input.label}
                        value={input.value}
                        name={input.name}
                        onChange={(e) => setSetting({ ...setting, [input.name]: e.target.value })}
                        disabled={!isEditable}
                      />
                    ))}

                    {section.dropdowns?.map((dropdown, index) => (
                      <div
                        style={{
                          position: "relative",
                        }}
                        className=""
                        key={`${dropdown.label}-${index}`}
                      >
                        <label>{dropdown.label}</label>
                        <div
                          className={`form-control mb-4 ${isEditable ? "" : "light-gray-homes"}`}
                          onClick={() => isEditable && setOpen1(open1 ? false : `${dropdown.label}-${index}`)}
                          style={{ cursor: isEditable ? "pointer" : "default" }}
                        >
                          {dropdown.value}
                        </div>
                        {open1 === `${dropdown.label}-${index}` && (
                          <ul
                            style={{
                              position: "absolute",
                              backgroundColor: "white",
                              width: "100%",
                              zIndex: 2,
                              marginTop: -20,
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                            className="shadow p-0"
                          >
                            {dropdown.options.map((option, idx) => (
                              <>
                                <li
                                  key={idx}
                                  className={`dropdown-item text-capitalize ${
                                    setting?.validPhoneCodes?.includes(option) ? "bg-primary text-white" : ""
                                  }`}
                                  onClick={() => dropdown.onSelect(option)}
                                >
                                  {phoneCode?.phoneCode?.find((item) => item.textCode === option && item.country)
                                    ?.country || option}
                                </li>
                              </>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="d-flex justify-content-between">
              <button className="btn btn-danger" onClick={() => setConfirmModal(!confirmModal)}>
                Purge
              </button>
              <button
                style={{
                  maxWidth: "fit-content",
                  borderRadius: "5px",
                }}
                className={`btn btn-primary`}
                onClick={handleUpdate}
                disabled={!isEditable}
              >
                Save Settings
              </button>
            </div>
          </div>
        ) : (
          <h3>Setting Not Found</h3>
        )}
      </div>
    </>
  );
};

export default Setting;
