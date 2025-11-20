import axiosInstance from "./axiosInstance";

export const fetchProjectPointResult = async (project_id: string) => {
  const response = await axiosInstance.get(`/results/point/${project_id}`);
  return response.data.data;
};

export const fetchProjectPolygonResult = async (project_id: string) => {
  const response = await axiosInstance.get(`/results/polygon/${project_id}`);
  return response.data.data;
};

export const fetchResultStats = async (project_id: string) => {
  const response = await axiosInstance.get(`/results/stats/${project_id}`);
  return response.data;
};
