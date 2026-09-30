import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Profile from "../pages/Profile/Profile";
import PublicRoute from "../components/routes/publicRoute";
import ProtectedRoute from "../components/routes/protectedRoute";
import Notifications from "../pages/Notifications/Notifications";
import OrderDetails from "../pages/Orders/OrderDetails";
import Orders from "../pages/Orders/Orders";

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
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetails />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route
            path="/restaurants/:restaurantId/orders/:orderId"
            element={<OrderDetails />}
          />
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
