// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

import Layout from "./Layout";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import { GlobalContext, authReducer, authState } from "./GlobalContext";
import { useReducer, useState } from "react";
import NotFound from "./Pages/NotFound";
import NotVerified from "./Pages/NotVerified";
import LoadingScreen from "./Components/Loading";
import { AlertContainer, useAlert } from "./Components/Alerts";
import UnauthorizedPage from "./Pages/Unauthoried";
import "react-loading-skeleton/dist/skeleton.css";
function App() {
  const [alerts, alert] = useAlert();
  const [loading, setLoading] = useState(false);
  const [auth, dispatch] = useReducer(authReducer, authState); 
  return (
    <GlobalContext.Provider value={{ auth, dispatch, setLoading, alert, alerts }}>
      {loading && <LoadingScreen />}
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Layout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/notfound" element={<NotFound />} />
          <Route path="/not_verified" element={<NotVerified />} />
          <Route path="/unauth" element={<UnauthorizedPage />} />
        </Routes>
      </BrowserRouter>
      <AlertContainer alerts={alerts} />
    </GlobalContext.Provider>
  );
}

export default App;
