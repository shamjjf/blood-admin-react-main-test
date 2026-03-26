import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import Pagination from "../Components/Pagination";
import { GlobalContext } from "../GlobalContext";
import PageDetails from "../Components/PageDetails";
import TasksFilters from "../Components/TasksFilters";
import AddTaskForm from "../Components/AddTaskForm";
import { formatDate } from "../Components/FormatedDate";
import SEO from "../SEO";

const Tasks = () => {
  const { setLoading, alert } = useContext(GlobalContext);
  const [tasks, setTasks] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showAddTaskForm, setShowAddTask] = useState(false);
  const [pointsSelects, setPointsSelects] = useState("All");
  const [statusSelects, setStatusSelects] = useState("All");
  const [tasksCategorySelects, setTasksCategorySelects] = useState("All");
  const [searchText, setSearchText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const handelLimit = (e) => {
    setLimit(e);
    setCurrentPage(1);
  };
  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoading(true);
        let url = `${
          import.meta.env.VITE_API_URL
        }/gettasks?n=${limit}&p=${currentPage}&status=${statusSelects}&category=${tasksCategorySelects}&points=${pointsSelects}&searchText=${searchText}`;
        const res = await axios.get(url, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        });
        const { data, error } = res;

        setTasks(data.tasks);
        setTotalCount(data.count);
        setTotalPages(Math.ceil(data.count / limit));
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, [limit, currentPage, pointsSelects, statusSelects, tasksCategorySelects, setLoading, alert, searchText, refresh]);
  return (
    <>
      <SEO title="Tasks" />

      {showAddTaskForm && (
        <div className="add-form-holder d-flex justify-content-center align-items-center">
          {" "}
          <AddTaskForm setShowAddTask={setShowAddTask} setRefresh={setRefresh} />
        </div>
      )}
      <div className="content-wrapper ">
        <div className="d-flex justify-content-between align-items-center mb-3  ">
          <p className="card-title p-0 m-0">Tasks</p>

          <button style={{ borderRadius: 5 }} onClick={() => setShowAddTask(true)} className="btn btn-primary  ">
            <i className="mr-2  fa-solid fa-plus"></i>
            <span>Add Task</span>
          </button>
        </div>

        {isLoading ? (
          <div className="card">
            <div className="card-body">
              <div className="table-card-border">
                <TasksFilters
                  pointsSelects={pointsSelects}
                  setPointsSelects={setPointsSelects}
                  statusSelects={statusSelects}
                  setStatusSelects={setStatusSelects}
                  tasksCategorySelects={tasksCategorySelects}
                  setTasksCategorySelects={setTasksCategorySelects}
                  setSearchText={setSearchText}
                />
                <div className="table-responsive">
                  <table className="table my-table">
                    <thead id="request-heading">
                      <tr className="tableheaders">
                        <th className="align-left">Task Title</th>
                        <th className="align-left">Task Category</th>
                        <th className="align-left">Status</th>

                        <th className="align-left">Points</th>
                        <th className="align-left">Due Date</th>
                        <th className="align-left">Proof Required</th>
                        <th className="align-left">Max Submissions</th>
                        <th className="align-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: limit }).map((_, index) => (
                        <tr key={index}>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>

                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                          <td className="align-left">
                            <Skeleton height={20} width={100} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="table-card-border">
                <TasksFilters
                  pointsSelects={pointsSelects}
                  setPointsSelects={setPointsSelects}
                  statusSelects={statusSelects}
                  setStatusSelects={setStatusSelects}
                  tasksCategorySelects={tasksCategorySelects}
                  setTasksCategorySelects={setTasksCategorySelects}
                  setSearchText={setSearchText}
                />
                <div className="table-responsive">
                  <table className="table my-table">
                    <thead id="request-heading">
                      <tr className="tableheaders">
                        <th className="align-left">SR.NO</th>

                        <th className="align-left">Task Title</th>
                        <th className="align-left">Task Category</th>
                        <th className="align-left">Status</th>

                        <th className="align-left">Points</th>
                        <th className="align-left">Due Date</th>
                        <th className="align-left">Proof Required</th>
                        <th className="align-left">Max Submissions</th>
                        <th className="align-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks?.length > 0 ? (
                        tasks.map((task, index) => (
                          <tr key={task._id}>
                            <td className="align-left">{index + 1}</td>
                            <td className="align-left">{task.title}</td>
                            <td className="align-left">{task.category && task.category.title}</td>
                            <td className="align-left">{task.status}</td>

                            <td className="align-left">{task.points}</td>
                            {/* <td>{formatDate(task.dueDate)}</td> */}
                            <td className="align-left">{formatDate(task.dueDate)}</td>
                            <td className="align-left">{task.proofRequired ? "Yes" : "No"}</td>
                            <td className="align-left">{task.maxSubmission}</td>
                            {/* <td>
                          <Link to={`/task/${task._id}`}>View</Link>
                        </td> */}
                            <td className="align-center ">
                              <Link to={`/task/${task._id}`}>
                                <i className="icons fa-regular fa-eye view-icon"></i>
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="">
                          <td colSpan={9} className="align-center">
                            <p className="m-5 p-5 fs-4">No Data Found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="page-info">
                  {" "}
                  <div className="page-details">
                    <PageDetails totalCount={totalCount} limit={limit} handelLimit={handelLimit} />
                  </div>
                  <div className="pagination-container">
                    {" "}
                    <Pagination
                      totalPages={totalPages || 1}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                    />
                  </div>
                  <div id="total-counts">
                    <p className="total-count">
                      Page {currentPage} of {totalPages || 1}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Tasks;
