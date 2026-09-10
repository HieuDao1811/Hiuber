import { authApi } from "../axios"
import type { LoginRequest, RegisterRequest } from "./auth.type";

export const login = async (data: LoginRequest) => {
  const response = await authApi.post('/v1/auth/login', { data });

  return response.data;
}

export const register = async (data: RegisterRequest) => {
  const response = await authApi.post('/v1/auth/register', { data });

  return response.data;
}