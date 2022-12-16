export interface ATBCCreateClient {
  SIN: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  email: string;
}

export interface RequestPDStatusResponseQueueOutDTO {
  message: string;
  code: number;
}
