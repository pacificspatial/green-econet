import axiosInstance from "./axiosInstance";


export const getClippedBuffer125GreenResult = async(projectId: string) => {
  const response = await axiosInstance.get(`/results/clipped-buffer125-green/${projectId}`);
  return response.data;
}

export const getClippedGreenResult = async(projectId: string) => {
  const response = await axiosInstance.get(`/results/clipped-green/${projectId}`);
  return response.data;
}

export const getMergedBuffer125GreenResult = async(projectId: string) => {
  const response = await axiosInstance.get(`/results/merged-buffer125-green/${projectId}`);
  return response.data;
}

export const getMergedGreenResult = async(projectId: string) => {
  const response = await axiosInstance.get(`/results/merged-green/${projectId}`);
  return response.data;
}
