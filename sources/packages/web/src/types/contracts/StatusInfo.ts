export enum StatusInfo {
  Completed = "success",
  Pending = "secondary",
  Rejected = "error",
}

export interface StatusInfoDetails {
  status: StatusInfo;
  header: string;
}
