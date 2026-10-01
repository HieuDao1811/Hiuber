import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { InvalidInternalServiceKeyError } from "../model/errors.js";

const equalsSecret = (received: string, expected: string): boolean => {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
};

export const authenticateInternalService = (
  expectedKey: string,
): RequestHandler => (request, _response, next) => {
  const receivedKey = request.header("x-internal-service-key") ?? "";
  if (!equalsSecret(receivedKey, expectedKey)) {
    next(new InvalidInternalServiceKeyError());
    return;
  }
  next();
};
