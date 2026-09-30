import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createCustomerApp } from "../app.js";
import { AuthRpcClient } from "../infras/rpc/auth-rpc-client.js";
import type { IAuthService } from "../interface/auth-service.js";
import type {
  CreateCustomerAddressData,
  ICustomerAddressRepository,
  UpdateCustomerAddressData,
} from "../interface/repository/customer-address.repository.js";
import type {
  CreateCustomerProfileData,
  ICustomerProfileRepository,
  UpdateCustomerProfileData,
} from "../interface/repository/customer-profile.repository.js";
import type { CustomerAddress } from "../model/customer-address.js";
import {
  CreateCustomerAddressSchema,
  UpdateCustomerAddressSchema,
} from "../model/customer-address.js";
import type { CustomerProfile } from "../model/customer-profile.js";
import { CreateCustomerProfileSchema } from "../model/customer-profile.js";
import {
  AuthServiceUnavailableError,
  InvalidAccessTokenError,
} from "../model/errors.js";
import { UserRole } from "../model/requester.js";
import { SetDefaultAddressCommandHandler } from "./set-default-address.js";
import { UpdateAddressCommandHandler } from "./update-address.js";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

class MemoryProfileRepository implements ICustomerProfileRepository {
  constructor(public readonly profiles: CustomerProfile[] = []) {}

  async findByUserId(userId: string) {
    return this.profiles.find((profile) => profile.userId === userId) ?? null;
  }

  async create(data: CreateCustomerProfileData) {
    if (await this.findByUserId(data.userId)) {
      return null;
    }

    const now = new Date();
    const profile: CustomerProfile = {
      id: randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.profiles.push(profile);
    return profile;
  }

  async updateByUserId(userId: string, data: UpdateCustomerProfileData) {
    const profile = await this.findByUserId(userId);
    if (!profile) return null;
    Object.assign(profile, data, { updatedAt: new Date() });
    return profile;
  }
}

class MemoryAddressRepository implements ICustomerAddressRepository {
  constructor(public readonly addresses: CustomerAddress[] = []) {}

  async findManyByCustomerId(customerId: string) {
    return this.addresses.filter(
      (address) => address.customerId === customerId,
    );
  }

  async findOwned(addressId: string, customerId: string) {
    return this.owned(addressId, customerId);
  }

  async create(data: CreateCustomerAddressData) {
    const now = new Date();
    const address: CustomerAddress = {
      id: randomUUID(),
      ...data,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };
    this.addresses.push(address);
    return address;
  }

  async updateOwned(
    addressId: string,
    customerId: string,
    data: UpdateCustomerAddressData,
  ) {
    const address = this.owned(addressId, customerId);
    if (!address) return null;
    Object.assign(address, data, { updatedAt: new Date() });
    return address;
  }

  async deleteOwned(addressId: string, customerId: string) {
    const index = this.addresses.findIndex(
      (address) =>
        address.id === addressId && address.customerId === customerId,
    );
    if (index < 0) return false;
    this.addresses.splice(index, 1);
    return true;
  }

  async setDefault(addressId: string, customerId: string) {
    const address = this.owned(addressId, customerId);
    if (!address) return null;

    for (const item of this.addresses) {
      if (item.customerId === customerId) item.isDefault = false;
    }
    address.isDefault = true;
    address.updatedAt = new Date();
    return address;
  }

  private owned(addressId: string, customerId: string) {
    return (
      this.addresses.find(
        (address) =>
          address.id === addressId && address.customerId === customerId,
      ) ?? null
    );
  }
}

const profile = (userId = USER_ID): CustomerProfile => {
  const now = new Date();
  return {
    id: randomUUID(),
    userId,
    fullName: "Customer One",
    phone: null,
    createdAt: now,
    updatedAt: now,
  };
};

const address = (customerId: string, isDefault = false): CustomerAddress => {
  const now = new Date();
  return {
    id: randomUUID(),
    customerId,
    label: null,
    receiverName: "Customer One",
    receiverPhone: "0901234567",
    address: "123 Main Street",
    isDefault,
    createdAt: now,
    updatedAt: now,
  };
};

const listen = async (authService: IAuthService) => {
  const profiles = new MemoryProfileRepository();
  const addresses = new MemoryAddressRepository();
  const server = createCustomerApp({ profiles, addresses, authService }).listen(
    0,
    "127.0.0.1",
  );
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;
  return { server, profiles, addresses, url: `http://127.0.0.1:${port}` };
};

const close = async (server: Server) =>
  new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );

test("strict input schemas reject identity and default fields", () => {
  assert.throws(() =>
    CreateCustomerProfileSchema.parse({
      fullName: "Customer One",
      userId: OTHER_USER_ID,
    }),
  );
  assert.throws(() =>
    CreateCustomerAddressSchema.parse({
      receiverName: "Customer One",
      receiverPhone: "0901234567",
      address: "123 Main Street",
      customerId: randomUUID(),
      isDefault: true,
    }),
  );
  assert.throws(() =>
    UpdateCustomerAddressSchema.parse({ isDefault: true }),
  );
});

test("address use cases hide foreign addresses with 404 semantics", async () => {
  const currentProfile = profile();
  const foreignProfile = profile(OTHER_USER_ID);
  const profiles = new MemoryProfileRepository([
    currentProfile,
    foreignProfile,
  ]);
  const foreignAddress = address(foreignProfile.id);
  const addresses = new MemoryAddressRepository([foreignAddress]);

  await assert.rejects(
    new UpdateAddressCommandHandler(profiles, addresses).execute({
      userId: USER_ID,
      addressId: foreignAddress.id,
      input: { label: "Stolen" },
    }),
    (error: unknown) =>
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 404,
  );
});

test("setting defaults keeps at most one default address", async () => {
  const currentProfile = profile();
  const first = address(currentProfile.id, true);
  const second = address(currentProfile.id);
  const profiles = new MemoryProfileRepository([currentProfile]);
  const addresses = new MemoryAddressRepository([first, second]);
  const handler = new SetDefaultAddressCommandHandler(profiles, addresses);

  await handler.execute({ userId: USER_ID, addressId: second.id });

  assert.equal(first.isDefault, false);
  assert.equal(second.isDefault, true);
  assert.equal(
    addresses.addresses.filter((item) => item.isDefault).length,
    1,
  );
});

test("Auth RPC sends the exact verify contract and maps sub to userId", async () => {
  let receivedBody: unknown;
  const fetcher: typeof fetch = async (input, init) => {
    assert.equal(String(input), "http://auth.test/internal/auth/verify");
    assert.equal(init?.method, "POST");
    receivedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ sub: USER_ID, role: "CUSTOMER" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const requester = await new AuthRpcClient(
    "http://auth.test",
    5_000,
    fetcher,
  ).verifyAccessToken("access-token");

  assert.deepEqual(receivedBody, { accessToken: "access-token" });
  assert.deepEqual(requester, {
    userId: USER_ID,
    role: UserRole.CUSTOMER,
  });
});

test("Auth RPC rejects malformed successful responses as unavailable", async () => {
  const fetcher: typeof fetch = async () =>
    new Response(JSON.stringify({ userId: USER_ID, role: "CUSTOMER" }), {
      status: 200,
    });

  await assert.rejects(
    new AuthRpcClient("http://auth.test", 5_000, fetcher).verifyAccessToken(
      "access-token",
    ),
    AuthServiceUnavailableError,
  );
});

test("HTTP API enforces auth, profile conflict, and address input rules", async () => {
  const authService: IAuthService = {
    verifyAccessToken: async () => ({
      userId: USER_ID,
      role: UserRole.CUSTOMER,
    }),
  };
  const fixture = await listen(authService);

  try {
    const missingToken = await fetch(`${fixture.url}/v1/customers/me`);
    assert.equal(missingToken.status, 401);

    const headers = {
      authorization: "Bearer access-token",
      "content-type": "application/json",
    };
    const missingProfile = await fetch(`${fixture.url}/v1/customers/me`, {
      headers,
    });
    assert.equal(missingProfile.status, 404);

    const created = await fetch(`${fixture.url}/v1/customers/me`, {
      method: "POST",
      headers,
      body: JSON.stringify({ fullName: "Customer One" }),
    });
    assert.equal(created.status, 201);

    const conflict = await fetch(`${fixture.url}/v1/customers/me`, {
      method: "POST",
      headers,
      body: JSON.stringify({ fullName: "Customer One" }),
    });
    assert.equal(conflict.status, 409);

    const forbiddenDefault = await fetch(
      `${fixture.url}/v1/customers/me/addresses`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          receiverName: "Customer One",
          receiverPhone: "0901234567",
          address: "123 Main Street",
          isDefault: true,
        }),
      },
    );
    assert.equal(forbiddenDefault.status, 400);

    const invalidJson = await fetch(`${fixture.url}/v1/customers/me`, {
      method: "PATCH",
      headers,
      body: "{",
    });
    assert.equal(invalidJson.status, 400);
  } finally {
    await close(fixture.server);
  }
});

test("HTTP API returns 403 for a valid non-customer identity", async () => {
  const fixture = await listen({
    verifyAccessToken: async () => ({
      userId: USER_ID,
      role: UserRole.RESTAURANT,
    }),
  });

  try {
    const response = await fetch(`${fixture.url}/v1/customers/me`, {
      headers: { authorization: "Bearer access-token" },
    });
    assert.equal(response.status, 403);
  } finally {
    await close(fixture.server);
  }
});

test("HTTP API maps Auth failures to 401 and 503", async () => {
  const invalidToken = await listen({
    verifyAccessToken: async () => {
      throw new InvalidAccessTokenError();
    },
  });

  try {
    const response = await fetch(`${invalidToken.url}/v1/customers/me`, {
      headers: { authorization: "Bearer invalid" },
    });
    assert.equal(response.status, 401);
  } finally {
    await close(invalidToken.server);
  }

  const unavailable = await listen({
    verifyAccessToken: async () => {
      throw new AuthServiceUnavailableError();
    },
  });

  try {
    const response = await fetch(`${unavailable.url}/v1/customers/me`, {
      headers: { authorization: "Bearer access-token" },
    });
    assert.equal(response.status, 503);
  } finally {
    await close(unavailable.server);
  }
});
