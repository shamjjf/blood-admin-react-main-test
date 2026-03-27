import { useContext } from "react";
import { GlobalContext } from "../GlobalContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function Auth() {
  const { pathname } = useLocation();
  const { auth } = useContext(GlobalContext);

  if (!auth.id) return <Navigate to="/login" state={pathname} replace />;
  if (!auth.verified)
    return <Navigate to="/not_verified" state={pathname} replace />;
  if (pathname === "/") return <Outlet />;
  if (!(auth.isSuperAdmin || auth.roles.includes(pathname.split("/")[1])))
    return <Navigate to={"/unauth"} state={pathname} replace />;
  return <Outlet />;
}
