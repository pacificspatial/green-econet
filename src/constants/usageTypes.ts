import { UsageTypes } from "@/types/UsageType";

export const usageTypes: UsageTypes = {
  road_planning: {
    value: "road_planning",
    langKey: "roadPlanning",
    input: "polygon",
    limit: 1,
  },
  park_management: {
    value: "park_management",
    langKey: "parkManagement",
    input: "polygon",
    limit: 1,
    noteLable:"parkRegionNote",
  },
  land_readjustment: {
    value: "land_readjustment",
    langKey: "landReadjustment",
    input: "polygon",
    limit: 1,
    noteLable:"landUseRegionNote",
  },
  public_facility_planning: {
    value: "public_facility_planning",
    langKey: "publicFacilityPlanning",
    input: "polygon",
    limit: 1,
    noteLable:"landUseRegionNote",
  },
  housing_deployment: {
    value: "housing_deployment",
    langKey: "housingDeployment",
    input: "polygon",
    limit: 1,
    noteLable:"landUseRegionNote",
  },
  municipal_presentation: {
    value: "municipal_presentation",
    langKey: "municipalPresentation",
    input: "polygon",
    limit: 1,
  },
};

export const parkUsageTypes = ["park_management"];
export const landUseRegionUsageTypes = ["land_readjustment", "public_facility_planning", "housing_deployment"];
export const regionUsageTypes = ["municipal_presentation"]