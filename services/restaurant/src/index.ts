import express from "express";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 6000

const app = express();

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Restaurant service is running on port: ${PORT}`);
});