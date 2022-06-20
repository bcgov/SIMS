import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DisbursementReceipt } from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

/**
 * Grants(Both federal and provincial) which belong to a disbursement receipt.
 */
@Entity({ name: TableNames.DisbursementReceiptValues })
export class DisbursementReceiptValue extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Related disbursement receipt entry.
   */
  @ManyToOne(() => DisbursementReceipt, { eager: false, nullable: false })
  @JoinColumn({
    name: "disbursement_receipt_id",
    referencedColumnName: ColumnNames.ID,
  })
  disbursementReceipt: DisbursementReceipt;

  /**
   * Federal or Provincial grant type.
   */
  @Column({
    name: "grant_type",
    nullable: false,
  })
  grantType: string;
  /**
   * Grant amount.
   * !Decimal values are retrieved by Typeorm as string from Postgres.
   */
  @Column({
    name: "grant_amount",
    type: "numeric",
    nullable: false,
  })
  grantAmount: string;
}
