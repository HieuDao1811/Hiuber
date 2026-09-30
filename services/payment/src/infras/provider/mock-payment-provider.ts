import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import type {
  IPaymentProvider,
  ProviderResult,
  VerifiedProviderEvent,
} from "../../interface/payment-provider.js";
import {
  InvalidProviderEventError,
  InvalidProviderSignatureError,
} from "../../model/errors.js";

export type MockOutcome = "PENDING" | "SUCCESS" | "FAILURE";

const MoneySchema = z.string().regex(/^(0|[1-9]\d{0,15})(?:\.\d{1,2})?$/);
const EventSchema = z
  .object({
    id: z.string().min(1).max(255).regex(/^[\x21-\x7E]+$/),
    type: z.enum(["payment.succeeded", "payment.failed"]),
    data: z
      .object({
        paymentId: z.uuid(),
        orderId: z.uuid(),
        providerTransactionId: z.string().min(1).max(255),
        amount: MoneySchema,
        currency: z.string().regex(/^[A-Z]{3}$/),
        failureCode: z.string().min(1).max(100).optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((event, context) => {
    if (event.type === "payment.failed" && !event.data.failureCode) {
      context.addIssue({
        code: "custom",
        path: ["data", "failureCode"],
        message: "failureCode is required for failed payments",
      });
    }
    if (event.type === "payment.succeeded" && event.data.failureCode) {
      context.addIssue({
        code: "custom",
        path: ["data", "failureCode"],
        message: "failureCode is not allowed for successful payments",
      });
    }
  });

export const signMockWebhook = (rawBody: Buffer, secret: string): string =>
  `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;

const signatureMatches = (
  rawBody: Buffer,
  receivedSignature: string | undefined,
  secret: string,
): boolean => {
  if (!receivedSignature) return false;
  const expected = Buffer.from(signMockWebhook(rawBody, secret));
  const received = Buffer.from(receivedSignature);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
};

export class MockPaymentProvider implements IPaymentProvider {
  constructor(
    private readonly outcome: MockOutcome,
    private readonly webhookSecret: string,
  ) {
    if (webhookSecret.length < 32) {
      throw new Error(
        "MOCK_PROVIDER_WEBHOOK_SECRET must have at least 32 characters",
      );
    }
  }

  async charge(): Promise<ProviderResult> {
    const providerTransactionId = `mock_${randomUUID()}`;
    if (this.outcome === "PENDING") {
      return { status: "PENDING", providerTransactionId };
    }
    if (this.outcome === "FAILURE") {
      return {
        status: "FAILED",
        providerTransactionId,
        failureCode: "MOCK_PAYMENT_DECLINED",
      };
    }
    return { status: "SUCCEEDED", providerTransactionId };
  }

  verifyWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ): VerifiedProviderEvent {
    if (!signatureMatches(rawBody, signature, this.webhookSecret)) {
      throw new InvalidProviderSignatureError();
    }

    let input: unknown;
    try {
      input = JSON.parse(rawBody.toString("utf8"));
    } catch {
      throw new InvalidProviderEventError();
    }
    const parsed = EventSchema.safeParse(input);
    if (!parsed.success) throw new InvalidProviderEventError();

    const { data } = parsed.data;
    const succeeded = parsed.data.type === "payment.succeeded";
    return {
      provider: "MOCK",
      providerEventId: parsed.data.id,
      paymentId: data.paymentId,
      orderId: data.orderId,
      providerTransactionId: data.providerTransactionId,
      amount: data.amount,
      currency: data.currency,
      status: succeeded ? "SUCCEEDED" : "FAILED",
      failureCode: succeeded ? null : data.failureCode!,
    };
  }
}
