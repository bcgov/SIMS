import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { OfferingIntensity } from ".";

/**
 * CAS distribution account information to be reported in invoices.
 */
@Entity({ name: TableNames.CASDistributionAccounts })
export class CASDistributionAccount extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * SIMS award value codes.
   */
  @Column({
    name: "award_value_code",
  })
  awardValueCode: string;
  /**
   * Offering intensity that can potentially
   * have a different distribution account.
   */
  @Column({
    name: "offering_intensity",
    enum: OfferingIntensity,
    enumName: "OfferingIntensity",
  })
  offeringIntensity: OfferingIntensity;
  /**
   * Codes for the operations, expected to be "DR"
   * for debit and "CR" for credit.
   */
  @Column({
    name: "operation_code",
  })
  operationCode: string;
  /**
   * Distribution account.
   */
  @Column({
    name: "distribution_account",
  })
  distributionAccount: string;
  /**
   * Indicates if the distribution account for the award code is active.
   * One pair of distribution accounts are expected to each award code
   * (one for debit and one for credit).
   */
  @Column({
    name: "is_active",
  })
  isActive: boolean;
}
