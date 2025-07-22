import axios from "axios";

const apiUrl = import.meta.env.PROD ? "/api" : "http://localhost:3000/api";
const axiosOptions = { baseURL: apiUrl };
const axiosInstance = axios.create(axiosOptions);
export default axiosInstance;
