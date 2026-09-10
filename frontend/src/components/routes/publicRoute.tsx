import { Navigate, Outlet } from "react-router-dom";
import { useAppData } from "../../hooks/useAuth"

const PublicRoute = () => {
  const { isAuth, loading } = useAppData();

  if (loading) return null;
  
  return isAuth ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoute;