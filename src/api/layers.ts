import axiosInstance from "./axiosInstance";

// fetch green layer data
export const fetchGreenLayer = async () => {
  const res = await axiosInstance.get("/map/layers/green");
  return res.data;
};

// fetch green layer data
export const fetchBufferGreenLayer = async () => {
  const res = await axiosInstance.get("/map/layers/buffer_green");
  return res.data;
};
