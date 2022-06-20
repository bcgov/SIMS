import { DisbursementReceiptDetail } from "../disbursement-receipt-files/disbursement-receipt-file-detail";
import { DisbursementReceiptHeader } from "../disbursement-receipt-files/disbursement-receipt-file-header";

export enum DisbursementReceiptRecordType {
  Header = "F",
  Detail = "D",
  Trailer = "T",
}

export class DisbursementReceiptGrant {
  constructor(
    public readonly grantType: string,
    public readonly grantAmount: string,
  ) {}
}

export class DisbursementReceiptDownloadResponse {
  header: DisbursementReceiptHeader;
  records: DisbursementReceiptDetail[];
}
