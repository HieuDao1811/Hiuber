import { Router } from "express";
import { NotificationHttpService } from "../infras/transport/notification-http-service.js";
import type { IAuthService } from "../interface/auth-service.js";
import type { INotificationRepository } from "../interface/notification-repository.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { UserRole } from "../share/enums/index.js";
import { CountUnreadNotificationsQueryHandler } from "../usecase/count-unread-notifications.js";
import { ListNotificationsQueryHandler } from "../usecase/list-notifications.js";
import { MarkAllNotificationsReadCommandHandler } from "../usecase/mark-all-notifications-read.js";
import { MarkNotificationReadCommandHandler } from "../usecase/mark-notification-read.js";

export const createNotificationRouter = (dependencies: {
  authService: IAuthService;
  notifications: INotificationRepository;
}) => {
  const router = Router();
  const http = new NotificationHttpService(
    new ListNotificationsQueryHandler(dependencies.notifications),
    new CountUnreadNotificationsQueryHandler(dependencies.notifications),
    new MarkNotificationReadCommandHandler(dependencies.notifications),
    new MarkAllNotificationsReadCommandHandler(dependencies.notifications),
  );
  router.use(
    authenticate(dependencies.authService),
    authorize(UserRole.CUSTOMER, UserRole.RESTAURANT),
  );
  router.get("/", http.list.bind(http));
  router.get("/unread-count", http.unread.bind(http));
  router.patch("/read-all", http.readAll.bind(http));
  router.patch("/:notificationId/read", http.read.bind(http));
  return router;
};
