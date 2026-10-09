import {
  APPLICATION_NUMBER_LENGTH,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "@sims/sims-db";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from "class-validator";
import {
  BatchReassessmentApplicationResult,
  BatchReassessmentStatus,
} from "../../../services";

/**
 * Maximum number of application numbers accepted in a single batch manual reassessment submission.
 */
const BATCH_REASSESSMENT_MAX_APPLICATION_NUMBERS = 20000;

/**
 * Payload used to trigger a batch manual reassessment for a list of application numbers.
 */
export class BatchReassessmentAPIInDTO {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(BATCH_REASSESSMENT_MAX_APPLICATION_NUMBERS)
  @IsString({ each: true })
  @Length(APPLICATION_NUMBER_LENGTH, APPLICATION_NUMBER_LENGTH, { each: true })
  applicationNumbers: string[];
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}

/**
 * Summary of a batch manual reassessment submission, including how many
 * applications were successfully reassessed, how many failed, and how many
 * are still pending.
 */
export class BatchReassessmentSummaryAPIOutDTO {
  id: number;
  batchNumber: number;
  createdAt: Date;
  creatorName: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
  status: BatchReassessmentStatus;
}

/**
 * Outcome of the reassessment of a single application in a batch manual reassessment.
 */
export class BatchReassessmentApplicationAPIOutDTO {
  applicationNumber: string;
  applicationId?: number;
  studentId?: number;
  result: BatchReassessmentApplicationResult;
  failureReason?: string;
}
