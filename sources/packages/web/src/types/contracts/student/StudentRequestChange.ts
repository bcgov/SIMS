export interface StudentRequest {
  applicationNumber: string;
  formNames: string[];
}

export interface StudentAppealDTO {
  applicationId: number;
  formName: string;
  formData: any;
}
