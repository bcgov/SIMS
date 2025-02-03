import { parseDate, parseInteger } from "./sfas-parse-utils";
import { SFASRecordIdentification } from "./sfas-record-identification";

/**
 * This record contain data related to the actual funding disbursements records in SFAS.
 */
export class SFASApplicationDisbursementRecord extends SFASRecordIdentification {
  constructor(line: string) {
    super(line);
  }
  /**
   * The unique key/number used in SFAS to identify this application (application.application_idx).
   */
  get applicationId(): number {
    return parseInteger(this.line.substring(3, 3 + 10));
  }
  /**
   * The unique key/number used in SFAS
   * to identify specific disbursement records (award_disbursement.award_disbursement_idx).
   */
  get disbursementId(): number {
    return parseInteger(this.line.substring(13, 13 + 10));
  }
  /**
   * Program code used by SFAS (award_disbursement.program_cde).
   */
  get fundingType(): string {
    return this.line.substring(23, 23 + 4)?.trim();
  }
  /**
   * Amount of funding for this specific disbursement (award_disbursement.disbursement_amt).
   */
  get fundingAmount(): number {
    return parseInteger(this.line.substring(27, 27 + 10), 0);
  }
  /**
   * The earliest disbursement date (award_disbursement.disbursement_dte).
   */
  get fundingDate(): Date | null {
    return parseDate(this.line.substring(37, 37 + 8));
  }
  /**
   * The date this disbursement has been sent to the service provider (issued_document.document_issue_dte).
   */
  get dateIssued(): Date | null {
    return parseDate(this.line.substring(45, 45 + 8));
  }
}
