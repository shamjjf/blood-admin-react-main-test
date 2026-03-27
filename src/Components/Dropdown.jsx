import React, { useState, useContext } from "react";
import { GlobalContext } from "../GlobalContext";
import axios from "axios";
import Swal from "sweetalert2";

const Dropdown = ({ adminId, roles }) => {
  const fixedRoles = ["tasks", "requests", "users", "settings"];
  const [selectedRole, setSelectedRole] = useState(roles[0] || ""); // Default to the first role or empty
  const { setLoading } = useContext(GlobalContext);

  const handleSelect = async (event) => {
    const role = event.target.value;

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: sessionStorage.getItem("auth"),
        },
      };

      // Send request to the server
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/addRoles/${adminId}`, { role }, config);
      // console.log("response :>> ", response);
      if (response.status === 200) {
        setSelectedRole(role);
      }
    } catch (error) {
      console.log("error :>> ", error?.response?.data?.error);
      Swal.fire({ title: "", text: error?.response?.data?.error, icon: "error" });

      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      id="role-select"
      value={selectedRole}
      onChange={handleSelect}
      className="bg-info py-2 px-4"
      style={{
        borderRadius: 5,
        borderRight: "10px solid transparent !important",
        borderLeft: 0,
        borderTop: 0,
        borderBottom: 0,
      }}
    >
      <option value="" disabled>
        Choose a role
      </option>
      {fixedRoles.map((role, index) => (
        <option className={`${roles.includes(role) ? "bg-info" : "bg-white"}`} key={index} value={role}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </option>
      ))}
    </select>
  );
};

export default Dropdown;
