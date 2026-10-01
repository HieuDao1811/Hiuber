import express, { Router } from "express";
import { ProviderWebhookHttpService } from "../infras/transport/provider-webhook-http-service.js";
import type { ProcessProviderWebhookCommandHandler } from "../usecase/process-provider-webhook.js";

export const createProviderWebhookRouter = (
  processWebhook: ProcessProviderWebhookCommandHandler,
) => {
  const router = Router();
  const http = new ProviderWebhookHttpService(processWebhook);
  router.post(
    "/mock",
    express.raw({ type: "application/json", limit: "50kb" }),
    http.receiveMock.bind(http),
  );
  return router;
};
