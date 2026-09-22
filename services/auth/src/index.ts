import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { setUpAuthHexagon } from "./route/index.js";
import { setUpInternalAuthHexagon } from "./route/internal.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

const port = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/v1", setUpAuthHexagon);
app.use("/internal", setUpInternalAuthHexagon());
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Auth service is running on port: ${port}`);
})
