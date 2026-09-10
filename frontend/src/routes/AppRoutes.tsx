import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import PublicRoute from "../components/routes/publicRoute";
import ProtectedRoute from "../components/routes/protectedRoute";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public static home page accessible to everyone */}
        <Route path="/" element={<Home />} />

        {/* Public-only routes (redirects to / if already logged in) */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Add protected features here when ready */}
        </Route>
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#313131",
            color: "#FFFFFF",
            fontFamily: "var(--font-sora)",
            borderRadius: "16px",
            padding: "12px 16px",
            fontSize: "13px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
          success: {
            iconTheme: {
              primary: "#C67C4E",
              secondary: "#FFFFFF",
            },
          },
        }}
      />
    </BrowserRouter>
  );
};

export default AppRoutes;
