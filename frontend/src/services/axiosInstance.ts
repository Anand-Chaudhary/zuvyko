import axios from "axios";

console.log("API URL:", import.meta.env.VITE_BACKEND_URL);
console.log("WS URL:", import.meta.env.VITE_WS_URL);

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
    const token = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("auth_token="));
    
    if (token) {
        const value = decodeURIComponent(token.split("=")[1]);
        config.headers.Authorization = `Bearer ${value}`;
    }
   
    return config;
});

export const wsInstance = new WebSocket(import.meta.env.VITE_WS_URL);

export default axiosInstance;