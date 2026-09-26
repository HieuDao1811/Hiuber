import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { createCustomerApp } from "../app.js";
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
import { UpdateCustomerProfileSchema } from "../model/customer-profile.js";
import type { CustomerProfile } from "../model/customer-profile.js";
import { AppError } from "../shared/app-error.js";
import { AuthRpcClient } from "../infras/rpc/auth-rpc-client.js";
import { CreateAddress } from "./create-address.js";
import { DeleteAddress } from "./delete-address.js";
import { SetDefaultAddress } from "./set-default-address.js";
import { UpdateAddress } from "./update-address.js";
import { UpdateMyProfile } from "./update-my-profile.js";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const CUSTOMER_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_CUSTOMER_ID = "44444444-4444-4444-8444-444444444444";

class MemoryProfileRepository implements ICustomerProfileRepository {
  profiles: CustomerProfile[] = [];

  findByUserId(userId: string) {
    return Promise.resolve(
      this.profiles.find((profile) => profile.userId === userId) ?? null,
    );
  }

  create(data: CreateCustomerProfileData) {
    const profile = { ...data };
    this.profiles.push(profile);
    return Promise.resolve(profile);
  }

  async updateByUserId(userId: string, data: UpdateCustomerProfileData) {
    const profile = await this.findByUserId(userId);
    assert(profile);
    Object.assign(profile, data);
    return profile;
  }
}

class MemoryAddressRepository implements ICustomerAddressRepository {
  addresses: CustomerAddress[] = [];

  findManyByCustomerId(customerId: string) {
    return Promise.resolve(
      this.addresses.filter((address) => address.customerId === customerId),
    );
  }

  create(data: CreateCustomerAddressData) {
    if (data.isDefault) this.clearDefault(data.customerId);
    const address = { ...data };
    this.addresses.push(address);
    return Promise.resolve(address);
  }

  async updateOwned(
    addressId: string,
    customerId: string,
    data: UpdateCustomerAddressData,
  ) {
    const address = this.owned(addressId, customerId);
    if (!address) return null;
    if (data.isDefault) this.clearDefault(customerId);
    Object.assign(address, data);
    return address;
  }

  deleteOwned(addressId: string, customerId: string) {
    const index = this.addresses.findIndex(
      (address) =>
        address.id === addressId && address.customerId === customerId,
    );
    if (index < 0) return Promise.resolve(false);
    this.addresses.splice(index, 1);
    return Promise.resolve(true);
  }

  async setDefault(addressId: string, customerId: string) {
    const address = this.owned(addressId, customerId);
    if (!address) return null;
    this.clearDefault(customerId);
    address.isDefault = true;
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

  private clearDefault(customerId: string) {
    for (const address of this.addresses) {
      if (address.customerId === customerId) address.isDefault = false;
    }
  }
}

const seedProfile = (profiles: MemoryProfileRepository) => {
  profiles.profiles.push({
    id: CUSTOMER_ID,
    userId: USER_ID,
    fullName: "Customer One",
    phone: null,
  });
};

const addressInput = (label: string, isDefault = false) => ({
  label,
  receiverName: "Customer One",
  receiverPhone: "0901234567",
  address: `${label} address`,
  isDefault,
});

test("PATCH profile creates the profile once and strict DTO rejects userId", async () => {
  const profiles = new MemoryProfileRepository();
  const useCase = new UpdateMyProfile(profiles);

  const result = await useCase.execute({
    userId: USER_ID,
    input: { fullName: "Customer One", phone: null },
  });

  assert.equal(result.created, true);
  assert.equal(result.profile.userId, USER_ID);
  assert.throws(() =>
    UpdateCustomerProfileSchema.parse({
      fullName: "Other",
      userId: OTHER_USER_ID,
    }),
  );
});

test("address operations return 404 for an address owned by another customer", async () => {
  const profiles = new MemoryProfileRepository();
  const addresses = new MemoryAddressRepository();
  seedProfile(profiles);
  const foreignId = "55555555-5555-4555-8555-555555555555";
  await addresses.create({
    id: foreignId,
    customerId: OTHER_CUSTOMER_ID,
    ...addressInput("Foreign"),
  });

  const update = new UpdateAddress(profiles, addresses);
  await assert.rejects(
    update.execute({
      userId: USER_ID,
      addressId: foreignId,
      input: { label: "Stolen" },
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.code === "CUSTOMER_ADDRESS_NOT_FOUND",
  );
});

test("create and set-default keep at most one default address", async () => {
  const profiles = new MemoryProfileRepository();
  const addresses = new MemoryAddressRepository();
  seedProfile(profiles);
  const create = new CreateAddress(profiles, addresses);
  const setDefault = new SetDefaultAddress(profiles, addresses);

  const first = await create.execute({
    userId: USER_ID,
    input: addressInput("Home", true),
  });
  const second = await create.execute({
    userId: USER_ID,
    input: addressInput("Office", true),
  });

  assert.equal(first.isDefault, false);
  assert.equal(second.isDefault, true);

  await setDefault.execute({ userId: USER_ID, addressId: first.id });
  assert.equal(first.isDefault, true);
  assert.equal(second.isDefault, false);
  assert.equal(
    addresses.addresses.filter((address) => address.isDefault).length,
    1,
  );
});

test("deleting the default address does not promote another address", async () => {
  const profiles = new MemoryProfileRepository();
  const addresses = new MemoryAddressRepository();
  seedProfile(profiles);
  const create = new CreateAddress(profiles, addresses);
  const remove = new DeleteAddress(profiles, addresses);

  const defaultAddress = await create.execute({
    userId: USER_ID,
    input: addressInput("Home", true),
  });
  await create.execute({
    userId: USER_ID,
    input: addressInput("Office"),
  });

  await remove.execute({ userId: USER_ID, addressId: defaultAddress.id });
  assert.equal(addresses.addresses.some((address) => address.isDefault), false);
});

test("Customer HTTP API verifies its bearer token through the Auth RPC contract", async () => {
  let receivedBody = "";
  const authServer = createServer((request, response) => {
    request.setEncoding("utf8");
    request.on("data", (chunk) => (receivedBody += chunk));
    request.on("end", () => {
      assert.equal(request.url, "/internal/auth/verify");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ sub: USER_ID, role: "CUSTOMER" }));
    });
  });

  await new Promise<void>((resolve) =>
    authServer.listen(0, "127.0.0.1", resolve),
  );
  const authPort = (authServer.address() as AddressInfo).port;

  const profiles = new MemoryProfileRepository();
  const customerApp = createCustomerApp({
    profiles,
    addresses: new MemoryAddressRepository(),
    authRpc: new AuthRpcClient(`http://127.0.0.1:${authPort}`),
  });
  const customerServer = customerApp.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => customerServer.once("listening", resolve));
  const customerPort = (customerServer.address() as AddressInfo).port;

  try {
    const response = await fetch(
      `http://127.0.0.1:${customerPort}/v1/customers/me`,
      {
        method: "PATCH",
        headers: {
          authorization: "Bearer access-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ fullName: "Customer One" }),
      },
    );

    assert.equal(response.status, 201);
    assert.deepEqual(JSON.parse(receivedBody), { accessToken: "access-token" });
    assert.equal(profiles.profiles[0]?.userId, USER_ID);
  } finally {
    customerServer.close();
    authServer.close();
  }
});
