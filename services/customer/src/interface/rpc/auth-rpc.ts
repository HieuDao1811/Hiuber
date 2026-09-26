import type { Requester } from "../requester.js";

export interface IAuthRpc {
  verify(accessToken: string): Promise<Requester>;
}
