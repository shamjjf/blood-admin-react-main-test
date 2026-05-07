import React from "react";

const DashboardCompletionData = ({ svg, title, count, color }) => {
  // If a custom `color` is provided, use inline styles; otherwise fall back to bg-primary.
  const useCustom = !!color;

  return (
    <div
      className="border rounded bg-white shadow-sm p-1 d-flex justify-content-start gap-3 align-items-center p-2"
      style={useCustom ? { borderColor: color } : undefined}
    >
      <div
        style={{
          width: "50px",
          height: "50px",
          minWidth: 50,
          ...(useCustom ? { backgroundColor: color } : {}),
        }}
        className={`d-flex justify-content-center align-items-center text-white rounded-5 my-3 ${
          useCustom ? "" : "bg-primary"
        }`}
      >
        {svg}
      </div>
      <div>
        <h6 className="text-gray fw-bold mb-1">{title}</h6>
        <span
          className={`fw-semibold fs-5 ${useCustom ? "" : "text-primary"}`}
          style={useCustom ? { color } : undefined}
        >
          {count || 0}
        </span>
      </div>
    </div>
  );
};

export default DashboardCompletionData;
