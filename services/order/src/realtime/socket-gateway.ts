import type { Server, Socket } from "socket.io";
import { z } from "zod";
import type { IAuthService } from "../interface/auth-service.js";
import type { Requester } from "../model/requester.js";
import { AppError } from "../shared/app-error.js";
import {
  orderRoom,
  personalRoom,
  RealtimeEventName,
  restaurantRoom,
} from "./events.js";
import type { RealtimeSubscriptionAuthorizer } from "./subscription-authorizer.js";

const OrderSubscriptionSchema = z.object({ orderId: z.uuid() }).strict();
const RestaurantSubscriptionSchema = z
  .object({ restaurantId: z.uuid() })
  .strict();

interface AuthenticatedSocketData {
  requester: Requester;
  accessToken: string;
  verifiedAt: number;
}

export const authenticateSocketToken = async (
  authService: IAuthService,
  accessToken: unknown,
): Promise<AuthenticatedSocketData> => {
  if (typeof accessToken !== "string" || !accessToken) {
    throw new Error("UNAUTHENTICATED");
  }
  const requester = await authService.verifyAccessToken(accessToken);
  return { requester, accessToken, verifiedAt: Date.now() };
};

type SubscriptionAck = (result: {
  ok: boolean;
  error?: { code: string; message: string };
}) => void;

const socketData = (socket: Socket): AuthenticatedSocketData =>
  socket.data as AuthenticatedSocketData;

const ackError = (ack: SubscriptionAck | undefined, error: unknown) => {
  if (!ack) return;
  if (error instanceof AppError) {
    ack({ ok: false, error: { code: error.code, message: error.message } });
    return;
  }
  if (error instanceof z.ZodError) {
    ack({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid subscription" },
    });
    return;
  }
  ack({
    ok: false,
    error: { code: "SUBSCRIPTION_FAILED", message: "Subscription failed" },
  });
};

export const registerSocketGateway = (
  io: Server,
  authService: IAuthService,
  authorizer: RealtimeSubscriptionAuthorizer,
  authRecheckMs: number,
) => {
  const verify = async (socket: Socket) => {
    const data = socketData(socket);
    const requester = await authService.verifyAccessToken(data.accessToken);
    if (
      data.requester &&
      (requester.userId !== data.requester.userId ||
        requester.role !== data.requester.role)
    ) {
      throw new Error("Socket identity changed");
    }
    data.requester = requester;
    data.verifiedAt = Date.now();
  };

  io.use(async (socket, next) => {
    const accessToken = socket.handshake.auth?.accessToken;
    try {
      socket.data = await authenticateSocketToken(authService, accessToken);
      next();
    } catch {
      next(new Error("UNAUTHENTICATED"));
    }
  });

  io.on("connection", (socket) => {
    const data = socketData(socket);
    void socket.join(personalRoom(data.requester.userId));

    let checking = false;
    const recheck = async () => {
      if (checking || !socket.connected) return;
      checking = true;
      try {
        await verify(socket);
      } catch {
        socket.emit(RealtimeEventName.AUTH_EXPIRED, {
          code: "INVALID_ACCESS_TOKEN",
          message: "Access token expired or was revoked",
        });
        socket.disconnect(true);
      } finally {
        checking = false;
      }
    };
    const authTimer = setInterval(() => void recheck(), authRecheckMs);

    socket.on(
      "order:subscribe",
      async (input: unknown, ack?: SubscriptionAck) => {
        try {
          await verify(socket);
          const { orderId } = OrderSubscriptionSchema.parse(input);
          await authorizer.authorizeOrder(socketData(socket).requester, orderId);
          await socket.join(orderRoom(orderId));
          ack?.({ ok: true });
        } catch (error) {
          ackError(ack, error);
        }
      },
    );
    socket.on("order:unsubscribe", (input: unknown) => {
      const parsed = OrderSubscriptionSchema.safeParse(input);
      if (parsed.success) void socket.leave(orderRoom(parsed.data.orderId));
    });
    socket.on(
      "restaurant:subscribe",
      async (input: unknown, ack?: SubscriptionAck) => {
        try {
          await verify(socket);
          const { restaurantId } = RestaurantSubscriptionSchema.parse(input);
          await authorizer.authorizeRestaurant(
            socketData(socket).requester,
            restaurantId,
          );
          await socket.join(restaurantRoom(restaurantId));
          ack?.({ ok: true });
        } catch (error) {
          ackError(ack, error);
        }
      },
    );
    socket.on("restaurant:unsubscribe", (input: unknown) => {
      const parsed = RestaurantSubscriptionSchema.safeParse(input);
      if (parsed.success) {
        void socket.leave(restaurantRoom(parsed.data.restaurantId));
      }
    });
    socket.on("disconnect", () => clearInterval(authTimer));
  });
};
