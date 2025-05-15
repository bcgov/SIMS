/**
 * DTO for pending application change request summary.
 */
export class ApplicationChangeRequestPendingSummaryAPIOutDTO {
  applicationId: number;
  parentApplicationId: number;
  studentId: number;
  submittedDate: Date;
  firstName?: string;
  lastName: string;
  applicationNumber: string;
}
