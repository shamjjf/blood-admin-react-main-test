import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";
import SEO from "../SEO";

const VolunteerDetails = () => {
  const [task, setTask] = useState();

  const { setLoading } = useContext(GlobalContext);

  const { id } = useParams();
  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    const fetchVolunteer = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/vollist/${id}`, {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        });
        const { data } = response;
        setTask(data.volunteer);

        // console.log("onevolunteer->", data.volunteer);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteer();
  }, [id, setLoading, refresh]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTask((prevTask) => ({
      ...prevTask,
      [name]: value,
    }));
  };
  const handleStatusChange = async (id, event) => {
    try {
      const isVerified = event.target.value === "true";

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/vollistupdate/${id}`,
        { isVerified },
        {
          headers: {
            Authorization: sessionStorage.getItem("auth"),
          },
        }
      );
      setRefresh(!refresh);

      // console.log(response);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="content-wrapper">
      <SEO title="Volunteer Details" />
      <p className="card-title p-0 mb-3">Volunteer View</p>

      <div className="col-12 grid-margin">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5>Volunteer Details</h5>
            <p className="small mb-0">Details of the volunteer and their interests.</p>
          </div>
          {task && (
            <div className="card-body">
              <div className="details-view">
                <div className="row">
                  {/* Volunteer Details */}
                  <div className="col-md-6">
                    <div className="detail-item">
                      <strong>Volunteer:</strong>
                      <span>{task.user?.name}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Education:</strong>
                      <span>{task.education}</span>
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="col-md-6">
                    <div className="detail-item">
                      <strong>Languages:</strong>
                      <ul className="list-unstyled mb-0">
                        {task.langs.map((eachItem, index) => (
                          <li key={index} className="badge bg-primary me-1 my-2">
                            {eachItem}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="row mt-4">
                  {/* Interests */}
                  <div className="col-md-6">
                    <div className="detail-item">
                      <strong>Interests:</strong>
                      <ul className="list-unstyled mb-0">
                        {task.interests.map((eachItem, index) => (
                          <li key={index} className="badge bg-success me-1 my-2">
                            {eachItem}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="col-md-6">
                    <div className="detail-item">
                      <strong>Skills:</strong>
                      <ul className="list-unstyled mb-0">
                        {task.skills.map((eachItem, index) => (
                          <li key={index} className="badge bg-info me-1 my-2">
                            {eachItem}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-item">
                      <strong>Status</strong>
                      <select
                        style={{
                          borderRadius: 5,
                          borderRight: "10px solid transparent !important",
                          borderLeft: 0,
                          borderTop: 0,
                          borderBottom: 0,
                        }}
                        className={task?.isVerified === false ? "bg-danger py-2 px-4" : "bg-success py-2 px-4"}
                        value={task?.isVerified ? "true" : "false"}
                        onChange={(event) => handleStatusChange(id, event)}
                      >
                        <option className="bg-white" value="true">
                          Authorize
                        </option>
                        <option className="bg-white" value="false">
                          Unauthorize
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerDetails;
