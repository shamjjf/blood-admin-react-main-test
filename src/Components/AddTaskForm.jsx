import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../GlobalContext";
import swal from "sweetalert";
import { formatDate } from "./FormatedDate";
const AddTaskForm = ({ setShowAddTask, setRefresh }) => {
  const { setLoading, alert } = useContext(GlobalContext);
  const [errors, setErrors] = useState({});
  const [taskCategory, setTaskCategory] = useState(null);
  const [customCategory, setCustomCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

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
        // console.log("categories: ", data.categories);

        if (data.categories && data.categories.length > 0) {
          setMainTask((prev) => ({
            ...prev,
            category: data.categories[0]._id,
          }));
        }

        setTaskCategory(data.categories);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    getCategories();
  }, []);
  // // console.log("TaskCategories: ", taskCategory);
  const [mainTask, setMainTask] = useState({
    category: "",
    title: "",
    status: "Open",
    points: 1,
    description: "",
    dueDate: "",
    media: "",
    once: false,
    proofRequired: true,
    maxSubmission: 1,
    assignedTo: [],
  });

  // Volunteers eligible for explicit assignment. Empty selection = open to all.
  const [volunteerOptions, setVolunteerOptions] = useState([]);
  useEffect(() => {
    const loadVolunteers = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/users?role=volunteer&n=100&p=1`,
          { headers: { Authorization: sessionStorage.getItem("auth") } }
        );
        setVolunteerOptions(res?.data?.users || []);
      } catch (err) {
        console.error("failed to load volunteers:", err);
      }
    };
    loadVolunteers();
  }, []);

  const toggleAssignee = (uid) => {
    setMainTask((prev) => {
      const has = prev.assignedTo.includes(uid);
      return {
        ...prev,
        assignedTo: has
          ? prev.assignedTo.filter((x) => x !== uid)
          : [...prev.assignedTo, uid],
      };
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "title") {
      if (value.length > 35) {
        swal("Error", "Title cannot be more than 25 characters!", "error");
        return;
      }
    }
    if (name === "description") {
      if (value.length > 300) {
        swal("Error", "Description cannot be more than 300 characters!", "error");
        return;
      }
    }
    if (name === "points") {
      if (value.length > 4) {
        swal("Error", "Points cannot be more than 4 digits!", "error");
        return;
      }
      if (value < 0) {
        swal("Error", "Points cannot be Negative!", "error");
        return;
      }
    }
    if (name === "maxSubmission") {
      if (value.length > 4) {
        swal("Error", "Max submissions cannot be more than 4 digits!", "error");
        return;
      }
      if (value < 0) {
        swal("Error", "Maximum submissions cannot be negative!", "error");
        return;
      }
    }

    setMainTask({
      ...mainTask,
      [name]: type === "radio" ? value == "true" : value,
    });
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

    try {
      // console.log(mainTask.category, customCategory, taskCategory);
      if ((taskCategory?.length !== 0 && !mainTask.category) || (customCategory && newCategory === "")) {
        return swal("Error", "Category is required!", "error");
      }
      if (!mainTask.title.trim()) {
        return swal("Error", "Title is required", "error");
      }
      if (!mainTask.status || mainTask.status === "Select Status") {
        return swal("Error", "Status is required", "error");
      }
      if (!mainTask.description.trim()) {
        return swal("Error", "Description is required", "error");
      }
      if (isNaN(mainTask.points) || mainTask.points === "") {
        return swal("Error", "Points must be a number", "error");
      }
      if (isNaN(mainTask.maxSubmission) || mainTask.maxSubmission === "") {
        return swal("Error", "Max Submissions must be a number", "error");
      }
      if (!mainTask.dueDate) {
        return swal("Error", "Date is Required", "error");
      }

      setLoading(true);

      if (customCategory || taskCategory?.length === 0) {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/addtaskcategory`,
          { title: newCategory },
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
            },
          }
        );

        const res12 = await axios.post(
          `${import.meta.env.VITE_API_URL}/addtasks`,
          {
            category: res.data.category._id,
            title: mainTask.title,
            status: mainTask.status,
            points: mainTask.points,
            description: mainTask.description,
            dueDate: mainTask.dueDate,
            once: mainTask.once,
            proofRequired: mainTask.proofRequired,
            maxSubmission: mainTask.maxSubmission,
          },
          {
            headers: {
              Authorization: sessionStorage.getItem("auth"),
            },
          }
        );
        // console.log(res12);
        setShowAddTask(false);
        setRefresh((r) => !r);
        swal("Success", "Your Tasks have been Added Successfully!", "success");
        return;
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/addtasks`, mainTask, {
        headers: {
          Authorization: sessionStorage.getItem("auth"),
        },
      });
      setShowAddTask(false);

      swal("Success", "Your Tasks have been Added Successfully!", "success");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Function to validate the form fields
  // const validateForm = (formData) =>         swal("Error", "Maximum submissions cannot be negative!", "error");

  //   const errors = {};
  //   if (!formData.category) {
  //     errors.category = "Category is required";
  //   }
  //   if (!formData.title.trim()) {
  //     errors.title = "Title is required";
  //   }
  //   if (!formData.status || formData.status === "Select Status") {
  //     errors.status = "Status is required";
  //   }
  //   if (!formData.description.trim()) {
  //     errors.description = "Description is required";
  //   }
  //   if (isNaN(formData.points) || formData.points === "") {
  //     errors.points = "Points must be a number";
  //   }
  //   if (isNaN(formData.maxSubmission) || formData.maxSubmission === "") {
  //     errors.maxSubmission = "Max Submissions must be a number";
  //   }
  //   if (!formData.dueDate) {
  //     errors.dueDate = "Date is Required";
  //   }
  //   return errors;
  // };

  return (
    <div className="myupdatedcard">
      <div className="card-body">
        <div className="d-flex align-item-center justify-content-between">
          <h4 className="card-title ">Add Task</h4>
          <button onClick={() => setShowAddTask(false)} className="btn btn-danger btn-rounded btn-icon cusing p-0 m-0">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form className="forms-sample" onSubmit={handleSubmit}>
          <div className="d-flex flex-wrap col-12 col-md-12 p-0 m-0">
            {taskCategory?.length > 0 && (
              <div
                className={`form-grou mb-4 col-12 ${
                  customCategory || taskCategory?.length === 0 ? "col-lg-6" : "col-lg-12"
                }`}
              >
                <label htmlFor="category">
                  Category<span className="text-danger">*</span> 
                </label>
                <select
                  onChange={handleChange}
                  type="text"
                  className={`form-control ${errors.category && "is-invalid"} selectiveSelects`}
                  style={{
                    backgroundImage:
                      'url(\'data:image/svg+xml;utf8,<svg fill="black" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>\')',
                    backgroundRepeat: "no-repeat", // Fixed typo here: backgroud -> background
                    backgroundPositionX: "98%",
                    backgroundPositionY: "12px",
                  }}
                  id="category"
                  name="category"
                  placeholder="Category"
                  value={mainTask.category}
                  disabled={customCategory}
                >
                  {taskCategory &&
                    taskCategory.map((taskCategory, i) => (
                      <option key={i} value={taskCategory._id}>
                        {taskCategory.title}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary btn-md my-3"
                  onClick={() => setCustomCategory(!customCategory)}
                >
                  {customCategory ? `Select from the dropdown` : `Add a new Category?`}
                </button>
              </div>
            )}

            {(customCategory || taskCategory?.length === 0) && (
              <div className="form-grou mb-4 col-12 col-lg-6">
                <label htmlFor="shopName">
                  Category Name<span className="text-danger">*</span> 
                </label>
                <input
                  onChange={(e) => {
                    setNewCategory(e.target.value);
                  }}
                  type="text"
                  className={`form-control`}
                  id="shopName"
                  name="categoryName"
                  placeholder="Category Name"
                  value={newCategory}
                />
              </div>
            )}

            <div className="form-grou mb-4 col-12 col-lg-6">
              <label htmlFor="title">
                Title<span className="text-danger">*</span> 
              </label>
              <input
                onChange={handleChange}
                type="text"
                className={`form-control ${errors.title && "is-invalid"}`}
                id="title"
                name="title"
                placeholder="Title"
                value={mainTask.title}
              />
              {errors.title && <div className="invalid-feedback">{errors.title}</div>}
            </div>
            <div className="form-grou mb-4 col-12 col-lg-6">
              <label htmlFor="status">Status</label>
              <select
                onChange={handleChange}
                className={`form-control ${errors.status && "is-invalid"}`}
                style={{
                  backgroundImage:
                    'url(\'data:image/svg+xml;utf8,<svg fill="black" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>\')',
                  backgroundRepeat: "no-repeat", // Fixed typo here: backgroud -> background
                  backgroundPositionX: "98%",
                  backgroundPositionY: "12px",
                }}
                id="status"
                name="status"
                value={mainTask.status}
              >
                <option value="Open">Open</option>
                <option value="Pending">Pending</option>
                <option value="Draft">Draft</option>
              </select>
              {errors.status && <div className="invalid-feedback">{errors.status}</div>}
            </div>
            <div className="form-grou mb-4 col-12 col-lg-6">
              <label htmlFor="points">Points</label>
              <input
                onChange={handleChange}
                type="number"
                className={`form-control ${errors.points && "is-invalid"}`}
                id="points"
                name="points"
                placeholder="Points"
                value={mainTask.points}
              />
              {errors.points && <div className="invalid-feedback">{errors.points}</div>}
            </div>
            <div className="form-grou mb-4 col-12 col-lg-6">
              <label htmlFor="points">Max Submissions</label>
              <input
                onChange={handleChange}
                type="number"
                className={`form-control ${errors.maxSubmission && "is-invalid"}`}
                id="maxsubmission"
                name="maxSubmission"
                placeholder="Maximum Submissions"
                value={mainTask.maxSubmission}
              />
              {errors.maxSubmission && <div className="invalid-feedback">{errors.maxSubmission}</div>}
            </div>
            <div className="form-grou mb-4 col-12 col-lg-6">
              <label htmlFor="points">
                Due Date<span className="text-danger">*</span> 
              </label>
              <input
                onChange={handleDateChange}
                type="date"
                className={`form-control ${errors.dueDate && "is-invalid"}`}
                id="dueDate"
                name="dueDate"
                placeholder="Date"
                // value={mainTask.dueDate ? mainTask.dueDate.split("T")[0] : ""}
                value={formatDate(mainTask.dueDate)}
              />
              {errors.dueDate && <div className="invalid-feedback">{errors.dueDate}</div>}
            </div>

            <div className="form-grou mb-4 col-12 col-lg-6">
              <label htmlFor="proofRequired" className="form-label">
                Proof Required
              </label>
              <div className="d-flex justify-content-start align-items-center">
                <div className="form-check form-check-inline">
                  <input
                    type="radio"
                    id="pyes"
                    name="proofRequired"
                    className="form-check-input"
                    onChange={handleChange}
                    value="true"
                    checked={mainTask.proofRequired}
                  />
                  <label htmlFor="pyes" className="form-check-label">
                    Yes
                  </label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    type="radio"
                    id="pno"
                    name="proofRequired"
                    className="form-check-input"
                    onChange={handleChange}
                    value="false"
                    checked={!mainTask.proofRequired}
                  />
                  <label htmlFor="pno" className="form-check-label">
                    No
                  </label>
                </div>
              </div>
            </div>

            <div className="form-grou mb-4 col-12 col-lg-6">
              <label htmlFor="once" className="form-label">
                Once
              </label>
              <div className="d-flex justify-content-start align-items-center">
                <div className="form-check form-check-inline">
                  <input
                    type="radio"
                    id="oyes"
                    name="once"
                    className="form-check-input"
                    onChange={handleChange}
                    value="true"
                    checked={mainTask.once === true}
                  />
                  <label htmlFor="oyes" className="form-check-label">
                    Yes
                  </label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    type="radio"
                    id="ono"
                    name="once"
                    className="form-check-input"
                    onChange={handleChange}
                    value="false"
                    checked={mainTask.once === false}
                  />
                  <label htmlFor="ono" className="form-check-label">
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="form-grou mb-4 col-12 col-lg-12">
            <label htmlFor="description">
              Description<span className="text-danger">*</span> 
            </label>
            <textarea
              onChange={handleChange}
              className={`form-control ${errors.description && "is-invalid"}`}
              id="description"
              name="description"
              placeholder="Description"
              rows={4}
              value={mainTask.description}
            />
            {errors.description && <div className="invalid-feedback">{errors.description}</div>}
          </div>

          {/* ===== Assign To volunteers (optional) ===== */}
          <div className="form-grou mb-4 col-12 col-lg-12">
            <label htmlFor="assignedTo" className="form-label">
              Assign To Volunteers <span className="text-muted small">(leave empty for "open to all")</span>
            </label>
            <div
              style={{
                maxHeight: 180,
                overflowY: "auto",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: 10,
                background: "#FAFAFA",
              }}
            >
              {volunteerOptions.length === 0 ? (
                <div className="text-muted small">No volunteer users found.</div>
              ) : (
                volunteerOptions.map((v) => (
                  <div className="form-check" key={v._id} style={{ marginBottom: 4 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id={`assign-${v._id}`}
                      checked={mainTask.assignedTo.includes(v._id)}
                      onChange={() => toggleAssignee(v._id)}
                    />
                    <label className="form-check-label" htmlFor={`assign-${v._id}`}>
                      {v.name} <span className="text-muted small">(+{v.phoneCode} {v.phone})</span>
                    </label>
                  </div>
                ))
              )}
            </div>
            <small className="text-muted">
              {mainTask.assignedTo.length === 0
                ? "Task will be visible to every eligible volunteer."
                : `${mainTask.assignedTo.length} volunteer(s) selected — only they will see this task.`}
            </small>
          </div>

          <div className="addtask-btn ms-3">
            <button onClick={() => setShowAddTask(false)} className="btn btn-outline-secondary mr-4 mt-4">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary me-2 mr-4 mt-4">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskForm;
