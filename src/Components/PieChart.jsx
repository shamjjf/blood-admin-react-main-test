import React from "react";

function PieChart({ use, max, name }) {
  return (
    <div className="h-100">
      {" "}
      <div className="col-md-12 p-0 m-0 grid-margin transparent h-100">
        <div className="card shadow  col-md-12   p-0 my-0  pb-2 ">
          <p className="h4 ms-3 mt-3 font-weight-bold ">{name}</p>
          <div className="text-center mb-0 pb-0 p-0 m-0">
            <div
              className="pie animate "
              style={{
                "--p": `${(use / max) * 100} `,
              }}
            >
              <div
                style={{
                  borderRadius: "50%",
                  width: "80px ",
                  height: "80px",
                  boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
                }}
                className=" rounded-circle d-flex align-items-center justify-content-center"
              >
                <p style={{ fontSize: "10px" }} className="rotate p-0 m-0 "></p>
                <p className="rotate p-0 m-0">{use}</p>
              </div>
            </div>
          </div>
          <div className="text-center d-flex pt-2 pb-2 ps-4 pe-4 m-0 ">
            <div className="text-center h5 col-md-12 p-0 m-0">
              <div className="d-flex  col-md-12 p-0 m-0">
                <div className="d-flex col-md-6 p-0">
                  <div
                    style={{
                      backgroundColor: "#00A2FF",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                    }}
                    className="mt-2 mx-2"
                  ></div>
                  <div className="mt-1">Remaining </div>
                </div>
                <div className="d-flex p-0 col-md-4 text-end">
                  <p className="font-weight-bold m-1 col-md-8  p-0 m-0">
                    {name === "Storage" ? (max - use).toFixed(0) : max - use}{" "}
                    {name === "Storage" ? "GB" : ""}
                  </p>
                  <p
                    style={{
                      background: "#00A2FF",
                      fontWeight: "bold",
                      // color: "#2563EB",
                    }}
                    className="badge align-items-center justify-content-center d-flex col-md-8"
                  >
                    {(100 - (use / max) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="d-flex  col-md-12 p-0 m-0">
                <div className="d-flex col-md-6 p-0">
                  <div
                    style={{
                      backgroundColor: "#2A41D5",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                    }}
                    className="mt-2 mx-2"
                  ></div>
                  <div className="mt-1">Used </div>
                </div>
                <div className="d-flex p-0 col-md-4 text-end">
                  <p className="font-weight-bold m-1 col-md-8  p-0 m-0">
                    {use} {name === "Storage" ? "GB" : ""}
                  </p>
                  <p
                    style={{
                      backgroundColor: "#2A41D5",
                      fontWeight: "bold",
                      // color: "#00A2FF",
                    }}
                    className="badge col-md-8 align-items-center justify-content-center d-flex"
                  >
                    {((parseFloat(use) / parseFloat(max)) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* <img width={400} src={ProLogo} alt="" /> */}
        </div>{" "}
      </div>
    </div>
  );
}
export default PieChart;
