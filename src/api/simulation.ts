import axiosInstance from "./axiosInstance";

type SimulationData = object;

type SimulationResponse = object;

export const executeSimulation = async (
  data: SimulationData
): Promise<SimulationResponse> => {
  const response = await axiosInstance.post<SimulationResponse>(
    `/simulation`,
    data
  );
  return response.data;
};

export const getSimulationDetails = async(projectId: string) => {
  const response = await axiosInstance.get(`/simulation/get-simulation-details/${projectId}`);
  return response.data;
}