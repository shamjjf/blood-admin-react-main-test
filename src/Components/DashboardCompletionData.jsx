import React from "react";

const DashboardCompletionData = ({ svg, title, count }) => {
  return (
    <div className="border rounded border-primary bg-white shadow-sm p-1  d-flex justify-content-start gap-3 align-items-center p-2">
      <div style={{ width: "50px", height: "50px",minWidth:50 }} className="d-flex justify-content-center align-items-center bg-primary text-white rounded-5 my-3">{svg}</div>
      <div className="">
        <h6 className="text-gray fw-bold mb-1">{title}</h6>
        <span className="text-primary fw-semibold fs-5">{count || 0}</span>
      </div>
    </div>
  );
};

export default DashboardCompletionData;
