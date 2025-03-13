export interface CASInvoiceAPIOutDTO {
  id: number;
  invoiceNumber: string;
  invoiceStatusUpdatedOn: Date;
  invoiceBatchName: string;
  supplierNumber: string;
  errors: string[];
}
