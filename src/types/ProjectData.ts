import { Geometry } from "./Region";

export interface Project {
  project_id?: string;
  name: string;
  description: string;
  date_created?: string;
  date_modified?: string;
  owner?: string;
  note: string;
  geom?: Geometry,
}
