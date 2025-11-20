export interface UsageTypes {
  [key: string]: UsageType;
}
export interface UsageType {
  value: string;
  langKey: string;
  input?: string;
  limit?: number;
  noteLable?:string
}