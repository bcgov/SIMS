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
