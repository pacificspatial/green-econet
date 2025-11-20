import axiosInstance from "./axiosInstance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchRegions = async () => {
  const regions = await axiosInstance.get("/lookup/regions");
  return regions.data.data;
};

export const fetchAOIStatistics = createAsyncThunk(
  "aoiStatistics/fetchAOIStatistics",
  async (
    { projectId, aoiType }: { projectId: string; aoiType: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.get(
        `/lookup/aoi-stats/${projectId}/${aoiType}`
      );
      // If the API returns empty data, return 'no_stats'
      if (response.data.data.length === 0) {
        return { key: Number(aoiType), data: "no_stats" };
      }

      return { key: Number(aoiType), data: response.data.data };
    } catch (error) {
      console.log(error);
      return rejectWithValue("Failed to fetch AOI statistics");
    }
  }
);

export const getAoiLocationLayers = async () => {
  const response = await axiosInstance.get("/lookup/aoi-layers/locations");
  return response.data;
};

export const getAoiHazardLayers = async () => {
  const response = await axiosInstance.get("/lookup/aoi-layers/hazard");
  return response.data;
};

export const getAoiLizardLayers = async () => {
  const response = await axiosInstance.get("/lookup/aoi-layers/lizard");
  return response.data;
};

export const getAoiDragonflyLayers = async () => {
  const response = await axiosInstance.get("/lookup/aoi-layers/dragonfly");
  return response.data;
};

export const getAoiWhiteeyeLayers = async () => {
  const response = await axiosInstance.get("/lookup/aoi-layers/whiteeye");
  return response.data;
};

export const getAoiWatershedLayers = async () => {
  const response = await axiosInstance.get("/lookup/aoi-layers/watershed");
  return response.data;
};

export const fetchParks = async () => {
  const regions = await axiosInstance.get("/lookup/parks");
  return regions.data.data;
};

export const fetchRoadLayer = async () => {
  const roads = await axiosInstance.get("/lookup/roads");
  return roads?.data;
};

export const fetchLandUseRegions = async () => {
  const regions = await axiosInstance.get("/lookup/landuse-region");
  return regions?.data.data;
};
