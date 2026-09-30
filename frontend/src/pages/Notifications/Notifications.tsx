import { Header } from "../../components/layout/Header";
import { MobileNavbar } from "../../components/layout/MobileNavbar";
import { useRealtime } from "../../realtime/context";

const Notifications = () => {
  const {
    notifications,
    nextCursor,
    loadMoreNotifications,
    markAllRead,
    markRead,
  } = useRealtime();

  return (
    <div className="min-h-screen bg-brand-light text-dark">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-brand">Hộp thư</p>
            <h1 className="mt-1 text-2xl font-bold">Thông báo</h1>
          </div>
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
        {notifications.length === 0 ? (
          <p className="mt-6 border border-border bg-white p-5 text-sm text-muted">
            Chưa có thông báo nào.
          </p>
        ) : (
          <ul className="mt-5 space-y-2" aria-label="Danh sách thông báo">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!notification.readAt) void markRead(notification.id);
                  }}
                  className={`w-full border p-4 text-left transition ${
                    notification.readAt
                      ? "border-border bg-white"
                      : "border-brand/30 bg-brand/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold">{notification.title}</h2>
                    {!notification.readAt && (
                      <span className="text-[10px] font-bold uppercase text-brand">Mới</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">{notification.message}</p>
                  <time className="mt-2 block text-[11px] text-muted">
                    {new Date(notification.createdAt).toLocaleString("vi-VN")}
                  </time>
                </button>
              </li>
            ))}
          </ul>
        )}
        {nextCursor && (
          <button
            type="button"
            onClick={() => void loadMoreNotifications()}
            className="mt-4 w-full border border-border bg-white py-3 text-sm font-semibold hover:border-brand"
          >
            Xem thêm
          </button>
        )}
      </main>
      <MobileNavbar />
    </div>
  );
};

export default Notifications;
