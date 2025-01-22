import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import {
  CASInvoiceBatch,
  DisbursementReceipt,
  CASSupplier,
  CASInvoiceStatus,
} from ".";

/**
 * CAS invoices related to an e-Cert receipt and
 * part of a batch to be reported to CAS.
 */
@Entity({ name: TableNames.CASInvoices })
export class CASInvoice extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Related batch that this invoice belongs to.
   */
  @ManyToOne(() => CASInvoiceBatch)
  @JoinColumn({
    name: "cas_invoice_batch_id",
    referencedColumnName: ColumnNames.ID,
  })
  casInvoiceBatch: CASInvoiceBatch;
  /**
   * e-Cert receipt that this invoice is related to.
   */
  @ManyToOne(() => DisbursementReceipt)
  @JoinColumn({
    name: "disbursement_receipt_id",
    referencedColumnName: ColumnNames.ID,
  })
  disbursementReceipt: DisbursementReceipt;
  /**
   * Active CAS supplier associated with the student at the moment the invoice was created.
   */
  @ManyToOne(() => DisbursementReceipt)
  @JoinColumn({
    name: "cas_supplier_id",
    referencedColumnName: ColumnNames.ID,
  })
  casSupplier: CASSupplier;
  /**
   * Unique invoice number for a supplier.
   */
  @Column({
    name: "invoice_number",
  })
  invoiceNumber: string;
  /**
   * Status of the invoice indicating if it was sent to CAS.
   */
  @Column({
    name: "invoice_status",
    type: "enum",
    enum: CASInvoiceStatus,
    enumName: "CASInvoiceStatus",
  })
  invoiceStatus: CASInvoiceStatus;
  /**
   * Date and time when the invoice status was updated.
   */
  @Column({
    name: "invoice_status_updated_on",
    type: "timestamptz",
  })
  invoiceStatusUpdatedOn: Date;
}
