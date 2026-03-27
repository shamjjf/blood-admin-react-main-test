import React, { useState } from "react";
import DoughnutChart from "./DoughnutChart";

const DashboardSummary = ({  summaryData, summaryText, noData, isPercentage=true}) => {

  return (
    <div className=" rounded-lg flex flex-col gap-y-1 min-w-[340px] w-100 h-[30rem]">
      <h4  className=" w-100 my-3  text-center font-bold">{summaryText}</h4>
      <span className=" w-100 flex justify-center items-center text-primary fs-4">
        {noData? <div style={{
          width: "100%",
          height: "150px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }} className="w-100 text-center ">No Data Found.</div> : <DoughnutChart data={summaryData} />}
      </span>
      <div>
        {summaryData?.map((data) => (
          <div key={data?.dataName} className="d-flex w-100 justify-content-between align-items-center pb-4 px-5 mx-auto">
            <span className="d-flex gap-2 align-items-center">
           <div style={{ width: "10px", height: "10px", backgroundColor: data?.color }} className=" rounded"></div>

              {data?.dataName}
            </span>
            <span>{Math.floor(data?.percentageValue) || 0 }{ isPercentage ? "%" : "" }</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardSummary;
