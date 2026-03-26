import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../GlobalContext";
import swal from "sweetalert";
import { formatDate } from "./FormatedDate";
import RequestItems from "./RequestItems";

const AddContribution = ({ setShowAddContributionForm, setRefresh }) => {
  const { setLoading, alert } = useContext(GlobalContext);
  const [errors, setErrors] = useState({});
  const [vendors, setVendors] = useState(null);
  const [noOfItems, setNoOfItems] = useState(1);
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

    // console.log("upload-test log", res);

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

  useEffect(() => {
    const getVendors = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_CONTRI}/vendor`);
        const { data } = res;
        // console.log("vendors: ", data);
        setVendors(data?.vendors);
        if (data?.vendors?.length === 0) setCustomVendorFlag(true);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    getVendors();
  }, []);
  // // console.log("TaskCategories: ", taskCategory);
  const [mainTask, setMainTask] = useState({
    title: "",
    type: "direct",
    requestedItems: [],
    vendor: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "title") {
      if (value.length > 50) {
        swal("Error", "Maximum characters reached!", "error");
        return;
      }
    }

    // Check if the input field is part of the requestedItems
    if (name.startsWith("itemName") || name.startsWith("itemRequired") || name.startsWith("itemPrice")) {
      // adding validation for these 3 fields
      if (name.startsWith("itemName")) {
        if (value.length > 40) {
          swal("Error", "Maximum characters reached!", "error");
          return;
        }
      }
      if (name.startsWith("itemRequired")) {
        if (value.length > 4) {
          swal("Error", "Maximum characters reached!", "error");
          return;
        }
        if (value <= 0) {
          swal("Error", "Cannot accept zero or negative values!", "error");
          return;
        }
      }
      if (name.startsWith("itemPrice")) {
        if (value.length > 6) {
          swal("Error", "Maximum characters reached!", "error");
          return;
        }
        if (value <= 0) {
          swal("Error", "Cannot accept zero or negative values!", "error");
          return;
        }
      }

      // Extract the index from the name attribute
      const index = parseInt(name.replace(/^\D+/g, ""), 10);

      // Update the requestedItems array
      setMainTask((prevMainTask) => {
        const updatedRequestedItems = [...prevMainTask.requestedItems];

        // Ensure the array has enough items to update
        if (!updatedRequestedItems[index]) {
          updatedRequestedItems[index] = {};
        }

        // Update the specific item
        if (name.startsWith("itemName")) {
          updatedRequestedItems[index].itemName = value;
        } else if (name.startsWith("itemRequired")) {
          updatedRequestedItems[index].itemRequired = value;
        } else if (name.startsWith("itemPrice")) {
          updatedRequestedItems[index].itemPrice = value;
        }

        return {
          ...prevMainTask,
          requestedItems: updatedRequestedItems,
        };
      });
    } else {
      // Handle other fields if necessary
      setMainTask((prevMainTask) => ({
        ...prevMainTask,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };
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

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const dateValue = name === "dueDate" ? new Date(value).toISOString() : value;
    if (name === "dueDate") {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        swal("Error", "Cannot select old dates!", "error");
        return;
      }
    }
    setMainTask({
      ...mainTask,
      [name]: dateValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //   validation pending for the whole form

    if (mainTask.type === "vendor" && customVendorFlag) {
      // step1- create the vendor
      try {
        setLoading(true);
        const res = await axios.post(`${import.meta.env.VITE_API_CONTRI}/vendor`, createVendor);

        // step2- post the vendor id and make a new type=vendor request
        const newVendorId = res.data._id;

        // console.log("Updated MainTask:", mainTask);

        // // step3- make a new contribution request

        const newMaintask = {
          type: mainTask.type,
          title: mainTask.title,
          requestedItems: mainTask.requestedItems,
          vendor: [newVendorId],
        };

        try {
          setLoading(true);
          const res = await axios.post(`${import.meta.env.VITE_API_CONTRI}/contributionreq`, newMaintask);
          setShowAddContributionForm(false);
          setRefresh((r) => !r);

          swal("Success", "Your Contribution request has been Added Successfully!", "success");
        } catch (error) {
          console.log(error);
          swal("Error", "Failed to create a Contribution request!", "error");
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.log(error);
        swal("Error", "Failed to create a vendor!", "error");
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);
        const res = await axios.post(`${import.meta.env.VITE_API_CONTRI}/contributionreq`, mainTask);
        setShowAddContributionForm(false);
        setRefresh((r) => !r);

        swal("Success", "Your Contribution request has been Added Successfully!", "success");
      } catch (error) {
        console.log(error);
        swal("Error", "Failed to create a Contribution request!", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  // file upload

  const uploadFile = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // if (!file) return;
    // const { name, size, type } = file;
    // console.log(files);

    const filesArray = Object.values(files);

    filesArray.forEach(async (file) => {
      const { name, size, type } = file;
      const res = await axios.post(
        `${import.meta.env.VITE_API_UPLOAD}/upload-test`,
        { name, size, mime: type },
        {
          headers: { "content-type": "application/json" },
        }
      );
      const { data, error } = res;
      // console.log("this is the data getting back-->", data);
      const fd = new FormData();
      // Append the new ID to the proofs state

      setCreateVendor((prevcreateVendor) => ({
        ...prevcreateVendor, // Preserve previous state values
        qrCode: [...prevcreateVendor.qrCode, data.data._id], // Append the new ID to the qrCode array
      }));

      for (const [key, val] of Object.entries(data.data.fields)) fd.append(key, val);
      fd.append("file", file);
      const ress = await fetch(data.data.url, { method: "POST", body: fd });
      // console.log(`the ress is for file ${file}`, ress);
    });
  };

  const handleIndividualClose = async (index) => {
    setNoOfItems(noOfItems - 1);

    setMainTask((prevMainTask) => {
      // Remove the item at the specified index
      const updatedRequestedItems = prevMainTask.requestedItems.filter((_, i) => i !== index);

      return {
        ...prevMainTask,
        requestedItems: updatedRequestedItems,
      };
    });
  };

  return (
    <div className="myupdatedcard">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="card-title">Add Contribution Request</h4>
          <button
            onClick={() => setShowAddContributionForm(false)}
            className="btn btn-danger btn-rounded btn-icon cusing"
            style={{ fontSize: "1.2rem", padding: "8px 12px" }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form className="forms-sample" onSubmit={handleSubmit}>
          <div className="d-flex flex-wrap col-12 col-md-12 p-0 m-0">
            <div className="form-grou  mb-4 col-12 col-lg-6 ">
              <label htmlFor="type">Type</label>
              <select
                style={{
                  backgroundImage:
                    'url(\'data:image/svg+xml;utf8,<svg fill="black" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>\')',
                  backgroundRepeat: "no-repeat",
                  backgroundPositionX: "98%",
                  backgroundPositionY: "12px",
                }}
                onChange={handleChange}
                className={`form-control ${errors.status && "is-invalid"}`}
                id="type"
                name="type"
                value={mainTask.type}
                required
              >
                <option value="direct">Direct Contribution Request</option>
                <option value="vendor">Vendor Contribution Request</option>
                <option value="deliver">Delivery-Based Contribution Request</option>
              </select>
            </div>

            <div className="form-grou  mb-4 col-12 col-lg-6 ">
              <label htmlFor="title">
                Title <span className="text-danger">*</span>
              </label>
              <input
                onChange={handleChange}
                type="text"
                className={`form-control ${errors.title && "is-invalid"}`}
                id="title"
                name="title"
                placeholder="Title"
                value={mainTask.title}
                required
              />
            </div>

            <div className="form-grou col-12 col-lg-6  mb-1">
              <label htmlFor="requestedItems">
                Request items <span className="text-danger">*</span>
              </label>
            </div>

            {Array.from({ length: noOfItems }).map((item, index) => (
              <div className="pt-2 col-12 col-lg-12" key={index}>
                <RequestItems handleChange={handleChange} handleIndividualClose={handleIndividualClose} index={index} />
              </div>
            ))}

            {noOfItems === 0 && <div className="pt-2">0 Items Created</div>}

            <div className="additems d-flex justify-content-end gap-4 pt-2  col-12 col-lg-12">
              {/* Add Item Button */}
              <button
                onClick={() => {
                  setNoOfItems(noOfItems + 1);
                  setMainTask((prevMainTask) => ({
                    ...prevMainTask,
                    requestedItems: [...prevMainTask.requestedItems, {}],
                  }));
                }}
                className="rounded-circle d-flex justify-content-center align-items-center btn btn-info btn-rounded btn-icon cusing"
                style={{ fontSize: "1.2rem", padding: "8px 12px" }}
                aria-label="Add Item"
              >
                <i style={{ fontSize: "18px" }} className="fas fa-plus "></i>
              </button>

              {/* Remove Item Button */}
              {/* <button
              onClick={() => {
                setNoOfItems(noOfItems - 1);
                setMainTask((prevMainTask) => {
                  const updatedRequestedItems = prevMainTask.requestedItems.slice(0, -1);
                  return {
                    ...prevMainTask,
                    requestedItems: updatedRequestedItems,
                  };
                });
              }}
              style={{
                cursor: "pointer",
                backgroundColor: "#dc3545",
                color: "white",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "none",
                fontSize: "1.5rem",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#c82333")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#dc3545")}
              aria-label="Remove Item"
            >
              <i className="fas fa-minus"></i>
            </button> */}
            </div>

            {mainTask && mainTask.type === "vendor" && (
              <div className="form-grou mb-4 col-12 col-lg-12">
                <button
                  type="button"
                  className="btn btn-primary btn-md my-3"
                  onClick={() => vendors.length !== 0 && setCustomVendorFlag(!customVendorFlag)}
                  style={{ fontSize: "1rem" }}
                >
                  {customVendorFlag ? "Select from the dropdown?" : "Add a new vendor?"}
                </button>
              </div>
            )}
            {mainTask && mainTask.type === "vendor" && !customVendorFlag && (
              <div
                className={`form-grou  mb-4 col-12 ${
                  mainTask && mainTask.type === "vendor" && customVendorFlag ? "col-lg-6" : "col-lg-12"
                } `}
              >
                <label htmlFor="vendor">
                  Vendor / Shop <span className="text-danger">*</span>
                </label>
                <select
                  onChange={handleChange}
                  type="text"
                  className={`form-control ${errors.category && "is-invalid"}`}
                  id="vendor"
                  name="vendor"
                  disabled={customVendorFlag}
                  required
                >
                  {vendors &&
                    vendors.map((eachVendor, i) => (
                      <option key={i} value={eachVendor._id}>
                        {eachVendor.shopName}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {mainTask && mainTask.type === "vendor" && customVendorFlag && (
              <div className="form-grou  mb-4 col-12 col-lg-6 ">
                <label htmlFor="shopName">
                  Vendor / Shop <span className="text-danger">*</span>
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
            )}
            {mainTask && mainTask.type === "vendor" && customVendorFlag && (
              <div className="form-grou  mb-4 col-12 col-lg-6 ">
                <label htmlFor="ownerName">
                  Owner Name <span className="text-danger">*</span>
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
            )}
            {mainTask && mainTask.type === "vendor" && customVendorFlag && (
              <div className="form-grou  mb-4 col-12 col-lg-6 ">
                <label htmlFor="mobileNumber">
                  Mobile Number <span className="text-danger">*</span>
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
            )}
            {mainTask && mainTask.type === "vendor" && customVendorFlag && (
              <div className="form-grou  mb-4 col-12 col-lg-6 ">
                <label htmlFor="shopAddress">
                  Shop Address <span className="text-danger">*</span>
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
            )}
            {mainTask && mainTask.type === "vendor" && customVendorFlag && (
              <div className="form-grou  mb-4 col-12 col-lg-6 ">
                <label htmlFor="bankName">
                  Bank Name <span className="text-danger">*</span>
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
            )}
            {mainTask && mainTask.type === "vendor" && customVendorFlag && (
              <div className="form-grou  mb-4 col-12 col-lg-6 ">
                <label htmlFor="accountNumber">
                  Account Number <span className="text-danger">*</span>
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
            )}
            {mainTask && mainTask.type === "vendor" && customVendorFlag && (
              <div className="form-grou  mb-4 col-12 col-lg-6 ">
                <label htmlFor="ifcCode">
                  IFSC Code <span className="text-danger">*</span>
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
            )}
            {mainTask && mainTask.type === "vendor" && customVendorFlag && (
              <div className="form-grou  mb-4 col-12 col-lg-6 ">
                <label htmlFor="qrCode">
                  QR Code <span className="text-danger">*</span>
                </label>
                <input onChange={uploadProfilePicture} type="file" className="form-control" id="qrCode" name="qrCode" />
              </div>
            )}
          </div>

          <div className="addtask-btn gap-4 mt-4">
            <button
              onClick={() => setShowAddContributionForm(false)}
              className="btn btn-outline-secondary"
              style={{
                fontSize: "1rem",
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ fontSize: "1rem" }}>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContribution;
