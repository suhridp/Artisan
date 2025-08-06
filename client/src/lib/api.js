// src/lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4001",
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;
