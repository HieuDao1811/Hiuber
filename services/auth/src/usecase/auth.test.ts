import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  IAuthRepository,
  IRefreshTokenRepository,
  ITokenService,
  TokenPayload,
} from "../interface/index.js";
import {
  CreateRefreshTokenRecord,
  RefreshToken,
} from "../model/refresh-token.js";
import { CreateUserRecord, User } from "../model/user.js";
import { Role, UserStatus } from "../share/enums/index.js";
import { GetMeQueryHandler } from "./get-me.js";
import { RefreshTokenCommandHandler } from "./refresh-token.js";
import { RegisterCommandHandler } from "./register.js";
import { VerifyAccessTokenQueryHandler } from "./verify-access-token.js";

const createUser = (overrides: Partial<User> = {}): User => ({
  id: randomUUID(),
  email: "customer@example.com",
  passwordHash: "stored-hash",
  role: Role.CUSTOMER,
  status: UserStatus.ACTIVE,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

class MemoryUserRepository implements IAuthRepository {
  created?: CreateUserRecord;

  constructor(private user: User | null = null) {}

  async findById(id: string): Promise<User | null> {
    return this.user?.id === id ? this.user : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.user?.email === email ? this.user : null;
  }

  async create(data: CreateUserRecord): Promise<User> {
    this.created = data;
    this.user = createUser({ ...data });
    return this.user;
  }
}

class MemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly tokens = new Map<string, RefreshToken>();

  constructor(tokens: RefreshToken[] = []) {
    for (const token of tokens) {
      this.tokens.set(token.token, token);
    }
  }

  async create(data: CreateRefreshTokenRecord): Promise<RefreshToken> {
    const token = {
      id: randomUUID(),
      createdAt: new Date(),
      ...data,
    };
    this.tokens.set(token.token, token);
    return token;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.tokens.get(token) ?? null;
  }

  async consume(token: string): Promise<boolean> {
    const savedToken = this.tokens.get(token);
    if (!savedToken || savedToken.expiresAt <= new Date()) {
      return false;
    }

    return this.tokens.delete(token);
  }

  async revoke(token: string): Promise<void> {
    this.tokens.delete(token);
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    for (const [token, savedToken] of this.tokens) {
      if (savedToken.userId === userId) {
        this.tokens.delete(token);
      }
    }
  }
}

class FakeTokenService implements ITokenService {
  private refreshTokenSequence = 0;

  constructor(private readonly payload: TokenPayload) {}

  generateAccessToken(): string {
    return "new-access-token";
  }

  generateRefreshToken(): string {
    this.refreshTokenSequence += 1;
    return `new-refresh-token-${this.refreshTokenSequence}`;
  }

  verifyAccessToken(): TokenPayload {
    return this.payload;
  }

  verifyRefreshToken(): TokenPayload {
    return this.payload;
  }

  getExpiresAt(): Date {
    return new Date(Date.now() + 60_000);
  }
}

test("register stores database attributes and never returns passwordHash", async () => {
  const repository = new MemoryUserRepository();
  const handler = new RegisterCommandHandler(repository);

  const user = await handler.execute({
    command: {
      email: "  CUSTOMER@Example.com ",
      password: "secret123",
    },
  });

  assert.equal(user.email, "customer@example.com");
  assert.equal(user.role, Role.CUSTOMER);
  assert.equal(user.status, UserStatus.ACTIVE);
  assert.equal("passwordHash" in user, false);
  assert.equal(repository.created?.email, "customer@example.com");
});

test("register rejects privilege attributes from the request body", async () => {
  const handler = new RegisterCommandHandler(new MemoryUserRepository());
  const untrustedCommand = {
    email: "owner@example.com",
    password: "secret123",
    role: Role.RESTAURANT,
  };

  await assert.rejects(
    handler.execute({
      command: untrustedCommand,
    }),
  );
});

test("get me returns all safe user attributes", async () => {
  const storedUser = createUser({ role: Role.RESTAURANT });
  const handler = new GetMeQueryHandler(new MemoryUserRepository(storedUser));

  const user = await handler.query({ id: storedUser.id });

  assert.equal(user.id, storedUser.id);
  assert.equal(user.role, Role.RESTAURANT);
  assert.equal("passwordHash" in user, false);
});

test("access-token verification uses the current database role", async () => {
  const storedUser = createUser({ role: Role.RESTAURANT });
  const tokenService = new FakeTokenService({
    sub: storedUser.id,
    role: Role.CUSTOMER,
  });
  const handler = new VerifyAccessTokenQueryHandler(
    tokenService,
    new MemoryUserRepository(storedUser),
  );

  const requester = await handler.query({ accessToken: "access-token" });

  assert.deepEqual(requester, {
    sub: storedUser.id,
    role: Role.RESTAURANT,
  });
});

test("access-token verification rejects a deleted user", async () => {
  const storedUser = createUser({ status: UserStatus.DELETED });
  const handler = new VerifyAccessTokenQueryHandler(
    new FakeTokenService({ sub: storedUser.id, role: storedUser.role }),
    new MemoryUserRepository(storedUser),
  );

  await assert.rejects(handler.query({ accessToken: "access-token" }));
});

test("a refresh token can only be consumed once", async () => {
  const storedUser = createUser();
  const refreshToken = "saved-refresh-token";
  const tokenRepository = new MemoryRefreshTokenRepository([
    {
      id: randomUUID(),
      userId: storedUser.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    },
  ]);
  const handler = new RefreshTokenCommandHandler(
    new MemoryUserRepository(storedUser),
    tokenRepository,
    new FakeTokenService({ sub: storedUser.id, role: storedUser.role }),
  );

  const results = await Promise.allSettled([
    handler.execute({ command: { refreshToken } }),
    handler.execute({ command: { refreshToken } }),
  ]);

  assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(results.filter(({ status }) => status === "rejected").length, 1);
});
