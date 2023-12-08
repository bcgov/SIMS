import { ECertRecordParser } from "./e-cert-record-parser";

/**
 * Parses a part-time e-Cert record information.
 */
export class PartTimeCertRecordParser extends ECertRecordParser {
  constructor(private readonly record: string) {
    super();
  }

  /**
   * Record type.
   */
  get recordType(): string {
    return this.record.substring(0, 2);
  }

  /**
   * Student's first name.
   */
  get firstName(): string {
    return this.record.substring(27, 42).trim();
  }

  /**
   * Student's last name.
   */
  get lastName(): string {
    return this.record.substring(2, 27).trim();
  }
}
