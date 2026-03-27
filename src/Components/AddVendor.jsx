import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../GlobalContext";
import swal from "sweetalert";
import { formatDate } from "./FormatedDate";
import RequestItems from "./RequestItems";

const AddVendor = ({ setShowAddVendorForm, viewData, setViewData }) => {
  const { setLoading, alert } = useContext(GlobalContext);

  const [createVendor, setCreateVendor] = useState({
    qrCode: [],
    bankDetails: {},
  });
  const uploadProfilePicture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { name, size, type } = file;
    const res = await axios.post(
      `${import.meta.env.VITE_API_UPLOAD}/upload-test`,
      { name, size, mime: type },
      {
        headers: { "content-type": "application/json" },
      }
    );
    const { data } = res;

    const fd = new FormData();
    setCreateVendor((prevcreateVendor) => ({
      ...prevcreateVendor, // Preserve previous state values
      qrCode: [...prevcreateVendor.qrCode, data.data._id], // Append the new ID to the qrCode array
    }));
    for (const [key, val] of Object.entries(data.data.fields)) fd.append(key, val);
    fd.append("file", file);
    const ress = await fetch(data.data.url, { method: "POST", body: fd });
    // console.log("the ress is", ress);

    if (data.url) {
      // console.log("this is the avaURL", data.url);
      setavaURL(data.url);
    }
  };
  const [customVendorFlag, setCustomVendorFlag] = useState(false);

  // // console.log("TaskCategories: ", taskCategory);
  const [mainTask, setMainTask] = useState({
    title: "",
    type: "direct",
    requestedItems: [],
    vendor: [],
  });

  const handleChangeForVendor = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "shopName") {
      if (value.length > 60) {
        swal("Error", "Maximum characters reached!", "error");
        return;
      }
    }
    if (name === "ownerName") {
      if (value.length > 40) {
        swal("Error", "Maximum characters reached!", "error");
        return;
      }
    }
    if (name === "mobileNumber") {
      if (!/^\d+$/.test(value) || value.length > 10 || value <= 0) {
        swal("Error", "Wrong phone number!", "error");
        return;
      }
    }
    if (name === "accountNumber") {
      if (value.length > 40) {
        swal("Error", "Maximum characters reached!", "error");
        return;
      }
    }
    if (name === "ifcCode") {
      if (value.length > 40) {
        swal("Error", "Maximum characters reached!", "error");
        return;
      }
    }
    if (name === "bankName") {
      if (value.length > 40) {
        swal("Error", "Maximum characters reached!", "error");
        return;
      }
    }

    if (name === "accountNumber" || name === "ifcCode" || name === "bankName") {
      setCreateVendor((prevCreateVendor) => ({
        ...prevCreateVendor,
        bankDetails: {
          ...prevCreateVendor.bankDetails,
          [name]: value,
        },
      }));
    } else if (name == "qrCode") {
      setCreateVendor((prevCreateVendor) => ({
        ...prevCreateVendor,
        qrCode: [...prevCreateVendor.qrCode, value],
      }));
    } else {
      // Handle other fields if necessary
      setCreateVendor((prevcreateVendor) => ({
        ...prevcreateVendor,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //   validation pending for the whole form

    // step1- create the vendor
    try {
      setLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_CONTRI}/vendor`, createVendor);
      // console.log("res :>> ", res);
      swal("Success", "Your Vendor has been Added Successfully!", "success");
      setShowAddVendorForm(false);
    } catch (error) {
      console.log(error);
      swal("Error", "Failed to create a vendor!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="myupdatedcard">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="card-title">{viewData ? "View Vendor" : "Add Vendor"}</h4>
          <button
            onClick={() => setShowAddVendorForm(false)}
            className="btn btn-danger btn-rounded btn-icon cusing"
            style={{ fontSize: "1.2rem", padding: "8px 12px" }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        {viewData ? (
          <div className="view-data-container bg-white">
            <div className="card p-4 shadow-sm ">
              <div className="mb-3">
                <strong>Shop Name:</strong> {viewData.shopName}
              </div>
              <div className="mb-3">
                <strong>Owner Name:</strong> {viewData.ownerName}
              </div>
              <div className="mb-3">
                <strong>Mobile Number:</strong> {viewData.mobileNumber}
              </div>
              <div className="mb-3">
                <strong>Shop Address:</strong> {viewData.shopAddress}
              </div>
              {/* <div className="mb-3">
        <strong>QR Codes:</strong>
        <div className="d-flex flex-wrap">
          {viewData.qrCode && viewData.qrCode.length > 0 ? (
            viewData.qrCode.map((qr, index) => (
              <div key={index} className="me-2">
                <img
                  src={qr} // Replace with actual file path or URL
                  alt={`QR Code ${index + 1}`}
                  style={{ width: "80px", height: "80px", objectFit: "cover" }}
                  className="rounded border"
                />
              </div>
            ))
          ) : (
            <span>No QR codes available</span>
          )}
        </div>
      </div> */}
              <div className="mb-3">
                <strong>Bank Details:</strong>
                <ul className="list-unstyled ms-3">
                  <li>
                    <strong>Account Number:</strong> {viewData.bankDetails?.accountNumber}
                  </li>
                  <li>
                    <strong>IFSC Code:</strong> {viewData.bankDetails?.ifcCode}
                  </li>
                  <li>
                    <strong>Bank Name:</strong> {viewData.bankDetails?.bankName}
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-4 text-end">
              <button
                onClick={() => {
                  setViewData("");
                  setShowAddVendorForm(false);
                }}
                className="btn btn-primary"
                style={{ fontSize: "1rem" }}
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <form className="forms-sample" onSubmit={handleSubmit}>
            <div className="d-flex flex-wrap col-12 col-md-12">
              <div className="form-grou mb-4 col-12 col-lg-6 ">
                <label htmlFor="shopName">
                  Shop Name <span className="text-danger">*</span> :
                </label>
                <input
                  onChange={handleChangeForVendor}
                  type="text"
                  className="form-control"
                  id="shopName"
                  name="shopName"
                  placeholder="Shop Name"
                  value={createVendor.shopName}
                  required
                />
              </div>

              <div className="form-grou mb-4 col-12 col-lg-6">
                <label htmlFor="ownerName">
                  Owner Name <span className="text-danger">*</span> :
                </label>
                <input
                  onChange={handleChangeForVendor}
                  type="text"
                  className="form-control"
                  id="ownerName"
                  name="ownerName"
                  placeholder="Owner Name"
                  value={createVendor.ownerName}
                  required
                />
              </div>

              <div className="form-grou mb-4 col-12 col-lg-6">
                <label htmlFor="mobileNumber">
                  Mobile Number <span className="text-danger">*</span> :
                </label>
                <input
                  onChange={handleChangeForVendor}
                  type="number"
                  className="form-control"
                  id="mobileNumber"
                  name="mobileNumber"
                  placeholder="Mobile Number"
                  value={createVendor.mobileNumber}
                  required
                />
              </div>

              <div className="form-grou mb-4 col-12 col-lg-6">
                <label htmlFor="shopAddress">
                  Shop Address <span className="text-danger">*</span> :
                </label>
                <input
                  type="text"
                  onChange={handleChangeForVendor}
                  className="form-control"
                  id="shopAddress"
                  name="shopAddress"
                  placeholder="Shop Address"
                  value={createVendor.shopAddress}
                  required
                />
              </div>
              <div className="form-grou mb-4 col-12 col-lg-6">
                <label htmlFor="bankName">
                  Bank Name <span className="text-danger">*</span> :
                </label>
                <input
                  onChange={handleChangeForVendor}
                  type="text"
                  className="form-control"
                  id="bankName"
                  name="bankName"
                  placeholder="Bank Name"
                  value={createVendor.bankDetails?.bankName}
                  required
                />
              </div>
              <div className="form-grou mb-4 col-12 col-lg-6">
                <label htmlFor="accountNumber">
                  Account Number <span className="text-danger">*</span> :
                </label>
                <input
                  onChange={handleChangeForVendor}
                  type="text"
                  className="form-control"
                  id="accountNumber"
                  name="accountNumber"
                  placeholder="Account Number"
                  value={createVendor.bankDetails?.accountNumber}
                  required
                />
              </div>

              <div className="form-grou mb-4 col-12 col-lg-6">
                <label htmlFor="ifcCode">
                  IFSC Code <span className="text-danger">*</span> :
                </label>
                <input
                  onChange={handleChangeForVendor}
                  type="text"
                  className="form-control"
                  id="ifcCode"
                  name="ifcCode"
                  placeholder="IFSC Code"
                  value={createVendor.bankDetails?.ifcCode}
                  required
                />
              </div>

              <div className="form-grou mb-4 col-12 col-lg-6">
                <label htmlFor="qrCode">
                  QR Code <span className="text-danger">*</span> :
                </label>
                <input onChange={uploadProfilePicture} type="file" className="form-control" id="qrCode" name="qrCode" />
              </div>
            </div>

            <div className="addtask-btn ms-3 d-flex justify-content-end mt-4 gap-4">
              <button
                onClick={() => setShowAddVendorForm(false)}
                className="btn btn-outline-secondary"
                style={{
                  fontSize: "1rem",
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary " style={{ fontSize: "1rem" }}>
                Submit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddVendor;
