import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { MobileNavbar } from "../../components/layout/MobileNavbar";
import { useRealtime } from "../../realtime/context";
import {
  getCustomerOrder,
  getRestaurantOrder,
} from "../../services/orders/order.api";
import type { Order } from "../../services/orders/order.type";

const OrderDetails = () => {
  const { orderId = "", restaurantId } = useParams();
  const {
    orderEvents,
    subscribeOrder,
    subscribeRestaurant,
    syncEpoch,
  } = useRealtime();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    void (async () => {
      try {
        const result = restaurantId
          ? await getRestaurantOrder(restaurantId, orderId)
          : await getCustomerOrder(orderId);
        if (active) {
          setOrder(result);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId, restaurantId, syncEpoch]);

  useEffect(() => {
    if (!orderId) return;
    const unsubscribeOrder = subscribeOrder(orderId);
    const unsubscribeRestaurant = restaurantId
      ? subscribeRestaurant(restaurantId)
      : () => undefined;
    return () => {
      unsubscribeOrder();
      unsubscribeRestaurant();
    };
  }, [orderId, restaurantId, subscribeOrder, subscribeRestaurant]);

  const event = orderEvents[orderId];
  const displayedOrder =
    order && event && event.version > order.version
      ? {
          ...order,
          version: event.version,
          status: event.orderStatus,
          paymentStatus: event.paymentStatus,
          paymentMethod: event.paymentMethod,
          updatedAt: event.occurredAt,
        }
      : order;

  return (
    <div className="min-h-screen bg-brand-light text-dark">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-5">
        <p className="text-xs font-semibold text-brand">Cập nhật thời gian thực</p>
        <h1 className="mt-1 text-2xl font-bold">Chi tiết đơn hàng</h1>
        {loading && <p className="mt-6 text-sm text-muted">Đang tải đơn hàng…</p>}
        {error && (
          <p role="alert" className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Bạn không có quyền xem đơn này hoặc đơn không tồn tại.
          </p>
        )}
        {displayedOrder && !error && (
          <div className="mt-5 space-y-4">
            <section className="border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">Mã đơn</p>
                  <p className="mt-1 font-mono text-sm">{displayedOrder.id}</p>
                </div>
                <span className="text-sm font-bold text-brand">{displayedOrder.status}</span>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-xs text-muted">Thanh toán</dt><dd className="mt-1 font-semibold">{displayedOrder.paymentStatus}</dd></div>
                <div><dt className="text-xs text-muted">Phương thức</dt><dd className="mt-1 font-semibold">{displayedOrder.paymentMethod ?? "Chưa chọn"}</dd></div>
                <div><dt className="text-xs text-muted">Tổng tiền</dt><dd className="mt-1 font-semibold">{displayedOrder.totalPrice} {displayedOrder.currency}</dd></div>
                <div><dt className="text-xs text-muted">Phiên bản</dt><dd className="mt-1 font-semibold">{displayedOrder.version}</dd></div>
              </dl>
            </section>
            <section className="border border-border bg-white p-4">
              <h2 className="text-sm font-bold">Giao đến</h2>
              <p className="mt-2 text-sm">{displayedOrder.receiverName} · {displayedOrder.receiverPhone}</p>
              <p className="mt-1 text-xs text-muted">{displayedOrder.deliveryAddress}</p>
            </section>
            <section className="border border-border bg-white p-4">
              <h2 className="text-sm font-bold">Món ăn</h2>
              <ul className="mt-3 divide-y divide-border">
                {displayedOrder.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                    <span>{item.quantity} × {item.name}</span>
                    <span className="font-semibold">{item.lineTotal} {displayedOrder.currency}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
      <MobileNavbar />
    </div>
  );
};

export default OrderDetails;
