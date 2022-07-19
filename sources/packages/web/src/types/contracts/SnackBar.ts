export enum SnackBarType {
  success = "success",
  warn = "warn",
  error = "error",
}

export interface SnackBarOptions {
  show: boolean;
  type: SnackBarType;
  content: string;
  displayTime: string | number;
}
