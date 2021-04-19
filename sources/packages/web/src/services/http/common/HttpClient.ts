import axios from "axios";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? "/api"
    : "https://dev-aest-sims.apps.silver.devops.gov.bc.ca/api";

const axiosOptions = { baseURL: apiUrl };
const axiosInstance = axios.create(axiosOptions);
export default axiosInstance;
