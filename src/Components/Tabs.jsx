import React, { useState } from "react";

function Tabs({ tabs }) {
  const [active, setActive] = useState(Object.keys(tabs)[0]);

  return (
    <div className="">
      <ul className="nav nav-tabs mb-3">
        {Object.entries(tabs)?.map(([key, tab]) => (
          <li key={key} className="nav-item">
            <button
              onClick={(e) => {
                setActive(key);
                tab?.onClick(e);
              }}
              className={`py-2 px-4  border mx-1 rounded-top ${active === key ? "active bg-primary text-white " : ""}`}
            >
              {tab?.label}
            </button>
          </li>
        ))}
      </ul>
      {tabs[active].render}
    </div>
  );
}

export default Tabs;
