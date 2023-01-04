export enum ATBCPDStatus {
  Confirmed = 1,
  Denied = 2,
  Processing = 3,
}

export interface ATBCCreateClientResponse {
  message: string;
  code: number;
  className: string;
}

export interface ATBCCreateClientPayload {
  SIN: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  email: string;
}

export interface ATBCPDCheckerPayload {
  id: string;
}

export interface ATBCPDCheckerResponse {
  id: string;
  e9yStatusId: number;
  e9yStatus: string;
}

export interface ATBCStudentModel {
  id: number;
  sin: string;
}
