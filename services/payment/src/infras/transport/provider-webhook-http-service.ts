import type { Request, Response } from "express";
import { InvalidProviderEventError } from "../../model/errors.js";
import { dataResponse } from "../../shared/http-response.js";
import type { ProcessProviderWebhookCommandHandler } from "../../usecase/process-provider-webhook.js";

export class ProviderWebhookHttpService {
  constructor(
    private readonly processWebhook: ProcessProviderWebhookCommandHandler,
  ) {}

  async receiveMock(request: Request, response: Response) {
    if (!Buffer.isBuffer(request.body)) throw new InvalidProviderEventError();
    const result = await this.processWebhook.execute(
      request.body,
      request.header("x-mock-signature"),
    );
    return response.status(200).json(
      dataResponse({
        received: true,
        duplicate: result.duplicate,
      }),
    );
  }
}
