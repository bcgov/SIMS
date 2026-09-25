import { NOTE_DESCRIPTION_MAX_LENGTH } from "@sims/sims-db";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from "class-validator";
import { BatchReassessmentStatus } from "../../../services/batch-reassessment/batch-reassessment.service.models";

/**
 * Maximum number of application numbers accepted in a single batch manual reassessment submission.
 */
const BATCH_REASSESSMENT_MAX_APPLICATION_NUMBERS = 50000;

/**
 * Payload used to trigger a batch manual reassessment for a list of application numbers.
 */
export class BatchReassessmentAPIInDTO {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(BATCH_REASSESSMENT_MAX_APPLICATION_NUMBERS)
  @IsString({ each: true })
  @Length(10, 10, { each: true })
  applicationNumbers: string[];

  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}

/**
 * Summary of a batch manual reassessment submission, including how many
 * applications were successfully reassessed and how many failed.
 */
export class BatchReassessmentSummaryAPIOutDTO {
  id: number;
  batchNumber: number;
  createdAt: Date;
  creatorFirstName: string;
  creatorLastName: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
  status: BatchReassessmentStatus;
}
