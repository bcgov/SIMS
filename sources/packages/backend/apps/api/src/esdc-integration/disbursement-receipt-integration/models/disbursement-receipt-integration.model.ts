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
