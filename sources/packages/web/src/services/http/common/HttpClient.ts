import axios from "axios";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? "https://dev-aest-sims.apps.silver.devops.gov.bc.ca/api"
    : "http://localhost:3000/api";

const axiosOptions = { baseURL: apiUrl };
const axiosInstance = axios.create(axiosOptions);
export default axiosInstance;
