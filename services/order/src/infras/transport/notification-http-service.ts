import type { Request, Response } from "express";
import {
  CursorPaginationSchema,
  NotificationIdSchema,
} from "../../model/order.dto.js";
import { UnauthenticatedError } from "../../model/errors.js";
import { RequesterSchema } from "../../model/requester.js";
import {
  cursorPageResponse,
  dataResponse,
} from "../../shared/http-response.js";
import type { CountUnreadNotificationsQueryHandler } from "../../usecase/count-unread-notifications.js";
import type { ListNotificationsQueryHandler } from "../../usecase/list-notifications.js";
import type { MarkAllNotificationsReadCommandHandler } from "../../usecase/mark-all-notifications-read.js";
import type { MarkNotificationReadCommandHandler } from "../../usecase/mark-notification-read.js";

export class NotificationHttpService {
  constructor(
    private readonly listNotifications: ListNotificationsQueryHandler,
    private readonly countUnread: CountUnreadNotificationsQueryHandler,
    private readonly markRead: MarkNotificationReadCommandHandler,
    private readonly markAllRead: MarkAllNotificationsReadCommandHandler,
  ) {}

  private userId(response: Response): string {
    const requester = RequesterSchema.safeParse(response.locals.requester);
    if (!requester.success) throw new UnauthenticatedError();
    return requester.data.userId;
  }

  async list(request: Request, response: Response) {
    const pagination = CursorPaginationSchema.parse(request.query);
    const page = await this.listNotifications.query(
      this.userId(response),
      pagination,
    );
    return response.status(200).json(cursorPageResponse(page));
  }

  async unread(_request: Request, response: Response) {
    return response
      .status(200)
      .json(dataResponse(await this.countUnread.query(this.userId(response))));
  }

  async read(request: Request, response: Response) {
    const id = NotificationIdSchema.parse(request.params.notificationId);
    return response.status(200).json(
      dataResponse(await this.markRead.execute(id, this.userId(response))),
    );
  }

  async readAll(_request: Request, response: Response) {
    return response.status(200).json(
      dataResponse(await this.markAllRead.execute(this.userId(response))),
    );
  }
}
