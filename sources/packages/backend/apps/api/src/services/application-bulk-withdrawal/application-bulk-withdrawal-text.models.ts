import { IsDateString, Length } from "class-validator";
import { APPLICATION_NUMBER_LENGTH } from "@sims/sims-db";
import { IsValidSIN } from "../../utilities/class-validation";

/**
 * user-friendly header names used in the text to be populated by the user.
 * The text model parser uses this as a base to parse the text string into an object model.
 */
export const TextHeaders = {
  sin: "SIN",
  applicationNumber: "Application Number",
  withdrawalDate: "Withdrawal Date",
};

export class ApplicationWithdrawalTextModel {
  /**
   * SIN.
   */
  @IsValidSIN({
    message: `${TextHeaders.sin} must be a valid SIN.`,
  })
  sin: number;
  /**
   * Application Number.
   */
  @Length(APPLICATION_NUMBER_LENGTH, APPLICATION_NUMBER_LENGTH, {
    message: `${TextHeaders.applicationNumber} must be a valid application number.`,
  })
  applicationNumber: number;
  /**
   * Withdrawal Date.
   */
  @IsDateString(undefined, {
    message: `${TextHeaders.withdrawalDate} must be a valid withdrawal date.`,
  })
  withdrawalDate: string;
}

/**
 * Represents the validation performed on a text model.
 */
export interface ApplicationWithdrawalTextValidationResult {
  /**
   * Zero base index of the record in the list of the records.
   * Does not consider possible header.
   */
  index: number;
  /**
   * Model that was validated.
   */
  textModel: ApplicationWithdrawalTextModel;
  /**
   * List of possible errors. If no error is present it
   * means the model was successfully validated.
   */
  errors: string[];
}
