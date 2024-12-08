import { ECertRecordParser } from ".";

/**
 * Parses a full-time e-Cert record information.
 * The hard-coded numbers along the class represents the position index
 * as per the e-Cert documentation.
 */
export class FullTimeCertRecordParser extends ECertRecordParser {
  /**
   * List of e-Cert awards. All federal grants may potentially be listed
   * while only total provincial grants (BCSG) will be available.
   */
  private readonly awards: Record<string, number> = {};

  /**
   * Initializes a new full-time parsed object.
   * @param record record to be parsed.
   */
  constructor(private readonly record: string) {
    super();
    for (let i = 615; i < 715; i += 10) {
      const awardCode = record.substring(i, i + 4).trim();
      if (!awardCode) {
        // Read till find an empty award.
        break;
      }
      const awardAmount = record.substring(i + 4, i + 10);
      this.awards[awardCode] = +awardAmount;
    }
  }

  /**
   * Record type.
   */
  get recordType(): string {
    return this.record.substring(0, 3);
  }

  /**
   * Student's first name.
   */
  get firstName(): string {
    return this.record.substring(176, 191).trim();
  }

  /**
   * Student's last name.
   */
  get lastName(): string {
    return this.record.substring(151, 176).trim();
  }

  /**
   * Student's gender.
   */
  get gender(): string {
    return this.record.substring(594, 595);
  }

  /**
   * Federal CSLF amount (loan).
   */
  get cslfAmount(): number {
    return +this.record.substring(85, 91).trim();
  }

  /**
   * Provincial BCSL amount (loan).
   */
  get bcslAmount(): number {
    return +this.record.substring(91, 97).trim();
  }

  /**
   * List of e-Cert awards. All federal grants may potentially be listed
   * while only total provincial grants (BCSG) will be available.
   * @param grantCode grant code, for instance, CSGP, CSGD, CSGF, BCSG.
   * @returns the grant amount when available, otherwise undefined.
   */
  grantAmount(grantCode: string): number | undefined {
    return this.awards[grantCode];
  }

  /**
   * Enrolment confirmation date.
   */
  get enrollmentConfirmationDate(): string {
    return this.record.substring(134, 142);
  }

  /**
   * Postal code from student's contact info.
   */
  get postalCode(): string {
    return this.record.substring(303, 310);
  }
}
