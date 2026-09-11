import { useSearchParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { MobileNavbar } from "../../components/layout/MobileNavbar";
import Navbar from "../../components/navbar";
import { FiClock, FiHeart, FiMapPin, FiPercent, FiStar } from "react-icons/fi";
import { MdBakeryDining, MdLocalCafe, MdLunchDining, MdOutlineFastfood } from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";

const categories = [
  { name: "Cơm", icon: MdLunchDining },
  { name: "Đồ ăn nhanh", icon: MdOutlineFastfood },
  { name: "Cà phê", icon: MdLocalCafe },
  { name: "Bánh ngọt", icon: MdBakeryDining },
];

const restaurants = [
  { name: "Bếp Nhà Mình", cuisine: "Cơm nhà · Món Việt", time: "25-35 phút", rating: "4.8" },
  { name: "Góc Burger", cuisine: "Burger · Đồ ăn nhanh", time: "20-30 phút", rating: "4.7" },
  { name: "Cà Phê Sáng", cuisine: "Cà phê · Bánh ngọt", time: "15-25 phút", rating: "4.9" },
];

const Home = () => {
  const { isAuth, user } = useAuth();
  const [searchParams] = useSearchParams();
  const city = searchParams.get("city") || "Hồ Chí Minh";

  return (
    <div className="min-h-screen bg-brand-light text-dark">
      <Header />

      <main className="mx-auto w-full max-w-3xl space-y-7 px-4 pb-24 pt-5">
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-brand">
              {isAuth && user ? `Xin chào, ${user.name}` : "Bữa ăn ngon đang chờ bạn"}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Hôm nay ăn gì?</h1>
            <p className="mt-1 text-sm text-muted">Tìm món yêu thích và đặt từ nhà hàng gần bạn.</p>
          </div>
          <Navbar />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">Bạn muốn ăn gì?</h2>
            <button type="button" className="text-xs font-semibold text-brand">Xem tất cả</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {categories.map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                className="flex flex-col items-center gap-2 border border-border bg-white p-3 text-center transition hover:border-brand"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand"><Icon className="h-5 w-5" /></span>
                <span className="text-xs font-semibold">{name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Nhà hàng gần bạn</h2>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted"><FiMapPin className="text-brand" /> {city}</p>
            </div>
            <button type="button" className="text-xs font-semibold text-brand">Xem tất cả</button>
          </div>
          <div className="space-y-3">
            {restaurants.map((restaurant) => (
              <article key={restaurant.name} className="flex gap-3 border border-border bg-white p-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-brand/10 text-brand"><MdOutlineFastfood className="h-8 w-8" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-bold">{restaurant.name}</h3>
                    <button type="button" aria-label={`Yêu thích ${restaurant.name}`} className="text-muted hover:text-brand"><FiHeart /></button>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">{restaurant.cuisine}</p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
                    <span className="flex items-center gap-1 text-dark"><FiStar className="text-brand" /> {restaurant.rating}</span>
                    <span className="flex items-center gap-1"><FiClock /> {restaurant.time}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border border-brand/20 bg-brand/5 p-4">
          <div className="flex items-center gap-2 text-brand"><FiPercent /><h2 className="text-sm font-bold">Ưu đãi cho bữa ăn đầu tiên</h2></div>
          <p className="mt-2 text-sm font-semibold">Giảm 30% tối đa 50.000đ</p>
          <p className="mt-1 text-xs text-muted">Áp dụng cho đơn từ 100.000đ với mã HIUBERFOOD.</p>
        </section>
      </main>

      <MobileNavbar />
    </div>
  );
};

export default Home;