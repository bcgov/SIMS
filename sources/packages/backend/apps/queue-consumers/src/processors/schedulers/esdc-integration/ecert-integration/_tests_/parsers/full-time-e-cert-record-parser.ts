import { ECertRecordParser } from ".";

/**
 * Parses a full-time e-Cert record information.
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
      const awardAmount = record.substring(i + 4, i + 14);
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
    return this.record.substring(176, 190).trim();
  }

  /**
   * Student's last name.
   */
  get lastName(): string {
    return this.record.substring(151, 175).trim();
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
}
