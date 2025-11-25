import axiosInstance from "./axiosInstance";


export const getClippedBuffer125Green = async(projectId: string) => {
  const response = await axiosInstance.get(`/results/clipped-buffer125-green/${projectId}`);
  return response.data;
}
