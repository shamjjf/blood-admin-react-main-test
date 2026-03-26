import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";
import { Link } from "react-router-dom";
import swal from "sweetalert";
import { formatDate } from "../Components/FormatedDate";
import SEO from "../SEO";

const TaskDetails = () => {
  const [task, setTask] = useState(null);
  const { setLoading, auth, alert } = useContext(GlobalContext);
  const [isEditing, setIsEditing] = useState(false);
  const [randoFlag, setRandoFlag] = useState(false);
  const [errors, setErrors] = useState({});
  const [taskCategory, setTaskCategory] = useState(null);
  const { id } = useParams();
  const [selectedStatus, setSelectedStatus] = useState("Pending");

  // enum: ["participated", "submitted", "approved", "denied"],
  const statusArray = ["approved", "denied", "submitted"];

  const handleStatusChange = async (e, id) => {
    const selStatus = e.target.value;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/updatesubmissionstatus/${id}`,
        { status: selStatus },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );

      // console.log("response date after stat change", response);
      setRandoFlag(!randoFlag);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/gettask/${id}`, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        });
        const { data } = response;
        setTask(data.task);

        // console.log("data taskkk", data.task);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, randoFlag, setLoading]);

  useEffect(() => {
    const getCategories = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/gettaskcategories`, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        });
        const { data } = res;
        setTaskCategory(data.categories);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    getCategories();
  }, [setLoading]);

  const validate = () => {
    let isValid = true;
    const newErrors = {};

    if (!task.title?.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    }

    if (!task.category) {
      newErrors.category = "Category is required";
      isValid = false;
    }

    if (!task.points || isNaN(task.points)) {
      newErrors.points = "Points must be a number";
      isValid = false;
    }

    if (!formatDate(task.dueDate)) {
      newErrors.dueDate = "Due Date is required";
      isValid = false;
    }
    if (!task.description?.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }
    // if (!task.status) {
    //   newErrors.status = 'Status is required';
    //   isValid = false;
    // }

    setErrors(newErrors);
    return isValid;
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // console.log("name,task :>> ", name, value, e.target.type);
    if (e.target.type == "radio") {
      setTask((prevTask) => ({
        ...prevTask,
        [name]: value == "true",
      }));
    } else {
      setTask((prevTask) => ({
        ...prevTask,
        [name]: value,
      }));
    }
  };

  const handleUpdate = async () => {
    const isValid = validate();
    if (!isValid) return;
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/updatetask/${id}`, task, {
        headers: {
          Authorization: sessionStorage.getItem("auth"),
        },
      });
      swal("Success", "Your Tasks have been Updated Successfully!", "success");
      setIsEditing(false);
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

  const downloadProofs = (proof) => {
    let link = document.createElement("a");
    link.href = proof.url;
    link.target = "_blank";
    link.download = `proof`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="content-wrapper">
      <SEO title="Task Details" />

      <p className="card-title p-0 mb-3">Task View</p>
      {task && (
        <div className="d-grid-settings gap-3">
          {[
            {
              title: "Task Details",
              description: "Details about the task, including title, category, and points.",
              inputs: [
                {
                  label: "Title",
                  value: task.title,
                  name: "title",
                  type: "text",
                  placeholder: "Title",
                  error: errors.title,
                  required: true,
                },
                {
                  label: "Category",
                  value: task.category?._id,
                  name: "category",
                  type: "select",
                  options: taskCategory?.map((category) => ({ value: category._id, label: category.title })) || [],
                  error: errors.category,
                  required: true,
                },
                {
                  label: "Points",
                  value: task.points,
                  name: "points",
                  type: "number",
                  placeholder: "Points",
                  error: errors.points,
                  required: true,
                },
                {
                  label: "Max Submission",
                  value: task.maxSubmission,
                  name: "maxSubmission",
                  type: "number",
                  placeholder: "Max Submission",
                  error: errors.maxSubmission,
                  required: true,
                },
                {
                  label: "Proof Required",
                  name: "proofRequired",
                  type: "radio",
                  options: [
                    { value: "true", label: "Yes", checked: true == task.proofRequired },
                    { value: "false", label: "No", checked: false == task.proofRequired },
                  ],
                },
                {
                  label: "Once",
                  name: "once",
                  type: "radio",
                  options: [
                    { value: "true", label: "Yes", checked: true == task.once },
                    { value: "false", label: "No", checked: false == task.once },
                  ],
                },
              ],
            },
            {
              title: "Status & Other Details",
              description: "Details about the task status, due date, and additional description.",
              inputs: [
                {
                  label: "Status",
                  value: task.status,
                  name: "status",
                  type: "select",
                  options: [
                    { value: "Open", label: "Open" },
                    { value: "Closed", label: "Closed" },
                    { value: "Draft", label: "Draft" },
                  ],
                  required: true,
                },

                {
                  label: "Due Date",
                  value: formatDate(task.dueDate),
                  name: "dueDate",
                  type: "date",
                  error: errors.dueDate,
                  required: true,
                },
                {
                  label: "Description",
                  value: task.description,
                  name: "description",
                  type: "textarea",
                  placeholder: "Task Description",
                  error: errors.description,
                  required: true,
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
                  <div
                    key={index}
                    className={`form-group w-100 ${input.error ? "has-error" : ""} ${
                      input.type == "radio" && "d-flex align-items-center justify-content-between mt-3"
                    }`}
                  >
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
                        className="form-control"
                      >
                        {input.options.map((option, i) => (
                          <option key={i} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : input.type === "textarea" ? (
                      <textarea
                        name={input.name}
                        rows="4"
                        value={input.value}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="form-control"
                        placeholder={input.placeholder}
                      ></textarea>
                    ) : input.type === "radio" ? (
                      <div className="d-flex ">
                        {input.options.map((option, i) => (
                          <label key={i} htmlFor={`${input.name}_${option.value}`} className="d-flex gap-2">
                            <span>{option.label}</span>
                            <input
                              id={`${input.name}_${option.value}`}
                              name={input.name} // All radios in the group share the same name
                              type="radio"
                              className="p-0 m-0"
                              value={option.value}
                              checked={option.checked}
                              onClick={handleInputChange}
                              disabled={!isEditing}
                            />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        name={input.name}
                        type={input.type}
                        value={input.value}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="form-control"
                        placeholder={input.placeholder}
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
      <div className="w-100 d-flex justify-content-end gap-4">
        <button
          type="button"
          className={`${isEditing ? "btn btn-outline-secondary" : "btn btn-primary"}`}
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

      <div className="card my-4 mx-0 p-0 bg-white grid-item">
        <div className="card-header bg-primary text-white">
          <h5>Task Table</h5>
          <p className="small mb-0">View all tasks submissions here.</p>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover-removed my-table">
              <thead id="request-heading">
                <tr>
                  <th className="align-left">Volunteer</th>
                  <th className="align-left">Points</th>
                  <th className="align-left">Proofs</th>
                  <th className="align-center">Status </th>
                </tr>
              </thead>
              <tbody>
                {task && task.submissions && task.submissions.length == 0 && (
                  <tr>
                    <td className="align-left" colSpan="4">
                      No submissions available
                    </td>
                  </tr>
                )}
                {task &&
                  task.submissions &&
                  task.submissions.length > 0 &&
                  task.submissions.map((sub, index) => (
                    <>
                      <tr key={index}>
                        <td className="align-left">
                          {sub && sub.volunteer && sub.volunteer.user && sub.volunteer.user.name}
                        </td>
                        <td className="align-left">{task.points}</td>
                        <td className="align-left">
                          {sub &&
                            sub.proofs &&
                            sub.proofs.map((eachProof, i) => (
                              // <img src={proof.url} alt="" key={index} />
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
                            // enum: ["participated", "submitted", "approved", "denied"],
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
    </div>
  );
};

export default TaskDetails;
