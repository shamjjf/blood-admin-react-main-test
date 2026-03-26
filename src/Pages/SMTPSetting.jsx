import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import { GlobalContext } from "../GlobalContext";
import SEO from "../SEO";

const InputField = ({ label, value, name, onChange, disabled }) => {
  return (
    <div className="mb-4" style={{ width: "350px" }}>
      <label htmlFor={name}>{label}</label>
      <input
        type="text"
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

const SMTPSetting = () => {
  const [setting, setSetting] = useState();
  const [isEditable, setIsEditable] = useState(false);
  const { setLoading, alert } = useContext(GlobalContext);
  const [refetchUseEffect, setRefetchUseEffect] = useState(false);

  useEffect(() => {
    const getSettings = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/smtp`, {
          headers: { Authorization: sessionStorage.getItem("auth") },
        });

        // console.log(res.data);
        setSetting(res.data);
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

    setSetting({
      ...setting,
      [name]: value,
    });
  };

  const handleUpdate = async () => {
    try {
      if (setting.host === "") {
        swal("Error!", "Host cannot be empty!", "error");
        return;
      }
      if (setting.port === "") {
        swal("Error!", "Port cannot be empty!", "error");
        return;
      }
      if (setting.userName === "") {
        swal("Error!", "User Name cannot be empty!", "error");
        return;
      }
      if (setting.password === "") {
        swal("Error!", "Password cannot be empty!", "error");
        return;
      }
      if (setting.fromEmail === "") {
        swal("Error!", "From Email cannot be empty!", "error");
        return;
      }
      if (setting.fromName === "") {
        swal("Error!", "From Name cannot be empty!", "error");
        return;
      }

      setLoading(true);

      await axios.patch(`${import.meta.env.VITE_API_URL}/smtp/${setting._id}`, setting, {
        headers: {
          Authorization: sessionStorage.getItem("auth"),
        },
      });
      swal("Success!", "Your settings have been updated successfully!", "success");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setIsEditable(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditable(!isEditable);
    setRefetchUseEffect(!refetchUseEffect);
  };

  return (
    <div className="content-wrapper">
      <SEO title="SMTP Setting" />
      <div className="d-flex mb-3 justify-content-between align-items-center">
        <p className="card-title p-0 m-0">SMTP Setting</p>
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
      </div>{" "}
      {setting ? (
        <div className="card">
          <div className="card-body settings-card">
            <div className="form-group row">
              <InputField
                label="Host"
                value={setting.host}
                name="host"
                onChange={handleChange}
                disabled={!isEditable}
                className="override"
              />
              <InputField
                label="Port"
                value={setting.port}
                name="port"
                onChange={handleChange}
                disabled={!isEditable}
                className="override"
              />

              <InputField
                label="User Name"
                value={setting.userName}
                name="userName"
                onChange={handleChange}
                disabled={!isEditable}
                className="override"
              />
              <InputField
                label="Password"
                value={setting.password}
                name="password"
                onChange={handleChange}
                disabled={!isEditable}
                className="override"
              />
              <InputField
                label="From Email"
                value={setting.fromEmail}
                name="fromEmail"
                onChange={handleChange}
                disabled={!isEditable}
                className="override"
              />
              <InputField
                label="From Name"
                value={setting.fromName}
                name="fromName"
                onChange={handleChange}
                disabled={!isEditable}
                className="override"
              />
            </div>

            {/* <div className="form-group row"> */}

            <div className="w-100 text-end px-3">
              {/* <button
                style={{
                  maxWidth: "fit-content",
                  borderRadius: "5px",
                }}
                className={`btn btn-primary`}
                onClick={handleUpdate}
                disabled={!isEditable}
              >
                Save Settings
              </button> */}
            </div>
            {/* </div> */}
          </div>
        </div>
      ) : (
        <h3>Setting Not Found</h3>
      )}
    </div>
  );
};

export default SMTPSetting;
