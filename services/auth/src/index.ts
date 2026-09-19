import express from "express";
import dotenv from "dotenv";
import { setUpAuthHexagon } from "./route/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/v1", setUpAuthHexagon);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Auth service is running on port: ${port}`);
})
