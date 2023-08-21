import { ApplicationBulkWithdrawalValidationResultAPIOutDTO } from "@/services/http/dto";

/**
 * Application bulk Withdrawal validation result with formatted values
 * to be displayed to the user.
 */
export interface ApplicationBulkWithdrawal
  extends ApplicationBulkWithdrawalValidationResultAPIOutDTO {
  /**
   * Text line number that contains the error.
   * Should match with text content line number for easy troubleshoot.
   */
  recordLineNumber: number;
  /**
   * Withdrawal date formatted.
   */
  withdrawalDateFormatted?: string;
}
