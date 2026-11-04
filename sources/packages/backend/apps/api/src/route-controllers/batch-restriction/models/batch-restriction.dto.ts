import {
  APPLICATION_NUMBER_LENGTH,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "@sims/sims-db";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsPositive,
  IsString,
  Length,
  MaxLength,
} from "class-validator";

/**
 * Maximum number of application numbers accepted in a single batch restriction submission.
 */
const BATCH_RESTRICTION_MAX_APPLICATION_NUMBERS = 20000;

/**
 * Payload to add a restriction, in a single batch, to the students
 * associated with the provided application numbers.
 */
export class BatchRestrictionAPIInDTO {
  @IsPositive()
  restrictionId: number;
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(BATCH_RESTRICTION_MAX_APPLICATION_NUMBERS)
  @IsString({ each: true })
  @Length(APPLICATION_NUMBER_LENGTH, APPLICATION_NUMBER_LENGTH, { each: true })
  applicationNumbers: string[];
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}

/**
 * Summary of a batch restriction submission, including how many
 * restrictions were successfully added and how many failed.
 */
export class BatchRestrictionSummaryAPIOutDTO {
  id: number;
  batchNumber: number;
  createdAt: Date;
  creatorName: string;
  restrictionCode: string;
  restrictionDescription: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
}
