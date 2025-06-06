import { ECertCancellationResponseRecordType } from "../models/e-cert-cancellation-integration.model";

/**
 * Base class for e-cert cancellation response file record.
 */
export abstract class ECertCancellationResponseFileRecord {
  constructor(protected readonly line: string) {}

  /**
   * Record type of the record in the file.
   */
  get recordType(): ECertCancellationResponseRecordType {
    return this.line.substring(0, 3) as ECertCancellationResponseRecordType;
  }
}
