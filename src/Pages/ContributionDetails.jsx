import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";
import { Link } from "react-router-dom";
import swal from "sweetalert";
import { formatDate } from "../Components/FormatedDate";
import SEO from "../SEO";

const ContributionDetails = () => {
  const [task, setTask] = useState(null);
  const [contributions, setContributions] = useState([]);
  const { setLoading, auth, alert } = useContext(GlobalContext);
  const [isEditing, setIsEditing] = useState(false);
  const [randoFlag, setRandoFlag] = useState(false);
  const [errors, setErrors] = useState({});
  const [vendorForm, setVendorForm] = useState(null);
  const { id } = useParams();

  // enum: ["participated", "submitted", "approved", "denied"],
  const statusArray = ["pending", "approved", "denied"];

  const handleStatusChange = async (e, id) => {
    const selStatus = e.target.value;

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_CONTRI}/contributionup/${id}`, {
        status: selStatus,
      });

      // console.log("response date after stat change", response);
      setRandoFlag(!randoFlag);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchContributionRequest = async () => {
      try {
        setLoading(true);
        const response = await axios.post(`${import.meta.env.VITE_API_CONTRI}/contributionreq/${id}`);
        const { data } = response;
        setTask(data);
        setVendorForm(data.vendor[0]);

        // console.log("consolinginccontrireq->", data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    const fetchContributions = async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_API_CONTRI}/contributionCreqid?contributionRequest=${id}`
        );

        // console.log("contributions for this request->>>>", response);
        setContributions(response.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchContributionRequest();
    fetchContributions();
  }, [id, randoFlag]);

  const handleEdit = () => {
    setIsEditing(!isEditing);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTask((prevTask) => ({
      ...prevTask,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);

      // set 2 api calls

      // update for contribution request

      try {
        setLoading(true);
        await axios.post(`${import.meta.env.VITE_API_CONTRI}/contributionrequp/${id}`, task);
        swal("Success", "Your Contribution request has been Updated Successfully!", "success");
        setIsEditing(false);
      } catch (error) {
        swal("Error", "Its joeover", "error");
      } finally {
        setLoading(false);
      }

      // update for vendor

      try {
        setLoading(true);
        const response = await axios.post(`${import.meta.env.VITE_API_CONTRI}/vendorup/${id}`, vendorForm);

        // console.log(response, "response im getting from updating vendor if it goes into this loop");
        swal("Success", "Your Contribution request with vendor details has been Updated Successfully!", "success");
        setIsEditing(false);
      } catch (error) {
        swal("Error", "Its joeover", "error");
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      swal("Error", "Its joeover", "error");
    } finally {
      setLoading(false);
    }
  };

  const downloadProofs = (proof) => {
    if (!proof || !proof.url) {
      console.error("Invalid proof object or missing URL.");
      return;
    }

    let link = document.createElement("a");
    link.href = proof.url;
    link.target = "_blank";
    // Use a dynamic filename based on proof data
    link.download = proof.filename || "download"; // Use proof.filename if available

    // Ensure the URL is properly formatted
    if (!/^https?:\/\//i.test(link.href)) {
      console.error("Invalid URL format.");
      return;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleItemChange = (index, field) => (e) => {
    const { value } = e.target;

    setTask((prevTask) => {
      const updatedRequestedItems = [...prevTask.requestedItems];

      // Ensure that we're updating the right item at the index
      updatedRequestedItems[index] = {
        ...updatedRequestedItems[index],
        [field]: value,
      };

      return {
        ...prevTask,
        requestedItems: updatedRequestedItems,
      };
    });
  };

  const handleVendorChange = async (e) => {
    const { value, name } = e.target;

    setVendorForm({ ...vendorForm, [name]: value });
  };

  return (
    <div className="content-wrapper">
      <SEO title="Contribution Details" />

      <div className="col-12 grid-margin">
        <div className="card">
          {task && (
            <div className="card-body">
              <form className="form-sample">
                <div className="row">
                  {/* Left Column */}
                  <div className="col-md-6">
                    {/* Title */}
                    <div className={`form-group row d-flex align-items-center ${errors.title ? "has-error" : ""}`}>
                      <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                        Title<span className="text-danger">*</span>
                      </label>
                      <div className="col-sm-8">
                        <input
                          type="text"
                          className="form-control input-control"
                          name="title"
                          value={task.title}
                          disabled={!isEditing}
                          onChange={handleInputChange}
                        />
                        {errors.title && <span className="text-danger">{errors.title}</span>}
                      </div>
                    </div>

                    {/* Shop */}
                    <div className={`form-group row d-flex align-items-center ${errors.shopName ? "has-error" : ""}`}>
                      <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                        Shop<span className="text-danger">*</span>
                      </label>
                      <div className="col-sm-8">
                        <input
                          type="text"
                          className="form-control"
                          name="shopName"
                          value={vendorForm.shopName}
                          disabled={!isEditing}
                          onChange={handleVendorChange}
                        />
                      </div>
                    </div>

                    {/* Owner */}
                    <div className={`form-group row d-flex align-items-center ${errors.ownerName ? "has-error" : ""}`}>
                      <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                        Owner :
                      </label>
                      <div className="col-sm-8">
                        <input
                          type="text"
                          className="form-control"
                          name="ownerName"
                          value={vendorForm.ownerName}
                          disabled={!isEditing}
                          onChange={handleVendorChange}
                        />
                      </div>
                    </div>

                    {/* Shop Address */}
                    <div
                      className={`form-group row d-flex align-items-center ${errors.shopAddress ? "has-error" : ""}`}
                    >
                      <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                        Shop Address :
                      </label>
                      <div className="col-sm-8">
                        <input
                          type="text"
                          className="form-control"
                          name="shopAddress"
                          value={vendorForm.shopAddress}
                          disabled={!isEditing}
                          onChange={handleVendorChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="col-md-6">
                    {/* Requested Items Table */}
                    <div className="form-group row d-flex align-items-center">
                      <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                        Requested Items :
                      </label>
                      <div className="table-responsive pb-4">
                        <table className="table table-hover-removed my-table">
                          <thead id="request-heading">
                            <tr>
                              <th className="align-left">Sponsored Items</th>
                              <th className="align-left">Sponsored Item quantity</th>
                              <th className="align-left">Item amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {task.requestedItems && task.requestedItems.length === 0 && (
                              <tr>
                                <td className="align-left" colSpan="3">
                                  No Items Added
                                </td>
                              </tr>
                            )}
                            {task.requestedItems &&
                              task.requestedItems.map((eachItem, index) => (
                                <tr key={index}>
                                  <td className="align-left">
                                    <input
                                      type="text"
                                      className="input-group"
                                      name="itemName"
                                      style={{ border: "none" }}
                                      value={eachItem.itemName}
                                      disabled={!isEditing}
                                      onChange={handleItemChange(index, "itemName")}
                                    />
                                  </td>
                                  <td className="align-center d-flex align-items-center justify-content-center">
                                    <input
                                      type="number"
                                      className="input-group text-center"
                                      name="itemRequired"
                                      style={{ border: "none", width: "50px" }}
                                      value={eachItem.itemRequired}
                                      disabled={!isEditing}
                                      onChange={handleItemChange(index, "itemRequired")}
                                    />
                                    <span>Qty</span>
                                  </td>
                                  <td className="align-left">
                                    <div className="d-flex justify-content-center align-items-center">
                                      <span>₹</span>
                                      <input
                                        type="number"
                                        className="input-group text-center"
                                        name="itemPrice"
                                        style={{ border: "none", width: "100%" }}
                                        value={eachItem.itemPrice}
                                        disabled={!isEditing}
                                        onChange={handleItemChange(index, "itemPrice")}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit/Update Buttons */}
                <div className="w-100 d-flex justify-content-end gap-4">
                  <button
                    type="button"
                    className={`${isEditing ? "btn btn-outline-secondary" : "btn btn-primary"}`}
                    onClick={handleEdit}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                  {isEditing && (
                    <button type="button" className="btn btn-success ml-md-4" onClick={handleUpdate}>
                      Update
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {/* {requests && requests.length > 0 ? ( */}
          <div className="table-responsive">
            <table className="table table-hover-removed my-table">
              <thead id="request-heading">
                <tr>
                  <th className="align-left">Contributor</th>
                  <th className="align-left">Contribution Amount</th>
                  <th className="align-left">Sponsored Items</th>
                  <th className="align-left">Sponsored Item quantity</th>
                  <th className="align-left">Proofs</th>
                  <th className="align-center">Status </th>
                </tr>
              </thead>
              <tbody>
                {contributions && contributions.length == 0 && (
                  <tr>
                    <td className="align-left" colSpan="6">
                      No Contributions Available
                    </td>
                  </tr>
                )}
                {contributions &&
                  contributions.map((sub, index) => (
                    <>
                      <tr key={index}>
                        <td className="align-left">{sub?.user?.name}</td>
                        <td className="align-left">{sub.contributionAmount}</td>

                        <td className="align-left">
                          {sub.sponsoredItems &&
                            sub.sponsoredItems.map((item, i) => (
                              <>
                                <div key={i}>{item.itemName}</div>
                              </>
                            ))}
                        </td>
                        <td className="align-left">
                          {sub.sponsoredItems &&
                            sub.sponsoredItems.map((item, i) => (
                              <>
                                <div key={i}>{item.sponsorQuantity}</div>
                              </>
                            ))}
                        </td>

                        <td className="align-left">
                          {sub &&
                            sub.proofs &&
                            sub.proofs.map((eachProof, i) => (
                              <div
                                key={i}
                                className=" d-flex align-items-center justify-content-between mb-2"
                                style={{
                                  border: "1px solid #4B49AC",
                                  padding: "10px",
                                  fontSize: "12px",
                                  borderRadius: "3px",
                                }}
                              >
                                <div className=" d-flex align-items-center ">
                                  <span className="material-symbols-outlined">description</span>
                                  <div className="col-6">
                                    <div className="d-flex flex-column justify-content-between">
                                      <span
                                        style={{
                                          fontWeight: "700",
                                          paddingBottom: "10px",
                                        }}
                                      >
                                        {eachProof.name}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className=" text-center">
                                  <span
                                    onClick={() => downloadProofs(eachProof)}
                                    className="material-symbols-outlined text-success"
                                    style={{ cursor: "pointer" }}
                                  >
                                    download
                                  </span>
                                </div>
                              </div>
                            ))}
                        </td>
                        <td className="align-center">
                          <select
                            className={
                              sub.status === "approved"
                                ? "badge badge-success"
                                : sub.status === "denied"
                                ? "badge badge-danger"
                                : "badge badge-warning"
                            }
                            value={sub.status}
                            onChange={(e) => handleStatusChange(e, sub._id)}
                          >
                            {statusArray.map((status, index) => (
                              <option key={index} value={status} className="badge">
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    </>
                  ))}
              </tbody>
            </table>
          </div>
          {/* ) : (
              <div className="null-request">No Rquests to Display!</div>
            )} */}
        </div>
      </div>
    </div>
  );
};

export default ContributionDetails;
