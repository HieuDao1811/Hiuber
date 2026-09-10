import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { MobileNavbar } from "../../components/layout/MobileNavbar";
import { FiSearch, FiMapPin, FiArrowRight, FiPercent, FiClock } from "react-icons/fi";
import { RiMotorbikeFill, RiCarFill } from "react-icons/ri";
import { MdOutlineFastfood, MdLocalShipping } from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";

const Home = () => {
  const { isAuth, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const services = [
    { id: "bike", name: "Xe máy", icon: RiMotorbikeFill, desc: "Di chuyển nhanh" },
    { id: "car", name: "Ô tô", icon: RiCarFill, desc: "Thoải mái 4-7 chỗ" },
    { id: "delivery", name: "Giao hàng", icon: MdLocalShipping, desc: "Siêu tốc 30p" },
    { id: "food", name: "Đồ ăn", icon: MdOutlineFastfood, desc: "Món ngon nóng hổi" },
  ];

  const quickPlaces = [
    { title: "Nhà riêng", address: "123 Nguyễn Huệ, Quận 1" },
    { title: "Công ty", address: "Tòa nhà Bitexco, Quận 1" },
  ];

  const promos = [
    {
      id: 1,
      title: "Giảm 50% chuyến đầu tiên",
      code: "HIUBERNEW",
      desc: "Áp dụng cho xe máy & ô tô",
    },
    {
      id: 2,
      title: "Freeship đơn đồ ăn từ 50k",
      code: "FREESHIP",
      desc: "Tất cả nhà hàng",
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-dark flex flex-col">
      <Header />

      <main className="flex-1 max-w-md md:max-w-3xl w-full mx-auto p-4 pb-20 space-y-4">
        {/* Banner chào mừng & Ô tìm kiếm */}
        <div className="bg-dark text-white rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-xs text-brand font-medium">
              {isAuth && user ? `Xin chào, ${user.name} 👋` : "Chào mừng đến với Hiuber"}
            </p>
            <h1 className="text-lg font-bold">Bạn muốn đi đâu hôm nay?</h1>
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm điểm đến hoặc dịch vụ..."
              className="w-full pl-10 pr-4 py-2.5 bg-white text-dark text-sm rounded-xl outline-none placeholder:text-muted"
            />
          </div>
        </div>

        {/* Khối Đăng nhập (chỉ hiển thị khi chưa đăng nhập) */}
        {!isAuth && (
          <div className="bg-brand/10 border border-brand/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-dark">Đăng nhập để trải nghiệm đầy đủ</h2>
              <p className="text-xs text-muted mt-0.5">Đặt xe, lưu địa chỉ và nhận nhiều ưu đãi</p>
            </div>
            <Link
              to="/login"
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl flex items-center gap-1 shrink-0"
            >
              <span>Đăng nhập</span>
              <FiArrowRight />
            </Link>
          </div>
        )}

        {/* Danh mục dịch vụ chính */}
        <section>
          <h2 className="text-sm font-bold mb-2">Dịch vụ</h2>
          <div className="grid grid-cols-4 gap-2">
            {services.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="bg-white border border-border p-3 rounded-xl flex flex-col items-center text-center hover:border-brand transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center mb-1.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold">{item.name}</span>
                  <span className="text-[10px] text-muted truncate w-full mt-0.5">
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Địa điểm thường dùng */}
        <section>
          <h2 className="text-sm font-bold mb-2">Địa điểm gợi ý</h2>
          <div className="space-y-2">
            {quickPlaces.map((place, index) => (
              <button
                key={index}
                type="button"
                className="w-full bg-white border border-border p-3 rounded-xl flex items-center gap-3 text-left hover:border-brand transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <FiMapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{place.title}</p>
                  <p className="text-[11px] text-muted truncate">{place.address}</p>
                </div>
                <FiClock className="text-muted w-4 h-4 shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* Ưu đãi hot */}
        <section>
          <h2 className="text-sm font-bold mb-2">Ưu đãi nổi bật</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {promos.map((promo) => (
              <div
                key={promo.id}
                className="bg-white border border-border p-3.5 rounded-xl flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1 text-brand text-xs font-bold">
                    <FiPercent />
                    <span>{promo.code}</span>
                  </div>
                  <p className="text-xs font-semibold text-dark mt-1 truncate">{promo.title}</p>
                  <p className="text-[11px] text-muted">{promo.desc}</p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-dark text-white text-[11px] font-medium rounded-lg shrink-0"
                >
                  Dùng ngay
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <MobileNavbar />
    </div>
  );
};

export default Home;