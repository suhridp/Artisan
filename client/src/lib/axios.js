import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4001",
  withCredentials: true, // send cookies for httpOnly JWT
});

export default api;
