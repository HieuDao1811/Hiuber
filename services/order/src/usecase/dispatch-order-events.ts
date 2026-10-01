import type { INotificationRepository } from "../interface/notification-repository.js";
import type { IOrderEventRepository } from "../interface/order-event-repository.js";
import type { IRealtimePublisher } from "../interface/realtime-publisher.js";

export class DispatchOrderEventsCommandHandler {
  constructor(
    private readonly events: IOrderEventRepository,
    private readonly notifications: INotificationRepository,
    private readonly publisher: IRealtimePublisher,
    private readonly retryBaseMs = 1_000,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(limit = 50): Promise<number> {
    const due = await this.events.findDue(this.now(), limit);
    for (const event of due) {
      try {
        const notifications = await this.notifications.findBySourceEvent(
          event.eventId,
        );
        this.publisher.publish(event, notifications);
        await this.events.markDispatched(event.eventId, this.now());
      } catch {
        const exponent = Math.min(event.attempts, 8);
        const nextAttemptAt = new Date(
          this.now().getTime() + this.retryBaseMs * 2 ** exponent,
        );
        await this.events.recordFailure(event.eventId, nextAttemptAt);
      }
    }
    return due.length;
  }
}
