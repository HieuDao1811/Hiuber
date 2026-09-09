import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { authRouter } from "./router/index.js";
import cors from "cors";

dotenv.config();

const PORT = process.env.PORT || 5000;

await connectDB();

const app = express();

  app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(authRouter());

app.listen(PORT, () => {
  console.log(`Auth service is running on port ${PORT}`);
});