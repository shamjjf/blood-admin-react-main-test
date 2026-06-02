import React, { useState } from "react";

// Underline-style tab switcher, matching the verification tabs on the
// Organizations / Colleges list pages so detail pages stay visually
// consistent. `tabs` is an object keyed by tab id; each entry has:
//   { label, onClick, render, count? }
// `accent` controls the active colour (defaults to the list-page sky blue).
function Tabs({ tabs, accent = "#0EA5E9" }) {
  const [active, setActive] = useState(Object.keys(tabs)[0]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 6,
          borderBottom: "1px solid #e5e7eb",
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        {Object.entries(tabs)?.map(([key, tab]) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={(e) => {
                setActive(key);
                tab?.onClick?.(e);
              }}
              style={{
                background: "none",
                border: "none",
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: isActive ? accent : "#6b7280",
                borderBottom: `2px solid ${isActive ? accent : "transparent"}`,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              {tab?.label}
              {tab?.count != null && (
                <span
                  style={{
                    background: isActive ? accent : "#e5e7eb",
                    color: isActive ? "white" : "#6b7280",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 8px",
                    borderRadius: 999,
                    minWidth: 22,
                    textAlign: "center",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {tabs[active].render}
    </div>
  );
}

export default Tabs;
