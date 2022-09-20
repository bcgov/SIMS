export enum ProgressInfoStatus {
  Completed = "success",
  Pending = "secondary",
  Rejected = "error",
}

export interface ProgressInfoDetails {
  status: ProgressInfoStatus;
  header: string;
  message?: string;
}
