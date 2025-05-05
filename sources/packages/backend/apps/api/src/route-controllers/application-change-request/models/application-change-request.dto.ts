/**
 * DTO for pending application change request summary.
 */
export class ApplicationChangeRequestPendingSummaryAPIOutDTO {
  requestId: number;
  applicationId: number;
  studentId: number;
  submittedDate: Date;
  firstName?: string;
  lastName: string;
  applicationNumber: string;
}
