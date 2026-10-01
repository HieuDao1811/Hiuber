import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { MobileNavbar } from "../../components/layout/MobileNavbar";
import { listCustomerOrders } from "../../services/orders/order.api";
import type { Order } from "../../services/orders/order.type";

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    void listCustomerOrders()
      .then(setOrders)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-brand-light text-dark">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-5">
        <p className="text-xs font-semibold text-brand">Theo dõi đơn</p>
        <h1 className="mt-1 text-2xl font-bold">Đơn hàng của tôi</h1>
        {loading && <p className="mt-6 text-sm text-muted">Đang tải đơn hàng…</p>}
        {error && (
          <p role="alert" className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Không thể tải đơn hàng. Vui lòng thử lại.
          </p>
        )}
        {!loading && !error && orders.length === 0 && (
          <p className="mt-6 border border-border bg-white p-5 text-sm text-muted">
            Bạn chưa có đơn hàng nào.
          </p>
        )}
        <ul className="mt-5 space-y-3" aria-label="Danh sách đơn hàng">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/orders/${order.id}`}
                className="block border border-border bg-white p-4 transition hover:border-brand"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold">#{order.id.slice(0, 8)}</span>
                  <span className="text-xs font-semibold text-brand">{order.status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>{order.paymentStatus}</span>
                  <span>{order.totalPrice} {order.currency}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <MobileNavbar />
    </div>
  );
};

export default Orders;
