import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { CASInvoice, CASDistributionAccount } from ".";
import { numericTransformer } from "@sims/sims-db/transformers/numeric.transformer";

/**
 * CAS invoice details with every distribution account
 * active for the award codes part of an e-Cert receipt.
 */
@Entity({ name: TableNames.CASInvoiceDetails })
export class CASInvoiceDetail extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Related invoice.
   */
  @ManyToOne(() => CASInvoice, { nullable: false })
  @JoinColumn({
    name: "cas_invoice_id",
    referencedColumnName: ColumnNames.ID,
  })
  casInvoice: CASInvoice;
  /**
   * Active distribution account for the award code.
   */
  @ManyToOne(() => CASDistributionAccount, { nullable: false })
  @JoinColumn({
    name: "cas_distribution_account_id",
    referencedColumnName: ColumnNames.ID,
  })
  casDistributionAccount: CASDistributionAccount;
  /**
   * Award money value amount.
   */
  @Column({
    name: "value_amount",
    type: "numeric",
    transformer: numericTransformer,
  })
  valueAmount: number;
}
