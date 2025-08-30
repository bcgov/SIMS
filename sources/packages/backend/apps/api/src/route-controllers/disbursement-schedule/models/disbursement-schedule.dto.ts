import { IsNotEmpty, MaxLength } from "class-validator";
import { NOTE_DESCRIPTION_MAX_LENGTH } from "@sims/sims-db";

export class CancelDisbursementScheduleAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}
