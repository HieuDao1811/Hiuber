import axios from "axios";

const createApi = (baseURL: string) => {
  return axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    }
  })
}

export const authApi = createApi(import.meta.env.VITE_AUTH_SERVICE_URL);