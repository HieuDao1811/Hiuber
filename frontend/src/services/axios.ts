import axios from "axios";
import { authService, orderService } from "../constants/app";
import { getAccessToken } from "./session";

const createApi = (baseURL: string) => {
  return axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    }
  })
}

export const authApi = createApi(authService);
export const orderApi = createApi(orderService);

orderApi.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
