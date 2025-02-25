import axios from "axios";

// Determine if we're in a local environment by checking the hostname
const isLocalhost =
  typeof window !== "undefined" && window.location.hostname === "localhost";
const apiUrl = isLocalhost ? "http://localhost:3000/api" : "/api";

const axiosOptions = { baseURL: apiUrl };
const axiosInstance = axios.create(axiosOptions);
export default axiosInstance;
