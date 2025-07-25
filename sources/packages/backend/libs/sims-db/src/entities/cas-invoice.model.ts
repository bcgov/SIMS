import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import {
  CASInvoiceBatch,
  DisbursementReceipt,
  CASSupplier,
  CASInvoiceStatus,
  CASInvoiceDetail,
  User,
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
  @ManyToOne(() => CASInvoiceBatch, { nullable: false })
  @JoinColumn({
    name: "cas_invoice_batch_id",
    referencedColumnName: ColumnNames.ID,
  })
  casInvoiceBatch: CASInvoiceBatch;
  /**
   * e-Cert receipt that this invoice is related to.
   */
  @ManyToOne(() => DisbursementReceipt, { nullable: false })
  @JoinColumn({
    name: "disbursement_receipt_id",
    referencedColumnName: ColumnNames.ID,
  })
  disbursementReceipt: DisbursementReceipt;
  /**
   * Active CAS supplier associated with the student at the moment the invoice was created.
   */
  @ManyToOne(() => CASSupplier, { nullable: false })
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
  /**
   * User that changed the status last time.
   */
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({
    name: "invoice_status_updated_by",
    referencedColumnName: ColumnNames.ID,
  })
  invoiceStatusUpdatedBy: User;
  /**
   * Invoice details.
   */
  @OneToMany(
    () => CASInvoiceDetail,
    (casInvoiceDetail) => casInvoiceDetail.casInvoice,
    {
      cascade: ["insert", "update"],
      nullable: false,
    },
  )
  casInvoiceDetails: CASInvoiceDetail[];
  /**
   * Errors while sending invoices to CAS.
   */
  @Column({
    name: "errors",
    nullable: true,
    array: true,
    type: "varchar",
  })
  errors?: string[];
  /**
   * Date and time when the invoice was sent to CAS.
   */
  @Column({
    name: "date_sent",
    type: "timestamptz",
    nullable: true,
  })
  dateSent?: Date;
}
