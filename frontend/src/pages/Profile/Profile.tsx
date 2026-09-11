import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiChevronRight,
  FiClock,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMapPin,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import { Header } from "../../components/layout/Header";
import { MobileNavbar } from "../../components/layout/MobileNavbar";
import { useAuth } from "../../hooks/useAuth";

const menuItems = [
  { label: "Đơn hàng của tôi", description: "Xem lại các đơn đã đặt", icon: FiClock },
  { label: "Địa chỉ giao món", description: "Quản lý địa chỉ nhận hàng", icon: FiMapPin },
  { label: "Cài đặt tài khoản", description: "Thông báo và bảo mật", icon: FiSettings },
  { label: "Trợ giúp", description: "Cần hỗ trợ với đơn hàng?", icon: FiHelpCircle },
];

const Profile = () => {
  const { user, setIsAuth, setUser } = useAuth();
  const navigate = useNavigate();
  const firstLetter = user?.name?.charAt(0).toUpperCase() || "U";

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
    setUser(null);
    toast.success("Bạn đã đăng xuất");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-brand-light text-dark">
      <Header />

      <main className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-24 pt-5">
        <div>
          <p className="text-xs font-semibold text-brand">Tài khoản</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Hồ sơ của tôi</h1>
        </div>

        <section className="flex items-center gap-4 border border-border bg-white p-4">
          {user?.image ? (
            <img
              src={user.image}
              alt={`Ảnh đại diện của ${user.name}`}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">
              {firstLetter}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">{user?.name || "Tài khoản Hiuber"}</h2>
            <p className="mt-1 truncate text-sm text-muted">{user?.email || "Chưa cập nhật email"}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand">
              <FiUser aria-hidden="true" /> Thành viên Hiuber Food
            </p>
          </div>
        </section>

        <section className="border border-border bg-white">
          {menuItems.map(({ label, description, icon: Icon }, index) => (
            <button
              key={label}
              type="button"
              className={`flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-brand-light ${
                index < menuItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Icon aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="mt-0.5 block truncate text-xs text-muted">{description}</span>
              </span>
              <FiChevronRight className="shrink-0 text-muted" aria-hidden="true" />
            </button>
          ))}
        </section>

        <section className="border border-border bg-white">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left transition hover:bg-brand-light"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
              <FiHome aria-hidden="true" />
            </span>
            <span className="flex-1 text-sm font-semibold">Về trang chủ</span>
            <FiChevronRight className="text-muted" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-4 text-left text-red-600 transition hover:bg-red-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50">
              <FiLogOut aria-hidden="true" />
            </span>
            <span className="flex-1 text-sm font-semibold">Đăng xuất</span>
            <FiChevronRight className="text-red-300" aria-hidden="true" />
          </button>
        </section>
      </main>

      <MobileNavbar />
    </div>
  );
};

export default Profile;
