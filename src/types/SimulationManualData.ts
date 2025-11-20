import { Geometry } from "./Region";

export interface SimulationManualData {
  geom: Geometry;
  rain_type: number;
  rain_count?: number;
  simulation_type?: number;
  shape_id?: string;
  sub_rain_type?: number | null;
}

export interface SimulationDetailsResponse {
  aoi_area: number;

  inundationVolume: {
    underfloor_flooding: number;
    total_inundation: number;
  };

  runoffControl: {
    runoffControlVolume: number;
    floodRiskReductionDepth0To0_5: number,
    floodRiskReductionDepth0_5To3_0: number,
    runoffSuppressionEffect: number
  };

  cost: {
    type_a_cost: number;
    type_b_cost: number;
    type_c_cost: number;
    type_d_cost: number;
    type_e_cost: number;
    type_f_cost: number;
    type_g_cost: number;
    total_cost: number;
  };

  volume: {
    type_a_volume: number;
    type_b_volume: number;
    type_c_volume: number;
    type_d_volume: number;
    type_e_volume: number;
    type_f_volume: number;
    type_g_volume: number;
    total_volume: number;
  };
}

export const TYPE_KEYS = {
  A: "a",
  B: "b",
  C: "c",
  D: "d",
  E: "e",
  F: "f",
  G: "g",
} as const;

export type TypeLetter = keyof typeof TYPE_KEYS;
