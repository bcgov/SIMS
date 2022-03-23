/**
 * Model for student request change form.
 */
export interface StudentRequest {
  applicationNumber: string;
  formNames: string[];
}

/**
 * DTO for student appeal request.
 */
export interface StudentAppealRequestDTO {
  formName: string;
  formData: any;
}

/**
 * DTO for student appeal.
 */
export interface StudentAppealDTO {
  studentAppealId?: number;
  studentAppealRequests: StudentAppealRequestDTO[];
}
