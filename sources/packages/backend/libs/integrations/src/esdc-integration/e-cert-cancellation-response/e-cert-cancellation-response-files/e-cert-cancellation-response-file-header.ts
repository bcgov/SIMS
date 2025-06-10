import { ECertCancellationResponseFileRecord } from "./e-cert-cancellation-response-file-record";

/**
 * E-Cert cancellation response file header.
 */
export class ECertCancellationResponseFileHeader extends ECertCancellationResponseFileRecord {
  constructor(line: string) {
    super(line);
  }
}
