// import { useContext, useEffect, useState } from "react";
// import { GlobalContext } from "../GlobalContext";
// import swal from "sweetalert2";

import { useEffect, useState } from "react";

import axios from "axios";
import SEO from "../SEO";
import DashboardSummary from "../Components/DashboardSummary";
import DoughnutChart from "../Components/DoughnutChart";
import DashboardCompletionData from "../Components/DashboardCompletionData";

const Home = () => {
  const [statData, setStatData] = useState();

  useEffect(() => {
    const getStats = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/stats`,

          {
            headers: { Authorization: sessionStorage.getItem("auth") },
          }
        );
        // console.log(res);
        setStatData(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    getStats();
  }, []);
  const data = [
    {
      svg: <i className="fa fa-user" aria-hidden="true"></i>,
      title: "Users",
      // count: statData?.maleUser + statData?.femaleUser,
      count: statData?.userCount,
    },
    {
      svg: <i className="fa fa-user" aria-hidden="true"></i>,
      title: "Special User",
      // count: statData?.maleUser + statData?.femaleUser,
      count: statData?.specialUserCount,
    },
    {
      svg: <i className="fa fa-user" aria-hidden="true"></i>,
      title: "Volunteers",
      // count: statData?.maleUser + statData?.femaleUser,
      count: statData?.volunteersCount,
    },
    {
      svg: <i className="fa fa-user" aria-hidden="true"></i>,
      title: "Blood Requests",
      count: statData?.bloodRequestCountCrit + statData?.bloodRequestCountNoCrit,
    },
    {
      svg: <i className="fa fa-user" aria-hidden="true"></i>,
      title: "Platelet Requests",
      count: statData?.plateletRequestCountCrit + statData?.plateletRequestCountNoCrit,
    },
    {
      svg: <i className="fa fa-user" aria-hidden="true"></i>,
      title: "Tasks",
      count: statData?.openTasks + statData?.closeTasks,
    },
    {
      svg: <i className="fa fa-user" aria-hidden="true"></i>,
      title: "Camps",
      count: statData?.campsCount,
    },
    {
      svg: <i className="fa fa-user" aria-hidden="true"></i>,
      title: "Blood Banks",
      count: statData?.bloodBankCount,
    },
  ];

  return (
    <div className="content-wrapper">
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 p-0  ">
        {data?.map(({ svg, title, count }, index) => (
          <div className="my-3  " key={index}>
            <DashboardCompletionData svg={svg} title={title} count={count} />
          </div>
        ))}
      </div>

      <SEO title="Dashboard" />
      <>
        {statData ? (
          <>
            <div className="d-grid p-4 gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "auto auto" }}>
              
              {/* Blood Requests Summary */}
              <div>
                <div className="col-md-12 p-0 m-0 grid-margin transparent h-100">
                  <div style={{ borderRadius: 20, overflow: "hidden", border: "none" }} className="card shadow col-md-12 p-0 my-0">
                    <DashboardSummary
                      summaryText="Total number of Blood Requests"
                      noData={!Number(statData.bloodRequestCountCrit + statData.bloodRequestCountNoCrit)}
                      summaryData={[
                        { dataName: "Critical", percentageValue: Math.floor((statData.bloodRequestCountCrit / (statData.bloodRequestCountCrit + statData.bloodRequestCountNoCrit)) * 100), colorDiv: <div className="w-[10px] h-[10px] rounded-full bg-[#382BAC]"></div>, color: "#4b49ac", hoverColor: "#4b49ac", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-280h-80v-240q0-33 23.5-56.5T400-680h160q33 0 56.5 23.5T640-600v240h-80v280H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> },
                        { dataName: "Not Critical", percentageValue: Math.floor((statData.bloodRequestCountNoCrit / (statData.bloodRequestCountCrit + statData.bloodRequestCountNoCrit)) * 100), color: "#8a89c9", hoverColor: "#8a89c9", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-240H280l122-308q10-24 31-38t47-14q26 0 47 14t31 38l122 308H560v240H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Platelet Requests Summary */}
              <div>
                <div className="col-md-12 p-0 m-0 grid-margin transparent h-100">
                  <div style={{ borderRadius: 20, overflow: "hidden", border: "none" }} className="card shadow col-md-12 p-0 my-0">
                    <DashboardSummary
                      summaryText="Total number of Platelet Requests"
                      noData={!Number(statData.plateletRequestCountCrit + statData.plateletRequestCountNoCrit)}
                      summaryData={[
                        { dataName: "Critical", percentageValue: Math.floor((statData.plateletRequestCountCrit / (statData.plateletRequestCountCrit + statData.plateletRequestCountNoCrit)) * 100), colorDiv: <div className="w-[10px] h-[10px] rounded-full bg-[#382BAC]"></div>, color: "#4b49ac", hoverColor: "#4b49ac", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-280h-80v-240q0-33 23.5-56.5T400-680h160q33 0 56.5 23.5T640-600v240h-80v280H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> },
                        { dataName: "Not Critical", percentageValue: Math.floor((statData.plateletRequestCountNoCrit / (statData.plateletRequestCountCrit + statData.plateletRequestCountNoCrit)) * 100), color: "#8a89c9", hoverColor: "#8a89c9", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-240H280l122-308q10-24 31-38t47-14q26 0 47 14t31 38l122 308H560v240H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> }
                      ]}
                    />
                  </div>
                </div>
              </div>
              
              {/* Tasks Summary */}
              <div>
                <div className="col-md-12 p-0 m-0 grid-margin transparent h-100">
                  <div style={{ borderRadius: 20, overflow: "hidden", border: "none" }} className="card shadow col-md-12 p-0 my-0">
                    <DashboardSummary
                      summaryText="Total number of Tasks"
                      noData={!Number(statData.openTasks + statData.closeTasks)}
                      summaryData={[
                        { dataName: "Open", percentageValue: Math.floor((statData.openTasks / (statData.openTasks + statData.closeTasks)) * 100), colorDiv: <div className="w-[10px] h-[10px] rounded-full bg-[#382BAC]"></div>, color: "#4b49ac", hoverColor: "#4b49ac", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-280h-80v-240q0-33 23.5-56.5T400-680h160q33 0 56.5 23.5T640-600v240h-80v280H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> },
                        { dataName: "Closed", percentageValue: Math.floor((statData.closeTasks / (statData.openTasks + statData.closeTasks)) * 100), color: "#8a89c9", hoverColor: "#8a89c9", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-240H280l122-308q10-24 31-38t47-14q26 0 47 14t31 38l122 308H560v240H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Users summary */}
              <div>
                <div className="col-md-12 p-0 m-0 grid-margin transparent h-100">
                  <div style={{ borderRadius: 20, overflow: "hidden", border: "none" }} className="card shadow col-md-12 p-0 my-0">
                    <DashboardSummary
                      summaryText="Total number of Users"
                      noData={!Number(statData.userCount)}
                      summaryData={[
                        {
                          dataName: "Male",
                          percentageValue: Math.floor((statData.maleUser / statData.userCount) * 100),
                          colorDiv: <div className="w-[10px] h-[10px] rounded-full bg-[#382BAC]"></div>,
                          color: "#4b49ac",
                          hoverColor: "#4b49ac",
                          svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-280h-80v-240q0-33 23.5-56.5T400-680h160q33 0 56.5 23.5T640-600v240h-80v280H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg>,
                        },
                        {
                          dataName: "Female",
                          percentageValue: Math.floor((statData.femaleUser / statData.userCount) * 100),
                          color: "#8a89c9",
                          hoverColor: "#8a89c9",
                          svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-240H280l122-308q10-24 31-38t47-14q26 0 47 14t31 38l122 308H560v240H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg>,
                        },
                        {
                          dataName: "Other",
                          percentageValue: Math.floor((statData.otherUser / statData.userCount) * 100),
                          color: "#61608d",
                          hoverColor: "#61608d",
                          svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-240H280l122-308q10-24 31-38t47-14q26 0 47 14t31 38l122 308H560v240H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg>,
                        },
                        {
                          dataName: "Unspecified",
                          percentageValue: Math.floor(((statData.userCount - (statData.maleUser + statData.femaleUser + statData.otherUser)) / statData.userCount) * 100),
                          color: "#adacd9",
                          hoverColor: "#adacd9",
                          svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-240H280l122-308q10-24 31-38t47-14q26 0 47 14t31 38l122 308H560v240H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg>,
                        }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Special Users dashboard */}
              <div>
                <div className="col-md-12 p-0 m-0 grid-margin transparent h-100">
                  <div style={{ borderRadius: 20, overflow: "hidden", border: "none" }} className="card shadow col-md-12 p-0 my-0">
                    <DashboardSummary
                      summaryText="Total number of Special Users"
                      noData={!Number(statData.specialUserCount)}
                      summaryData={[
                        { dataName: "NGO", percentageValue: Math.floor((statData.ngoUser / statData.specialUserCount) * 100), colorDiv: <div className="w-[10px] h-[10px] rounded-full bg-[#382BAC]"></div>, color: "#4b49ac", hoverColor: "#4b49ac", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-280h-80v-240q0-33 23.5-56.5T400-680h160q33 0 56.5 23.5T640-600v240h-80v280H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> },
                        { dataName: "School", percentageValue: Math.floor((statData.schoolUser / statData.specialUserCount) * 100), color: "#8a89c9", hoverColor: "#8a89c9", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-240H280l122-308q10-24 31-38t47-14q26 0 47 14t31 38l122 308H560v240H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> },
                        { dataName: "University", percentageValue: Math.floor((statData.universityUser / statData.specialUserCount) * 100), color: "#61608d", hoverColor: "#61608d", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-240H280l122-308q10-24 31-38t47-14q26 0 47 14t31 38l122 308H560v240H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> },
                        { dataName: "Company", percentageValue: Math.floor((statData.companyUser / statData.specialUserCount) * 100), color: "#dcdcef", hoverColor: "#dcdcef", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-240H280l122-308q10-24 31-38t47-14q26 0 47 14t31 38l122 308H560v240H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> },
                        { dataName: "Influencer", percentageValue: Math.floor((statData.influencerUser / statData.specialUserCount) * 100), color: "#29293c", hoverColor: "#29293c", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-240H280l122-308q10-24 31-38t47-14q26 0 47 14t31 38l122 308H560v240H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Blood Camps summary */}
              <div>
                <div className="col-md-12 p-0 m-0 grid-margin transparent h-100">
                  <div style={{ borderRadius: 20, overflow: "hidden", border: "none" }} className="card shadow col-md-12 p-0 my-0">
                    <DashboardSummary
                      summaryText="Total number of Camps"
                      noData={!Number(statData.campsCount)}
                      summaryData={[
                        { dataName: "Today", percentageValue: Math.floor((statData.campToday / statData.campsCount) * 100), colorDiv: <div className="w-[10px] h-[10px] rounded-full bg-[#382BAC]"></div>, color: "#4b49ac", hoverColor: "#4b49ac", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-280h-80v-240q0-33 23.5-56.5T400-680h160q33 0 56.5 23.5T640-600v240h-80v280H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> },
                        { dataName: "Future", percentageValue: Math.floor((statData.campFuture / statData.campsCount) * 100), color: "#8a89c9", hoverColor: "#8a89c9", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-240H280l122-308q10-24 31-38t47-14q26 0 47 14t31 38l122 308H560v240H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> },
                        { dataName: "Past", percentageValue: Math.floor((statData.campPast / statData.campsCount) * 100), color: "#61608d", hoverColor: "#61608d", svg: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M400-80v-240H280l122-308q10-24 31-38t47-14q26 0 47 14t31 38l122 308H560v240H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg> },
                      ]}
                    />
                  </div>
                </div>
              </div>

            </div>
          </>
        ) : (
          <div>Loading...</div>
        )}
      </>
    </div>
  );
};

export default Home;
