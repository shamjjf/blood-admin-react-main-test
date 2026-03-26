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

const FirebaseSetting = () => {
  const [setting, setSetting] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const { setLoading, alert } = useContext(GlobalContext);
  const [refetchUseEffect, setRefetchUseEffect] = useState(false);

  useEffect(() => {
    const getSettings = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/firebase`, {
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

  // const handleChange = (e) => {
  //   const { name, value } = e.target;

  //   setSetting({
  //     ...setting,
  //     [name]: value,
  //   });
  // };
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Only transform the value of `appConfig` when it is the correct field
    if (name === "appConfig") {
      // Step 1: Trim whitespace and remove the surrounding curly braces
      let transformedValue = value.trim().replace(/^{|}$/g, "");

      // Step 2: Split the input by commas to get key-value pairs
      const keyValuePairs = transformedValue.split(",").map((pair) => pair.trim());

      // Step 3: Transform each key-value pair
      const transformedKeyValuePairs = keyValuePairs.map((pair) => {
        // Step 4: Split by the first colon (:) to get the key and value
        const indexOfColon = pair.indexOf(":");
        if (indexOfColon === -1) return pair; // If no colon is found, just return the pair as-is

        const key = pair.slice(0, indexOfColon).trim();
        const val = pair.slice(indexOfColon + 1).trim();

        // Step 5: Add double quotes around the key and return the transformed key-value pair
        return `"${key}": ${val}`;
      });

      // Step 6: Rebuild the object string, removing the trailing comma if present
      transformedValue = `{ ${transformedKeyValuePairs.join(", ").replace(/, $/, "")} }`;

      // Update the state with the transformed value
      setSetting({
        ...setting,
        [name]: transformedValue,
      });
    } else {
      // For other fields, just update normally
      setSetting({
        ...setting,
        [name]: value,
      });
    }
  };

  const handleUpdate = async () => {
    try {
      if (setting.dburl === "") {
        swal("Error!", "Database URL cannot be empty!", "error");
        return;
      }
      if (setting.credential === "") {
        swal("Error!", "Credentials cannot be empty!", "error");
        return;
      }

      setLoading(true);

      await axios.patch(`${import.meta.env.VITE_API_URL}/firebase/${setting._id}`, setting, {
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
      <SEO title="Firebase Setting" />
      <div className="d-flex mb-3 justify-content-between align-items-center">
        <p className="card-title p-0 m-0">Firebase Setting</p>
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
                label="Database URL"
                value={setting.dburl}
                name="dburl"
                onChange={handleChange}
                disabled={!isEditable}
                className="override"
              />
              {/* <InputField
                  label="Credential"
                  value={setting.credential}
                  name="credential"
                  onChange={handleChange}
                  disabled={!isEditable}
                  className="override"
                /> */}

              <div className="mb-4">
                <label htmlFor={"credential"}>{"Credential"}</label>
                <textarea
                  style={{ height: "315px" }}
                  type="text"
                  value={setting.credential}
                  name={"credential"}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                  disabled={!isEditable}
                  id={"credential"}
                ></textarea>
              </div>

              <div className="mb-4">
                <label htmlFor={"appConfig"}>{"App config"}</label>
                <textarea
                  style={{ height: "315px" }}
                  type="text"
                  value={setting.appConfig}
                  name={"appConfig"}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                  disabled={!isEditable}
                  id={"appConfig"}
                ></textarea>
              </div>
            </div>

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

export default FirebaseSetting;
