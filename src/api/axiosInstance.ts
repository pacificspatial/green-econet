// import { fetchAuthSession } from "aws-amplify/auth";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}api/v1`,
});

// Use the interceptor without importing the store
axiosInstance.interceptors.request.use(
  async (config) => {
    // const session = await fetchAuthSession();
    // const token = session?.tokens?.accessToken?.toString();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // } else {
    //   console.error("No token found in session.");
    // }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      // try {
      // const session = await fetchAuthSession({ forceRefresh: true });
      // const newAccessToken = session?.tokens?.accessToken?.toString();
      // if (newAccessToken) {
      //   originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      //   return axiosInstance(originalRequest);
      // } else {
      //   throw new Error("Session is empty. Logging out.");
      // }
      // } catch (authError) {
      //   console.error("Error refreshing token:", authError);
      // }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
