import "dotenv/config";
import { createCustomerApp } from "./app.js";
import { prisma } from "./infras/database/prisma.js";
import { PrismaCustomerAddressRepository } from "./infras/repository/prisma/customer-address.repository.js";
import { PrismaCustomerProfileRepository } from "./infras/repository/prisma/customer-profile.repository.js";
import { AuthRpcClient } from "./infras/rpc/auth-rpc-client.js";

const port = Number(process.env.PORT ?? 3001);
const authServiceUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:3000";

const app = createCustomerApp({
  profiles: new PrismaCustomerProfileRepository(prisma),
  addresses: new PrismaCustomerAddressRepository(prisma),
  authRpc: new AuthRpcClient(authServiceUrl),
});

app.listen(port, () => {
  console.log(`Customer service is running on port: ${port}`);
});
