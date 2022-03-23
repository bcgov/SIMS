import { ArrayMinSize, IsArray } from "class-validator";
/**
 * DTO for student appeal request.
 */
export class StudentAppealRequestDTO {
  formName: string;
  formData: any;
}

/**
 * DTO for student appeal.
 */
export class StudentAppealDTO {
  applicationId?: number;
  @IsArray()
  @ArrayMinSize(1)
  studentAppealRequests: StudentAppealRequestDTO[];
}
