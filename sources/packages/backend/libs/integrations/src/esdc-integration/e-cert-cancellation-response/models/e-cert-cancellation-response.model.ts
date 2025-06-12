import { ECertCancellationResponseFileDetail } from "../e-cert-cancellation-response-files/e-cert-cancellation-response-file-detail";

/**
 * E-Cert cancellation response record type.
 */
export enum ECertCancellationResponseRecordType {
  Header = "100",
  Detail = "200",
  Footer = "999",
}

/**
 * E-Cert cancellation response downloaded file.
 */
export interface ECertCancellationDownloadResponse {
  detailRecords: ECertCancellationResponseFileDetail[];
}

/**
 * E-Cert cancellation response processing result.
 */
export interface ECertCancellationResponseResult {
  receivedCancellationFiles: number;
}
