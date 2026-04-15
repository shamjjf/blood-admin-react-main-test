import { useContext, useEffect, useState } from "react";
import dragula from "dragula";
import "dragula/dist/dragula.min.css";
import { useParams, Link } from "react-router-dom";
import moment from "moment";
import { GlobalContext } from "../GlobalContext";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import swal from "sweetalert";
// import profileplaceholder from "../Assets/images/profileplaceholder.png";
import { formatDate } from "../Components/FormatedDate";
import SEO from "../SEO";

const RequestDetails = () => {
  const { setLoading, auth, alert } = useContext(GlobalContext);
  const [request, setRequest] = useState({
    name: "",
    type: "Blood",
    bloodGroup: "",
    status: "Open",
    date: new Date(),
    isCritical: false,
    gotUnits: 0,
    needUnits: 0,
    location: "",
    phone: "",
    note: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [errors, setErrors] = useState({});
  const { id } = useParams();
  const [searchResult, setSearchResult] = useState([]);
  const [searchResultF, setSearchResultF] = useState([]);
  const [searchBloodGroup, setSearchBloodGroup] = useState("All");
  const [flag, setflag] = useState(false);
  const [searchBloodGroupArray, setSearchBloodGroupArray] = useState([
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
    "A1+",
    "A1-",
    "A2+",
    "A2-",
    "A1B+",
    "A1B-",
    "A2B+",
    "A2B-",
    "Bombay Blood Group",
    "INRA",
    "Don't Know",
  ]);

  const [tid, setTid] = useState(0);
  // setstate for showing matching addresses
  const [address, setAddress] = useState([]);

  const validate = () => {
    let isValid = true;
    let errors = {};

    if (!request.name?.trim()) {
      errors.name = "Name is Required";
      swal("Error", "Name is Required!", "error");
      isValid = false;
    }
    if (!request.pinCode?.trim()) {
      errors.pinCode = "Pincode is Required";
      swal("Error", "Pincode is Required!", "error");
      isValid = false;
    }
    if (!formatDate(request.date)) {
      errors.date = "Date is Required";
      isValid = false;
      swal("Error", "Date is Required!", "error");
    }

    if (request.date) {
      const selectedDate = new Date(request.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        swal("Error", "Cannot acccept a Date from the past!", "error");
        isValid = false;
      }
    }

    if (!request.gotUnits || isNaN(request.gotUnits)) {
      errors.gotUnits = "Got Units Field is Required";
      swal("Error", "Got Units Field is Required!", "error");
      isValid = false;
    }
    if (!request.needUnits || isNaN(request.needUnits)) {
      errors.needUnits = "Need Units Field is Required";
      swal("Error", "Need Units Field is Required!", "error");
      isValid = false;
    }

    if (request.location === "") {
      swal("Error", "Cannot accept an empty Location!", "error");
      isValid = false;
    }
    if (request.note === "") {
      swal("Error", "Cannot accept an empty Note!", "error");
      isValid = false;
    }

    if (!request.phone) {
      errors.phone = "Phone number is required.";
      swal("Error", "Phone number is required!", "error");
      isValid = false;
    } else if (phoneError) {
      errors.phone = "Invalid Phone Number Format.";
      swal("Error", "Invalid Phone Number Format!", "error");
      isValid = false;
    }

    // setErrors(errors);
    return isValid;
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
    setErrors({});
  };
  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setRequest((prevRequest) => ({
  //     ...prevRequest,
  //     [name]: type === "checkbox" ? !prevRequest[name] : value,
  //   }));
  // };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "gotUnits" || name === "needUnits") {
      if (value < 0) {
        swal("Error", "Cannot be negative!", "error");
        return;
      }
    }
    if (name === "needUnits") {
      if (value.length > 4) {
        swal("Error", "Maximum limit reached!", "error");
        return;
      }
    }
    if (name === "gotUnits") {
      if (value > request.needUnits) {
        swal("Error", "Got units cannot be greater than Needed units!", "error");
        return;
      }
    }

    if (name === "name") {
      if (value.length > 40) {
        swal("Error", "Maximum characters reached!", "error");
        return;
      }
    }
    if (name === "note") {
      if (value.length > 100) {
        swal("Error", "Note cannot accept more than 100 characters!", "error");
        return;
      }
    }

    setRequest((prevRequest) => ({
      ...prevRequest,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // const handleCheckboxChange = (e) => {
  //   const { name, checked } = e.target;
  //   setRequest((prevRequest) => ({
  //     ...prevRequest,
  //     [name]: checked,
  //   }));
  // };

  const debouncedSearch = async (e) => {
    setTimeout(async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/searchdonors/${request._id}?search=${e.target.value}&recId=${
            request.recipient._id
          }&bloodGroup=${encodeURIComponent(searchBloodGroup || "All")}`,
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
            },
          }
        );
        setSearchResult(response.data.donors);

        // adding filter for searchtext here as well to sync dropdown and searchText

        // if (searchBloodGroup === "All") {
        //   setSearchResultF(response.data.donors);
        //   return;
        // }

        // if (searchResult.length > 0) {
        //   const filteredSearchResult = searchResult.filter((user) => {
        //     return user.bloodGroup === searchBloodGroup;
        //   });

        //   // Update the searchResult state with the filtered array

        //   // console.log("filtered array", filteredSearchResult);
        //   setSearchResultF(filteredSearchResult);
        // }

        setSearchResultF(response.data.donors);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleUpdate = async (e) => {
    if (validate()) {
      try {
        setLoading(true);
        e.preventDefault();
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/updaterequest/${id}`, request, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        });
        swal("Success", "Request Updated Successfully!", "success");
        setIsEditing(false);
      } catch (error) {
        // alert({
        //   type: "danger",
        //   title: "Error!",
        //   text: error.response.data.error,
        // });
        swal("Error", "Error updating the request!", "error");
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/request/${id}`, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        });
        const { data } = response;
        setRequest(data.request);
        data.request.bloodGroup && setSearchBloodGroup(data.request.bloodGroup);
        data.request.donations.find((i) => i?.status == "pendingApproval") && setIsApproving(true);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    const handleAddClick = async (uid, bloodGroup) => {
      try {
        setLoading(true);
        if (bloodGroup != request.bloodGroup) {
          swal("Error", "Blood group does not match!", "error");
          return;
        }

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/adddonotion/${request._id}/user/${uid}`, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        });

        swal("Success", "Donor Added Successfully!", "success");
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    const debouncedSearch = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/searchdonors/${id}?recId=${
            request.recipient?._id
          }&bloodGroup=${encodeURIComponent(searchBloodGroup)}`,
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
            },
          }
        );
        setSearchResult(response.data.donors);
        setSearchResultF(response.data.donors);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    debouncedSearch();

    const drake = dragula([
      document.getElementById("profile-list-left"),
      document.getElementById("profile-list-right"),
    ]);

    let revertTimeout = null;

    drake.on("drop", (el, target, source, sibling) => {
      if (target.id === "profile-list-left" && source.id === "profile-list-right") {
        const userId = el.getAttribute("data-user-id");
        const bloodGroup = el.getAttribute("data-user-blood");
        if (userId) handleAddClick(userId, bloodGroup);

        if (bloodGroup !== request.bloodGroup) {
          source.appendChild(el);
          return; // Exit if there's an error
        }
        target.appendChild(el);
      }
    });
    return () => {
      drake.destroy();
    };
  }, [id, request._id, setLoading, flag, searchBloodGroup]);

  useEffect(() => {
    // if (searchResult.length > 0) {
    //   const filteredSearchResult = searchResult.filter((user) => {
    //     return user.bloodGroup === searchBloodGroup;
    //   });

    //   // Update the searchResult state with the filtered array

    //   // console.log("filtered array", filteredSearchResult);
    //   setSearchResultF(filteredSearchResult);

    // }
    // need to make an api call
    const syncfnc = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/searchdonors/${id}?recId=${
            request.recipient._id
          }&bloodGroup=${encodeURIComponent(searchBloodGroup || "All")}`,
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
            },
          }
        );
        setSearchResult(response.data.donors);
        setSearchResultF(response.data.donors);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    syncfnc();
  }, [searchBloodGroup]);

  const handleapproval = () => {
    setIsApproving(!isApproving);
  };

  const downloadProofs = (proof) => {
    let link = document.createElement("a");
    link.href = proof.url;
    link.target = "_blank";
    link.download = `prescription_${proof.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDonationStatChange = async (e, id) => {
    // console.log(e.target.value, id);

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/donation/${id}`,
        { status: e.target.value },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"), // Ensure proper token format
          },
        }
      );
      // console.log(response);

      // add +1 unit after setting up "approved" to donation // remove 1 unit if approved was chosen last in stat
      setflag(!flag);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = async (e) => {
    const textQuery = e.target.value;

    if (textQuery === "") {
      setAddress([]);
    }

    // setting up value in formData to ensure user sees what hes typing
    setRequest({ ...request, location: textQuery });

    // console.log(textQuery);

    clearTimeout(tid);
    setTid(
      setTimeout(async () => {
        try {
          if (textQuery != "") {
            // console.log("textquery from frontend->", textQuery);

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/googleapi`, { dummyData: textQuery });
            // console.log(response);
            setAddress(response.data.results);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }, 500)
    );
  };

  const handleLocationSubmission = (location, geometry) => {
    setRequest({
      ...request,
      location: location,
      address: {
        latitude: geometry.lat,
        longitude: geometry.lng,
      },
    });
    setAddress([]);
  };

  return (
    <div className="content-wrapper">
      <SEO title="Request Details" />
      <p className="card-title p-0 mb-3">Request View</p>

      {request && (
        <div className="d-grid-settings gap-3">
          {[
            {
              title: "Personal Details",
              description: "Provide personal details for the request.",
              inputs: [
                {
                  label: "Name",
                  value: request.name,
                  name: "name",
                  type: "text",
                  placeholder: "Name",
                  error: errors.name,
                  required: true,
                },
                {
                  label: "Type",
                  value: request.type,
                  name: "type",
                  type: "select",
                  options: ["Blood", "Platelet"],
                },
                {
                  label: "Blood Group",
                  value: request.bloodGroup,
                  name: "bloodGroup",
                  type: "select",
                  options: searchBloodGroupArray || [],
                },
                {
                  label: "Status",
                  value: request.status,
                  name: "status",
                  type: "select",
                  options: ["Open", "Pending", "Close", "Canceled"],
                },
                {
                  label: "Pincode",
                  value: request.pinCode,
                  name: "pinCode",
                  type: "number",
                  error: errors.pinCode,
                  required: true,
                },
                {
                  label: "Date",
                  value: formatDate(request.date),
                  name: "date",
                  type: "date",
                  error: errors.date,
                  required: true,
                },
              ],
            },
            {
              title: "Resource Requirements and Contact Information",
              description: "Provide the required and available units and include any relevant contact details.",
              inputs: [
                {
                  label: "Got Units",
                  value: request.gotUnits,
                  name: "gotUnits",
                  type: "number",
                  placeholder: "Got Units",
                  error: errors.gotUnits,
                  required: true,
                },
                {
                  label: "Need Units",
                  value: request.needUnits,
                  name: "needUnits",
                  type: "number",
                  placeholder: "Need Units",
                  error: errors.needUnits,
                  required: true,
                },
                {
                  label: "Mobile Number",
                  value: `+${request.phoneCode} ${request.phone}`,
                  name: "mobileNumber",
                  type: "phone",
                  error: errors.phone,
                },
                {
                  label: "Location",
                  value: request.location,
                  name: "location",
                  type: "text",
                  placeholder: "Location",
                  onLocationChange: handleLocationChange,
                  addressSuggestions: address,
                  onAddressSelect: handleLocationSubmission,
                },

                {
                  label: "Is Critical",
                  value: request.isCritical,
                  name: "isCritical",
                  type: "select",
                  options: [true, false],
                },
                {
                  label: "Note",
                  value: request.note,
                  name: "note",
                  type: "text",
                  placeholder: "Note",
                },
                {
                  label: "Prescription",
                  value: request.prescription?.url,
                  name: "note",
                  type: "file",
                  placeholder: "Note",
                  fileObject: request.prescription,
                },
              ],
            },
          ].map((section, idx) => (
            <div className="card mb-4 mx-0 p-0 bg-white grid-item" key={idx}>
              <div className="card-header bg-primary text-white">
                <h5>{section.title}</h5>
                <p className="small mb-0">{section.description}</p>
              </div>
              <div className="card-body">
                {section.inputs.map((input, index) => (
                  <div key={index} className={`form-group w-100 ${input.error ? "has-error" : ""}`}>
                    <label>
                      {input.label}
                      {input.required && <span className="text-danger">*</span>}
                    </label>
                    {input.type === "select" ? (
                      <select
                        name={input.name}
                        value={input.value}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="form-control text-capitalize"
                      >
                        {input.options.map((option, i) => (
                          <option className="text-capitalize" key={i} value={option.toString()}>
                            {option.toString()}
                          </option>
                        ))}
                      </select>
                    ) : input.type === "phone" ? (
                      <PhoneInput
                        country="in"
                        containerStyle={{
                          width: "100%",
                          borderRadius: "5px",
                          height: 46,
                        }}
                        inputStyle={{
                          width: "100%",
                          height: 46,
                        }}
                        dropdownStyle={{
                          top: -200,
                          left: -170,
                        }}
                        value={input.value}
                        disabled={true}
                        onChange={(value, country, e, formattedValue) => {
                          const phone = formattedValue.split(" ");
                          const newPhone = phone.slice(1).join("").replace("-", "");
                          setRequest({
                            ...request,
                            phoneCode: country.dialCode,
                            phone: newPhone,
                          });
                        }}
                      />
                    ) : input.type == "file" ? (
                      <div
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

                                  minWidth: "fit-content",
                                }}
                              >
                                {input.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className=" text-center">
                          <span
                            onClick={() => downloadProofs(input.fileObject)}
                            className="material-symbols-outlined text-success"
                            style={{ cursor: "pointer" }}
                          >
                            download
                          </span>
                        </div>
                      </div>
                    ) : (
                      <input
                        name={input.name}
                        type={input.type}
                        value={input.value}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="form-control"
                        placeholder={input.placeholder || input.label}
                      />
                    )}
                    {input.error && <div className="text-danger">{input.error}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className=" w-100 d-flex justify-content-end gap-4">
        <button type="button" className="btn btn-outline-primary " onClick={handleapproval}>
          Pending approvals
        </button>
        <button
          type="button"
          className={`${isEditing ? "btn btn-outline-secondary" : "btn btn-primary"} `}
          onClick={handleEdit}
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
        {isEditing && (
          <button type="button" className="btn btn-success" onClick={handleUpdate}>
            Update
          </button>
        )}
      </div>

      {isApproving ? (
        <div className="col-12 grid-margin mx-0 px-0 mt-4">
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover-removed my-table">
                  <thead id="request-heading">
                    <tr>
                      <th className="align-left">Donor</th>
                      <th className="align-left">Proofs</th>
                      <th className="align-left">Donation status </th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.donations.filter(
                      (donation) =>
                        donation.status === "pendingApproval" ||
                        donation.status === "Approved" ||
                        donation.status === "Denied"
                    ).length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center">
                          No donations yet
                        </td>
                      </tr>
                    ) : (
                      request.donations
                        .filter(
                          (donation) =>
                            donation.status === "pendingApproval" ||
                            donation.status === "Approved" ||
                            donation.status === "Denied"
                        )
                        .map((donation) => (
                          <tr key={donation._id}>
                            <td className="align-left">{donation && donation.donor && donation.donor.name}</td>
                            <td className="align-items-center justify-content-center">
                              {donation.proof.length === 0 && "No proofs"}
                              {donation.proof.length > 0 &&
                                donation.proof.map((eachProof, i) => (
                                  // <img
                                  //   key={eachProof._id}
                                  //   src={eachProof.fid.url}
                                  //   alt="Proof"
                                  //   className="img-thumbnail"
                                  // />
                                  <div
                                    className=" d-flex align-items-center justify-content-between mb-2"
                                    style={{
                                      border: "1px solid #4B49AC",
                                      padding: "10px",
                                      fontSize: "12px",
                                      borderRadius: "3px",
                                    }}
                                    key={i}
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
                                            {eachProof?.fid?.name}{" "}
                                          </span>
                                          <span
                                            style={{
                                              fontWeight: "700",
                                            }}
                                          >
                                            Proof by : {eachProof.by}
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
                            <td className="align-left">
                              <select
                                className={
                                  donation.status === "Approved"
                                    ? "badge badge-success"
                                    : donation.status === "Denied"
                                    ? "badge badge-danger"
                                    : "badge badge-warning"
                                }
                                name="status"
                                value={donation && donation.status}
                                onChange={(e) => handleDonationStatChange(e, donation._id)}
                              >
                                <option value="pendingApproval">Pending Approval</option>
                                <option value="Approved">Appoved</option>
                                <option value="Denied">Deny</option>
                              </select>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
      {/* Donations Done Section */}
      <div className="col-12 grid-margin mx-0 px-0 mt-4">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5>Donations Done</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">SR.NO</th>
                    <th className="align-left">Donor Name</th>
                    <th className="align-left">Distance</th>
                    <th className="align-left">Date of Donation</th>
                    <th className="align-left">Mobile No</th>
                    <th className="align-center">View</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Dummy data row */}
                  {/* <tr>
                    <td className="align-left">1</td>
                    <td className="align-left">Rahul Sharma</td>
                    <td className="align-left">3.5 km</td>
                    <td className="align-left">10-04-2026 10:30 AM</td>
                    <td className="align-left">9876543210</td>
                    <td className="align-center">
                      <Link to="#">
                        <i className="icons fa-regular fa-eye view-icon"></i>
                      </Link>
                    </td>
                  </tr> */}
                  {request.donations?.filter((d) => d.status === "Approved").length > 0 ? (
                    request.donations.filter((d) => d.status === "Approved").map((donation, index) => (
                      <tr key={donation._id}>
                        <td className="align-left">{index + 1}</td>
                        <td className="align-left">{donation.donor?.name}</td>
                        <td className="align-left">{donation.distance ? `${donation.distance} km` : "N/A"}</td>
                        <td className="align-left">
                          {donation.updatedAt ? moment(donation.updatedAt).format("DD-MM-YYYY h:mm A") : "N/A"}
                        </td>
                        <td className="align-left">{donation.donor?.phone || "N/A"}</td>
                        <td className="align-center">
                          <Link to={`/user/${donation.donor?._id}`}>
                            <i className="icons fa-regular fa-eye view-icon"></i>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No donations done yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Donations Accepted Section */}
      <div className="col-12 grid-margin mx-0 px-0 mt-4">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5>Donations Accepted</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">SR.NO</th>
                    <th className="align-left">Donor Name</th>
                    <th className="align-left">Distance</th>
                    <th className="align-left">Date of Acceptance</th>
                    <th className="align-left">Mobile No</th>
                    <th className="align-center">View</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Dummy data row */}
                  {/* <tr>
                    <td className="align-left">1</td>
                    <td className="align-left">Priya Patel</td>
                    <td className="align-left">5.2 km</td>
                    <td className="align-left">12-04-2026 2:15 PM</td>
                    <td className="align-left">9123456789</td>
                    <td className="align-center">
                      <Link to="#">
                        <i className="icons fa-regular fa-eye view-icon"></i>
                      </Link>
                    </td>
                  </tr> */}
                  {request.donations?.filter((d) => d.status === "Accepted").length > 0 ? (
                    request.donations.filter((d) => d.status === "Accepted").map((donation, index) => (
                      <tr key={donation._id}>
                        <td className="align-left">{index + 1}</td>
                        <td className="align-left">{donation.donor?.name}</td>
                        <td className="align-left">{donation.distance ? `${donation.distance} km` : "N/A"}</td>
                        <td className="align-left">
                          {donation.updatedAt ? moment(donation.updatedAt).format("DD-MM-YYYY h:mm A") : "N/A"}
                        </td>
                        <td className="align-left">{donation.donor?.phone || "N/A"}</td>
                        <td className="align-center">
                          <Link to={`/user/${donation.donor?._id}`}>
                            <i className="icons fa-regular fa-eye view-icon"></i>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No donations accepted yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Donations Rejected Section */}
      <div className="col-12 grid-margin mx-0 px-0 mt-4">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5>Donations Rejected</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">SR.NO</th>
                    <th className="align-left">Donor Name</th>
                    <th className="align-left">Distance</th>
                    <th className="align-left">Date of Rejection</th>
                    <th className="align-left">Mobile No</th>
                    <th className="align-center">View</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Dummy data row */}
                  {/* <tr>
                    <td className="align-left">1</td>
                    <td className="align-left">Amit Kumar</td>
                    <td className="align-left">8.1 km</td>
                    <td className="align-left">13-04-2026 4:45 PM</td>
                    <td className="align-left">9988776655</td>
                    <td className="align-center">
                      <Link to="#">
                        <i className="icons fa-regular fa-eye view-icon"></i>
                      </Link>
                    </td>
                  </tr> */}
                  {request.donations?.filter((d) => d.status === "Rejected").length > 0 ? (
                    request.donations.filter((d) => d.status === "Rejected").map((donation, index) => (
                      <tr key={donation._id}>
                        <td className="align-left">{index + 1}</td>
                        <td className="align-left">{donation.donor?.name}</td>
                        <td className="align-left">{donation.distance ? `${donation.distance} km` : "N/A"}</td>
                        <td className="align-left">
                          {donation.updatedAt ? moment(donation.updatedAt).format("DD-MM-YYYY h:mm A") : "N/A"}
                        </td>
                        <td className="align-left">{donation.donor?.phone || "N/A"}</td>
                        <td className="align-center">
                          <Link to={`/user/${donation.donor?._id}`}>
                            <i className="icons fa-regular fa-eye view-icon"></i>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No donations rejected yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;
