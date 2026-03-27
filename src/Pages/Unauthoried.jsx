// UnauthorizedPage.js

import React from "react";
import { Link } from "react-router-dom";

const UnauthorizedPage = () => {
  return (
    <div className="content-wrapper unauthorized-page">
      <h1>401 Unauthorized</h1>
      <p>Oops! You don't have permission to access this page.</p>
      <Link
        className="btn btn-info mt-3"
        style={{ borderRadius: "5px" }}
        to="/"
      >
        {" "}
        Back To Dashboard{" "}
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
