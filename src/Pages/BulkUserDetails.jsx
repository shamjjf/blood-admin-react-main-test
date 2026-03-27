import { useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";
import { Link } from "react-router-dom";
import swal from "sweetalert";
import { formatDate } from "../Components/FormatedDate";
import SEO from "../SEO";
import Swal from "sweetalert2";
import PageDetails from "../Components/PageDetails";
import Pagination from "../Components/Pagination";
import PhoneInput from "react-phone-input-2";

const BulkUserDetails = () => {
  const [task, setTask] = useState(null);
  const [request, setRequest] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [bulkusers, setBulkUsers] = useState([]);

  const { setLoading, alert } = useContext(GlobalContext);
  const [isEditing, setIsEditing] = useState(false);

  const [errors, setErrors] = useState({});
  const [refresh, setRefresh] = useState(false);
  const { id } = useParams();
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const handelLimit = (e) => {
    setLimit(e);
    setCurrentPage(1);
  };
  const fetchContributionRequest = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/bulkrequest/${id}?n=${limit}&p=${currentPage}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );
      const { data } = response.data;

      setRequest(data.request);
      setBulkUsers(data.records);
      setName(data.request.specialuser.name);
      setEmail(data.request.specialuser.email);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / limit));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributionRequest();
  }, [currentPage, limit, refresh]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTask((prevTask) => ({
      ...prevTask,
      [name]: value,
    }));
  };

  const handleStatChange = async (status) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/bulkrequest/${id}`,
        { status },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );

      // console.log(response);
      //   swal.success("Status Changed successfully");
      swal("Success!", "Status Changed successfully!", "success");

      fetchContributionRequest();
    } catch (error) {
      //   swal.error(error);
      swal("Error!", "Error occured!", "error");
      console.log(error);
    }
  };
  const [isEditable, setIsEditable] = useState(false);

  const handleUpdate = async () => {
    if (!name)
      return alert({
        type: "danger",
        icon: "error",
        title: "Error",
        text: "Please enter a name",
      });
    if (!email)
      return alert({
        type: "danger",
        icon: "error",
        title: "Error",
        text: "Please enter a email",
      });
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
      return alert({
        type: "danger",
        icon: "error",
        title: "Error",
        text: "Please enter a valid email",
      });
    setIsEditable(false);
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/updatespecialuser/${request.specialuser._id}`,
        { name, email },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
            "Content-Type": "application/json",
          },
        }
      );
      setRefresh(!refresh);
      alert("Success", "User Updated Successfully!", "success");
    } catch (error) {
      alert({
        type: "danger",
        title: "Error!",
        text: error.response.data.error,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="content-wrapper">
      <SEO title="Bulk User Details" />
      <div className="d-flex mb-3 justify-content-between align-items-center">
        <p className="card-title p-0 mb-3">Bulk User View</p>
        <div className="d-flex">
          {request?.status === "init" && (
            <div className="d-flex px-3">
              <button
                type="button"
                className="btn btn-success  mx-3 text-capitalize"
                onClick={() => handleStatChange("approved")}
              >
                Approve
              </button>
              <button
                type="button"
                className="btn btn-danger  text-capitalize"
                onClick={() => handleStatChange("denied")}
              >
                Deny
              </button>
            </div>
          )}
          <div className="d-flex gap-3">
            <button
              style={{
                maxWidth: "fit-content",
                borderRadius: "5px",
              }}
              className={`${isEditable ? "btn btn-outline-primary" : "btn btn-primary"}`}
              onClick={(e) => setIsEditable(!isEditable)}
            >
              {isEditable ? "Cancel" : "Edit"}
            </button>
            {isEditable && (
              <button
                style={{
                  maxWidth: "fit-content",
                  borderRadius: "5px",
                }}
                className={`btn btn-primary`}
                onClick={handleUpdate}
                disabled={!isEditable}
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5>Bulk User Details</h5>
          <p className="small mb-0">Details of the special and bulk user.</p>
        </div>
        {request && (
          <div className="card-body">
            <div className="   d-flex w-100 flex-wrap ">
              <div className="form-grou  col-12 col-md-6  row d-flex align-items-center  ${errors.title ? 'has-error' : ''}`}">
                <label className="col-form-label">
                  Special User Name<span className="text-danger">*</span>{" "}
                </label>
                <div className="">
                  <input
                    type="text"
                    className="form-control input-control"
                    name="name"
                    value={name}
                    disabled={!isEditable}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.title && <span className="text-danger">{errors.title}</span>}
                </div>
              </div>

              <div className="form-grou  col-12 col-md-6 row d-flex align-items-center ${errors.points ? 'has-error' : ''}`}">
                <label className=" col-form-label">
                  Email <span className="text-danger">*</span>{" "}
                </label>
                <div className="">
                  <input
                    type="text"
                    className="form-control"
                    name="shopName"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditable}
                  />
                </div>
              </div>
              <div className="form-grou  col-12 col-md-6 row d-flex align-items-center ${errors.points ? 'has-error' : ''}`}">
                <label className=" col-form-label">
                  Mobile Number <span className="text-danger">*</span>{" "}
                </label>
                <div className="">
                  <PhoneInput
                    disabled={!isEditing}
                    preferredCountries={["in"]}
                    placeholder="+91 12345-67890"
                    buttonStyle={{
                      width: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    country={"in"}
                    value={`+${request.specialuser.phoneCode} ${request.specialuser.phone}`}
                    inputStyle={{
                      width: "100%",
                      height: "50px",
                      // marginLeft: "7px",
                    }}
                    onChange={(value, country, e, formattedValue) => {
                      if (country.format.length === formattedValue.length) {
                        setPhoneError(false);
                      } else {
                        setPhoneError(true);
                      }
                      const phone = formattedValue.split(" ");
                      const newphone = phone
                        .filter((ph, i) => i !== 0)
                        .join("")
                        .replace("-", "");
                      setUser({
                        ...user,
                        phoneCode: country.dialCode,
                        phone: newphone,
                      });
                    }}
                  />
                  {errors.phone && <span className="text-danger">{errors.phone}</span>}
                </div>
              </div>
              {/* <div className="form-grou  col-12 col-md-6 row d-flex align-items-center ${errors.points ? 'has-error' : ''}`}">
                <label className=" col-form-label">Referral Code </label>
                <div className="">
                  <input
                    type="text"
                    className="form-control"
                    name="ownerName"
                    value={request?.specialuser?.ownReferral}
                    disabled={!isEditing}
                  />
                </div>
              </div> */}
              <div className="form-grou  col-12 col-md-6 row d-flex align-items-center ${errors.points ? 'has-error' : ''}`}">
                <label className=" col-form-label">Special User Type </label>
                <div className="">
                  <input
                    type="text"
                    className="form-control"
                    name="shopAddress"
                    value={request?.specialuser?.type}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* {request.status === "init" ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary mt-4 mx-3"
                      onClick={() => handleStatChange("approved")}
                    >
                      Approve
                    </button>
                    <button type="button" className="btn btn-primary mt-4" onClick={() => handleStatChange("denied")}>
                      Deny
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-primary mt-4" disabled>
                    {request.status}
                  </button>
                )} */}

              {/* {isEditing && (
                  <button
                    type="button"
                    className="btn btn-success ml-md-4"
                    onClick={handleUpdate}
                  >
                    Update
                  </button>
                )} */}
            </div>
          </div>
        )}
      </div>
      <div className="card mt-4">
        <div className="card-header bg-primary text-white">
          <h5>Bulk User Table</h5>
          <p className="small mb-0">All bulk users under special user.</p>
        </div>
        {request && (
          <div className="card-body">
            {/* <h4 className="card-title">Task Detail</h4> */}

            <div className="form-group row d-flex align-items-center">
              <div className="table-responsive pb-4">
                <table className="table table-hover-removed my-table">
                  <thead id="request-heading">
                    <tr>
                      <th className="align-left">User Name</th>
                      <th className="align-left">Email Id</th>
                      <th className="align-left">Mobile Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.records && request.records == 0 && (
                      <tr>
                        <td className="align-left" colSpan="6">
                          No users
                        </td>
                      </tr>
                    )}
                    {request.records &&
                      request.records.map((eachItem, index) => (
                        <tr key={index}>
                          <td className="align-left">{eachItem.name}</td>
                          <td className="align-left ">{eachItem.email}</td>
                          <td className="align-left">{`+${eachItem.phoneCode} ${eachItem.phone}`}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        <div className="page-info ">
          {" "}
          <div className="page-details ">
            <PageDetails totalCount={totalCount} limit={limit} handelLimit={handelLimit} />
          </div>
          <div className="pagination-container">
            {" "}
            <Pagination totalPages={totalPages || 1} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          </div>
          <div className="" id="total-counts">
            <p className="total-count text-white">
              Page {currentPage} of {totalPages || 1}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUserDetails;
