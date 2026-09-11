import { FiHome, FiClipboard, FiTag, FiUser } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const MobileNavbar = () => {
  const location = useLocation();
  const { isAuth } = useAuth();

  const navItems = [
    { label: "Trang chủ", icon: FiHome, path: "/" },
    { label: "Đơn hàng", icon: FiClipboard, path: isAuth ? "/orders" : "/login" },
    { label: "Ưu đãi", icon: FiTag, path: "/offers" },
    { label: "Tài khoản", icon: FiUser, path: isAuth ? "/profile" : "/login" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border pb-safe">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-1 text-xs ${
                isActive ? "text-brand font-semibold" : "text-muted hover:text-dark"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
