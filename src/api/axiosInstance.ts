import axios from "axios";
import { store } from "@/redux/store";
import { setPassword } from "@/redux/slices/authSlice";

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}api/v1`,
});

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use((config) => {
  const state = store.getState();
  const pwd = state.auth.password;

  if (pwd) {
    const token = btoa(`user:${pwd}`);
    config.headers.Authorization = `Basic ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      alert("パスワードが間違っています！");
      
      // Clear Redux & session
      store.dispatch(setPassword(null));
      sessionStorage.removeItem("auth_pwd");

      // Ask again
      const newPwd = prompt("もう一度パスワードを入力してください：");

      if (newPwd) {
        store.dispatch(setPassword(newPwd));
        sessionStorage.setItem("auth_pwd", newPwd);

        // re-try the request
        const token = btoa(`user:${newPwd}`);
        error.config.headers.Authorization = `Basic ${token}`;

        return axiosInstance(error.config);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;