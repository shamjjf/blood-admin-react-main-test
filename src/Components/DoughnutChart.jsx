import React, { useEffect, useRef, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ data }) => {
  const chartData = {
    labels: data.map((item) => item.dataName),
    datasets: [
      {
        data: data.map((item) => item.percentageValue ||0),
        backgroundColor: data.map((item) => item.color),
        hoverBackgroundColor: data.map((item) => item.hoverColor),
        hoverOffset: 8, // This adds a small offset on hover, visually highlighting the segment
        borderWidth: 1, // Border width to make segments distinct
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: true, // Ensures tooltips are enabled
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const label = data[index].dataName || "";
            const value = context.raw || 0;
            return `${label}: ${value}%`;
          },
        },
      },
      legend: {
        display: false,
        position: "bottom",
      },
    },
    hover: {
      mode: "nearest", // This ensures the hovered segment is nearest to the pointer
    },
  };

  return (
    <div className="relative w-full h-[200px]">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default DoughnutChart;
