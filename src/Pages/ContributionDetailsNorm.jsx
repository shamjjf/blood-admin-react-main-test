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

  const { id } = useParams();

  const statusArray = ["pending", "approved", "denied"];

  useEffect(() => {
    const fetchContributionRequest = async () => {
      try {
        setLoading(true);
        const response = await axios.post(`${import.meta.env.VITE_API_CONTRI}/contributionreq/${id}`);
        const { data } = response;
        setTask(data);

        // console.log(data);
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
      await axios.post(`${import.meta.env.VITE_API_CONTRI}/contributionrequp/${id}`, task);
      swal("Success", "Your Contribution request has been Updated Successfully!", "success");
      setIsEditing(false);
    } catch (error) {
      swal("Error", "Its joeover", "error");
    } finally {
      setLoading(false);
    }
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

  // proof download

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

  return (
    <div className="content-wrapper">
      <SEO title="Contribution Details" />
      <div className="d-flex mb-3 justify-content-between align-items-center">
        <p className="card-title p-0 mb-3">Contribution View</p>
        <div className="d-flex justify-content-end">
          <button
            type="button"
            className={isEditing ? "btn btn-outline-secondary" : "btn btn-primary"}
            onClick={handleEdit}
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
          {isEditing && (
            <button type="button" className="btn btn-primary ml-md-4 " onClick={handleUpdate}>
              Update
            </button>
          )}
        </div>
      </div>

      {task && (
        <div className="card mb-4 mx-0 p-0 bg-white grid-item">
          <div className="card-header bg-primary text-white">
            <h5>Contribution Information</h5>
            <p className="small mb-0">Details about the contribution that helps save lives.</p>
          </div>
          <div className="card-body">
            <div className="form-group row d-flex align-items-center  ${errors.title ? 'has-error' : ''}`}">
              <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                Title<span className="text-danger">*</span>{" "}
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
              </div>
            </div>

            <div className="form-group row d-flex align-items-center ">
              <label className="col-form-label" style={{ width: "90px", paddingLeft: "10px" }}>
                Requested Items{" "}
              </label>

              <div className="pb-4">
                <div className="d-flex flex-wrap gap-3">
                  {task.requestedItems && task.requestedItems.length === 0 ? (
                    <div className="text-center">No Items Added</div>
                  ) : (
                    task.requestedItems.map((eachItem, index) => (
                      <div
                        key={index}
                        style={{ flexGrow: 1 }}
                        className="border rounded p-3 shadow-sm d-flex flex-column gap-3"
                      >
                        <div className="d-flex flex-column">
                          <label className="form-label">Sponsored Item</label>
                          <input
                            type="text"
                            className="form-control"
                            name="itemName"
                            value={eachItem.itemName}
                            disabled={!isEditing}
                            onChange={handleItemChange(index, "itemName")}
                          />
                        </div>

                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-4">
                          <div style={{ flexGrow: 1 }} className="d-flex flex-column">
                            <label className="form-label">Quantity</label>
                            <div className="d-flex align-items-center">
                              <input
                                type="number"
                                className="form-control text-center"
                                name="itemRequired"
                                value={eachItem.itemRequired}
                                disabled={!isEditing}
                                onChange={handleItemChange(index, "itemRequired")}
                              />
                              <span
                                style={{
                                  position: "absolute",
                                  padding: 20,
                                }}
                                className="ms-2"
                              >
                                Qty
                              </span>
                            </div>
                          </div>
                          <div style={{ flexGrow: 1 }} className="d-flex flex-column flex-wrap">
                            <label className="form-label ">Amount</label>
                            <div className="d-flex align-items-center">
                              <span
                                style={{
                                  position: "absolute",
                                  padding: 20,
                                }}
                              >
                                ₹
                              </span>
                              <input
                                type="number"
                                className="form-control text-center "
                                name="itemPrice"
                                value={eachItem.itemPrice}
                                disabled={!isEditing}
                                onChange={handleItemChange(index, "itemPrice")}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="card mb-4 mx-0 p-0 bg-white grid-item">
        <div className="card-header bg-primary text-white">
          <h5>Contribution Table</h5>
          <p className="small mb-0">View all contribution submissions here.</p>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover-removed my-table">
              <thead id="request-heading">
                <tr>
                  <th className="align-left">Contributor</th>
                  <th className="align-left">Contribution Amount</th>
                  <th className="align-left">Sponsored Items & Quantity</th>
                  <th className="align-left">Proofs</th>
                  <th className="align-center">Status</th>
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
                        <td className="align-left">
                          {sub.user?.name}
                          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                            {sub.isAmountOnly && (
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 10,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "#FFFFFF",
                                  background: "#2563eb",
                                }}
                                title="Donor chose a free-form amount instead of items"
                              >
                                AMOUNT-ONLY
                              </span>
                            )}
                            {sub.isRecurring && (
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 10,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "#FFFFFF",
                                  background: "#9333EA",
                                }}
                                title={`Donor opted in for monthly recurring (every ${sub.recurringIntervalDays || 30} days)`}
                              >
                                MONTHLY
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="align-left">{sub.contributionAmount}</td>
                        <td className="">
                          {sub.sponsoredItems && sub.sponsoredItems.length > 0 ? (
                            <div className="w-100 d-flex flex-column ">
                              {sub.sponsoredItems.map((item, i) => (
                                <div
                                  key={i}
                                  className="d-flex justify-content-between align-items-center bg-light text-primary px-3 py-2 my-2 border border-primary"
                                  style={{
                                    borderRadius: 5,
                                    border: "1px solid #ddd",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: "600",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {item.itemName}
                                  </span>
                                  <span
                                    className="badge bg-primary text-white"
                                    style={{
                                      borderRadius: "20px",
                                      padding: "7px 10px",
                                      fontSize: "0.8rem",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {item.sponsorQuantity} Qty
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">No Sponsored Items</span>
                          )}
                        </td>

                        <td className="align-left">
                          {sub.proofs && sub.proofs.length > 0 ? (
                            <div className="d-flex flex-column gap-2 justify-content-center">
                              {sub.proofs.map((eachProof, i) => (
                                <div
                                  key={i}
                                  className="d-flex align-items-center justify-content-between"
                                  style={{
                                    border: "1px solid #4B49AC",
                                    padding: "10px",
                                    fontSize: "12px",
                                    borderRadius: "5px",
                                    background: "#f9f9f9",
                                  }}
                                >
                                  <div className="d-flex align-items-center">
                                    <span className="material-symbols-outlined text-primary me-2">description</span>
                                    <div>
                                      <span
                                        style={{
                                          fontWeight: "700",
                                          display: "block",
                                          fontSize: "0.85rem",
                                        }}
                                      >
                                        {eachProof.name}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-center">
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
                            </div>
                          ) : (
                            <span className="text-muted">No Proofs Available</span>
                          )}
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
        </div>
      </div>
      {/* <div className="d-flex justify-content-end">
        <button
          type="button"
          className={isEditing ? "btn btn-outline-secondary" : "btn btn-primary"}
          onClick={handleEdit}
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
        {isEditing && (
          <button type="button" className="btn btn-primary ml-md-4 " onClick={handleUpdate}>
            Update
          </button>
        )}
      </div> */}
    </div>
  );
};

export default ContributionDetails;
