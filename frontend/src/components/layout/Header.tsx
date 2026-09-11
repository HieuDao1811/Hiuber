import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiChevronDown, FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";

export const Header = () => {
  const { user, isAuth, setIsAuth, setUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
    setUser(null);
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white text-dark border-b border-border shadow-xs">
      <div className="max-w-md md:max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-bold text-white shadow-xs">
            H
          </div>
          <span className="font-bold text-base tracking-tight text-dark">Hiuber</span>
        </Link>

        {/* User / Sign in button */}
        <div className="flex items-center gap-2">
          {isAuth && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <FiChevronDown className="text-muted text-xs" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white text-dark rounded-xl shadow-lg border border-border py-1 z-20">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs font-semibold truncate">{user.name}</p>
                      <p className="text-[11px] text-muted truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-dark hover:bg-brand-light transition-colors"
                    >
                      <FiUser />
                      <span>Hồ sơ của tôi</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 text-left cursor-pointer transition-colors"
                    >
                      <FiLogOut />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-medium transition-colors"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
