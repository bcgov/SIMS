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
import { User, CASInvoiceBatchApprovalStatus, CASInvoice } from ".";

/**
 * CAS batch information to group disbursement invoices.
 */
@Entity({ name: TableNames.CASInvoiceBatches })
export class CASInvoiceBatch extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Unique batch name.
   */
  @Column({
    name: "batch_name",
  })
  batchName: string;
  /**
   * Batch date.
   */
  @Column({
    name: "batch_date",
    type: "date",
  })
  batchDate: string;
  /**
   * Approval status.
   */
  @Column({
    name: "approval_status",
    type: "enum",
    enum: CASInvoiceBatchApprovalStatus,
    enumName: "CASInvoiceBatchApprovalStatus",
  })
  approvalStatus: CASInvoiceBatchApprovalStatus;
  /**
   * Last date and time when the status changed.
   */
  @Column({
    name: "approval_status_updated_on",
    type: "timestamptz",
  })
  approvalStatusUpdatedOn: Date;
  /**
   * User that changed the status last time.
   */
  @ManyToOne(() => User)
  @JoinColumn({
    name: "approval_status_updated_by",
    referencedColumnName: ColumnNames.ID,
  })
  approvalStatusUpdatedBy: User;
  /**
   * Invoices in this batch.
   */
  @OneToMany(() => CASInvoice, (casInvoice) => casInvoice.casInvoiceBatch, {
    cascade: ["insert", "update"],
  })
  casInvoices: CASInvoice[];
}
