import { ApplicationBulkWithdrawalValidationResultAPIOutDTO } from "@/services/http/dto";

/**
 * Application bulk Withdrawal validation result with formatted values
 * to be displayed to the user.
 */
export interface ApplicationBulkWithdrawal
  extends ApplicationBulkWithdrawalValidationResultAPIOutDTO {
  /**
   * CSV line number that contains the error.
   * Should match with CSV/spreadsheet line number for easy troubleshoot.
   */
  recordLineNumber: number;
  /**
   * Withdrawal date formatted.
   */
  withdrawalDateFormatted?: string;
}
