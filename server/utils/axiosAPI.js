import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

export const axiosAPI = axios.create({
  baseURL: process.env.CARTO_SQL_API,
});

axiosAPI.defaults.headers.common["Authorization"] =
  `Bearer ${process.env.CARTO_TOKEN}`;

// Request interceptor
axiosAPI.interceptors.request.use(
  (request) => {
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 404 &&
      error.response.headers["content-type"]?.includes("text/html")
    ) {
      console.log("404 Error: HTML Error Page");
      return retryRequest(error.config, {
        error: true,
        message: "Page Not Found",
        retryable: true,
        retryDelay: 200,
        retryCount: 0,
        retryMax: 1,
      });
    }

    return Promise.reject({
      error: true,
      ...(error.response
        ? {
            ...error.response.data,
            status: error.response.status,
            headers: error.response.headers,
          }
        : error),
    });
  }
);

const sleep = (millis) =>
  new Promise((resolve) => setTimeout(resolve, millis));

async function retryRequest(config, retryConfig) {
  config.retryCount = config.retryCount || 0;

  console.log(`Retrying Request, Attempt ${config.retryCount + 1}`);

  if (!retryConfig.retryable || config.retryCount >= retryConfig.retryMax) {
    console.log("Max retry reached");
    return Promise.reject(retryConfig);
  }

  await sleep(retryConfig.retryDelay);

  retryConfig.retryCount += 1;
  config.retryCount += 1;

  return axiosAPI(config);
}
