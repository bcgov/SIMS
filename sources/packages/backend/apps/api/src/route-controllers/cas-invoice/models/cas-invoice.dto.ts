export class CASInvoiceAPIOutDTO {
  id: number;
  invoiceNumber: string;
  invoiceStatusUpdatedOn: Date;
  invoiceBatchName: string;
  supplierNumber: string;
  errors: string[];
}
