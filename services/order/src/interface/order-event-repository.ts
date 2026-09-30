import type { StoredOrderEvent } from "../model/order-event.js";

export interface IOrderEventRepository {
  findDue(now: Date, limit: number): Promise<StoredOrderEvent[]>;
  markDispatched(eventId: string, dispatchedAt: Date): Promise<void>;
  recordFailure(eventId: string, nextAttemptAt: Date): Promise<void>;
}
