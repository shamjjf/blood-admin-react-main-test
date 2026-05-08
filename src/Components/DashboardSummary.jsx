import React from "react";
import DoughnutChart from "./DoughnutChart";

const tagColor = (text) => {
  if (text.toLowerCase().includes("blood")) return "red";
  if (text.toLowerCase().includes("platelet")) return "blue";
  if (text.toLowerCase().includes("task")) return "amber";
  if (text.toLowerCase().includes("user") && !text.toLowerCase().includes("special")) return "blue";
  if (text.toLowerCase().includes("special")) return "purple";
  if (text.toLowerCase().includes("camp")) return "green";
  return "gray";
};

const DashboardSummary = ({ summaryData, summaryText, noData, isPercentage = true }) => {
  const total = isPercentage
    ? null
    : summaryData?.reduce((a, b) => a + (b.percentageValue || 0), 0);

  return (
    <div className="lsa-chart-card lsa-fade">
      {/* Head */}
      <div className="lsa-chart-head">
        <div>
          <div className="lsa-chart-title">{summaryText}</div>
          <div className="lsa-chart-sub">
            {noData ? "No data yet" : `${isPercentage ? "Percentage" : "Count"} breakdown`}
          </div>
        </div>
        <span className={`lsa-chart-tag ${tagColor(summaryText)}`}>
          {noData ? "Empty" : isPercentage ? "%" : total ?? "—"}
        </span>
      </div>

      {/* Chart or empty */}
      <div style={{ padding: "16px 18px 8px", display: "flex", justifyContent: "center" }}>
        {noData ? (
          <div className="lsa-no-data">
            <i className="ti ti-chart-donut" />
            <span>No Data Found</span>
          </div>
        ) : (
          <DoughnutChart data={summaryData} />
        )}
      </div>

      {/* Legend */}
      {summaryData?.map((d) => (
        <div className="lsa-legend-item" key={d.dataName}>
          <div className="lsa-legend-left">
            <div className="lsa-legend-dot" style={{ background: d.color }} />
            {d.dataName}
          </div>
          <div className="lsa-legend-val">
            {Math.floor(d.percentageValue) || 0}
            {isPercentage ? "%" : ""}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardSummary;
