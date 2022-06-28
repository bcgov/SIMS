import { DisbursementReceiptDetail } from "../disbursement-receipt-files/disbursement-receipt-file-detail";
import { DisbursementReceiptHeader } from "../disbursement-receipt-files/disbursement-receipt-file-header";

/**
 * Record type of disbursement receipt records.
 */
export enum DisbursementReceiptRecordType {
  Header = "F",
  Detail = "D",
  Footer = "T",
}

/**
 * Response model which is extracted from daily disbursement receipt file.
 */
export class DisbursementReceiptDownloadResponse {
  header: DisbursementReceiptHeader;
  records: DisbursementReceiptDetail[];
}

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface DailyDisbursementUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

/**
 * Represents a single line in a daily disbursement receipt file.
 * When implemented in a derived class this
 * interface allow the object to be represented
 * as a formatted fixed string.
 */
export interface DailyDisbursementRequestFileLine {
  getFixedFormat(): string;
}
