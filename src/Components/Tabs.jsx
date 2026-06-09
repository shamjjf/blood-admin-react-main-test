import React, { useState } from "react";

// Tab switcher, matching the verification tabs on the Organizations /
// Colleges list pages so detail pages stay visually consistent.
// `tabs` is an object keyed by tab id; each entry has:
//   { label, onClick, render, count? }
// `accent`  controls the active colour (defaults to the list-page sky blue).
// `variant` chooses the look:
//   "underline" (default) — text + bottom border, the original style.
//   "pill"                — red-style filled button with white text when
//                           active (matches the NGO panel filter tabs).
// Optionally controlled: pass `active` (a tab key) + `onChange(key)` to drive
// the active tab from the parent — needed when the parent switches tabs
// programmatically (e.g. jump to "history" after a successful send). When
// `active` is omitted the component manages its own state as before.
function Tabs({ tabs, accent = "#0EA5E9", variant = "underline", active: controlledActive, onChange }) {
  const [internalActive, setInternalActive] = useState(Object.keys(tabs)[0]);
  const active = controlledActive != null ? controlledActive : internalActive;
  const isPill = variant === "pill";

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 6,
          borderBottom: isPill ? "none" : "1px solid #e5e7eb",
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        {Object.entries(tabs)?.map(([key, tab]) => {
          const isActive = active === key;
          const baseStyle = {
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          };
          const style = isPill
            ? {
                ...baseStyle,
                padding: "6px 14px",
                borderRadius: 6,
                border: "1px solid",
                borderColor: isActive ? accent : "#e2e8f0",
                background: isActive ? accent : "white",
                color: isActive ? "white" : "#475569",
                fontSize: 12,
                fontWeight: 700,
                transition: "all 0.12s",
              }
            : {
                ...baseStyle,
                background: "none",
                border: "none",
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: isActive ? accent : "#6b7280",
                borderBottom: `2px solid ${isActive ? accent : "transparent"}`,
              };
          return (
            <button
              key={key}
              type="button"
              onClick={(e) => {
                if (controlledActive == null) setInternalActive(key);
                onChange?.(key);
                tab?.onClick?.(e);
              }}
              style={style}
            >
              {tab?.label}
              {tab?.count != null && (
                <span
                  style={{
                    background: isActive
                      ? isPill
                        ? "rgba(255,255,255,0.25)"
                        : accent
                      : "#e5e7eb",
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
