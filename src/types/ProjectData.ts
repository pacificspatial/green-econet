import { Geometry } from "./Region";

export interface Project {
  project_id?: string;
  usage_type: string;
  name: string;
  description: string;
  date_created?: string;
  date_modified?: string;
  owner?: string;
  note: string;
  geom?: Geometry,
  aoi_type?: number
}
