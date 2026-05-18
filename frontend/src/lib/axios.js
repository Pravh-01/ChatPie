import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://chatpie-5mbf.onrender.com/api" : "/api",
  withCredentials: true,
});
