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

/**
 * ATBC disability status Response.
 */
export interface ATBCDisabilityStatusResponse {
  SIN: string;
  APP_FIRST_NAME: string;
  APP_LAST_NAME: string;
  BIRTH_DTE: string;
  D8Y_TYPE: string;
  D8Y_DTE: string;
}
