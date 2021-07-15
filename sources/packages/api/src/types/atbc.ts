export interface ATBCCreateClientResponse {
  message: string;
  code: number;
  className: string;
}

export interface ATBCCreateClientPayload {
  SIN: string;
  firstName: string;
  lastName: string;
  birthDate: string;
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
