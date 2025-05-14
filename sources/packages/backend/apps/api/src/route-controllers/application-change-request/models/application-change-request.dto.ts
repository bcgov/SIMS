import {
  ApplicationEditStatus,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "@sims/sims-db";
import { IsIn, IsNotEmpty, IsPositive, MaxLength } from "class-validator";

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

/**
 * Payload for updating the application edit status.
 */
export class ApplicationChangeRequestAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
  @IsIn([
    ApplicationEditStatus.ChangedWithApproval,
    ApplicationEditStatus.ChangeDeclined,
  ])
  applicationEditStatus:
    | ApplicationEditStatus.ChangedWithApproval
    | ApplicationEditStatus.ChangeDeclined;
  @IsPositive()
  studentId: number;
}
