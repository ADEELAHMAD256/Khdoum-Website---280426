import { Navigate, useLocation } from "react-router-dom";
import { useAuthToken } from "../services/auth/useAuthToken";

export function RequireAuth({ children }) {
  const location = useLocation();
  const token = useAuthToken();

  if (!token) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function PublicOnly({ children }) {
  const token = useAuthToken();

  if (token) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
