import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const app = express();

const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_SECRET_KEY } = process.env;

if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_SECRET_KEY) {
  throw new Error("Missing Cloudinary environment variables");
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_SECRET_KEY
})

const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.log(`Utils service is running on port: ${PORT}`);
});