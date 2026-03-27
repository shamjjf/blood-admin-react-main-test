import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../GlobalContext";

function Profile() {
  const [user, setUser] = useState({ name: "", emailId: "", phoneCode: 91, phone: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const { alert } = useContext(GlobalContext);

  const fetchMyself = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin`, {
        headers: {
          Authorization: sessionStorage.getItem("auth"),
        },
      });
      const { name, emailId, phoneCode, phone } = response.data.admin;
      setUser({ name, emailId, phoneCode, phone });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const validateInputs = () => {
    const newErrors = {};
    if (!user.name.trim()) newErrors.name = "Name is required.";
    // console.log(!user.emailId.trim());
    if (!user.emailId.trim()) {
      newErrors.emailId = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.emailId)) {
      newErrors.emailId = "Invalid email format.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validatePasswordInputs = () => {
    const newErrors = {};
    if (!passwordData.currentPassword.trim()) newErrors.currentPassword = "Current password is required.";
    if (!passwordData.newPassword.trim()) newErrors.newPassword = "New password is required.";
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateProfile = async () => {
    if (!validateInputs()) return;

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin`,
        { name: user.name, emailId: user.emailId },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );
      setIsEditing(false);
      alert({ type: "success", title: "Success!", text: "Admin Updated Successfully!" });
    } catch (error) {
      console.error("Error updating profile:", error);
      alert({
        type: "danger",
        title: "Error!",
        text: error.response.data.error,
      });
    }
  };
  const changePassword = async () => {
    if (!validatePasswordInputs()) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/change-password`,
        { ...passwordData },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );
      setPasswordData({ currentPassword: "", newPassword: "" });
      alert({ type: "success", title: "Success!", text: "Password Changed Successfully!" });
    } catch (error) {
      console.error("Error changing password:", error);
      alert({
        type: "danger",
        title: "Error!",
        text: error.response.data.error,
      });
    }
  };

  useEffect(() => {
    fetchMyself();
  }, []);
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };
  return (
    <div className="content-wrapper">
      <div className="card mb-4 mx-0 p-0 bg-white grid-item">
        <div className="card-header bg-primary text-white">
          <h5 className="p-0 m-0">Profile Information</h5>
        </div>
        <div className="card-body">
          <div className="form-group row">
            <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
              Name<span className="text-danger">*</span>
            </label>
            <div className="col-sm-9">
              <input
                type="text"
                name="name"
                className="form-control"
                value={user.name}
                disabled={!isEditing}
                onChange={handleInputChange}
              />
              {errors.name && <span className="text-danger">{errors.name}</span>}
            </div>
          </div>
          <div className="form-group row">
            <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
              Email ID
            </label>
            <div className="col-sm-9">
              <input
                type="email"
                name="emailId"
                className="form-control"
                value={user.emailId}
                disabled={true}
                onChange={handleInputChange}
              />
              {errors.emailId && <span className="text-danger">{errors.emailId}</span>}
            </div>
          </div>
          <div className="form-group row">
            <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
              Phone
            </label>
            <div className="col-sm-9">
              <input type="text" className="form-control" value={`+${user.phoneCode} ${user.phone}`} disabled />
            </div>
          </div>
          <div className="d-flex justify-content-end">
            {isEditing ? (
              <>
                <button className="btn btn-secondary me-2" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={updateProfile}>
                  Save
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="card mb-4 mx-0 p-0 bg-white grid-item">
        <div className="card-header bg-primary text-white">
          <h5 className="p-0 m-0">Change Password</h5>
        </div>
        <div className="card-body">
          <div className="form-group row">
            <label className="col-form-label" style={{ width: "130px", paddingLeft: "10px" }}>
              Current Password<span className="text-danger">*</span>
            </label>
            <div className="col-sm-9">
              <input
                type="password"
                name="currentPassword"
                className="form-control"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
              />
              {passwordErrors.currentPassword && <span className="text-danger">{passwordErrors.currentPassword}</span>}
            </div>
          </div>
          <div className="form-group row mt-3">
            <label className="col-form-label" style={{ width: "130px", paddingLeft: "10px" }}>
              New Password<span className="text-danger">*</span>
            </label>
            <div className="col-sm-9">
              <input
                type="password"
                name="newPassword"
                className="form-control"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
              />
              {passwordErrors.newPassword && <span className="text-danger">{passwordErrors.newPassword}</span>}
            </div>
          </div>
          <div className="d-flex justify-content-end mt-3 gap-3">
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setPasswordData({ currentPassword: "", newPassword: "" });
                setPasswordErrors({});
              }}
            >
              Clear
            </button>
            <button className="btn btn-primary" onClick={changePassword}>
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
