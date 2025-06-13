import { ECertCancellationResponseFileRecord } from "./e-cert-cancellation-response-file-record";

/**
 * E-Cert cancellation response file header.
 */
export class ECertCancellationResponseFileFooter extends ECertCancellationResponseFileRecord {
  constructor(line: string) {
    super(line);
  }

  /**
   * Count of number of detail records.
   */
  get totalDetailRecords(): number {
    return parseInt(this.line.substring(43, 52));
  }
}
