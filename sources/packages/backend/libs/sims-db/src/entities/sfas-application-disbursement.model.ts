import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { BaseModel, SFASApplication } from ".";
import { numericTransformer } from "../transformers/numeric.transformer";

/**
 * Data related to the actual funding disbursements records in SFAS.
 */
@Entity({ name: TableNames.SFASApplicationDisbursements })
export class SFASApplicationDisbursement extends BaseModel {
  /**
   * The unique key/number used in SFAS
   * to identify specific disbursement records (award_disbursement.award_disbursement_idx).
   */
  @PrimaryColumn()
  id: number;
  /**
   * The unique key/number used in SFAS to identify this application (application.application_idx).
   */
  @ManyToOne(() => SFASApplication, {
    nullable: false,
  })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: SFASApplication;
  /**
   * Program code used by SFAS (award_disbursement.program_cde).
   */
  @Column({
    name: "funding_type",
    nullable: true,
  })
  fundingType?: string;
  /**
   * Amount of funding for this specific disbursement (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "funding_amount",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  fundingAmount?: number;
  /**
   * The earliest disbursement date (award_disbursement.disbursement_dte).
   */
  @Column({
    name: "funding_date",
    type: "date",
    nullable: true,
  })
  fundingDate?: string;
  /**
   * The date this disbursement has been sent to the service provider (issued_document.document_issue_dte).
   */
  @Column({
    name: "date_issued",
    type: "date",
    nullable: true,
  })
  dateIssued?: string;
  /**
   * Date that the record was extracted from SFAS.
   */
  @Column({
    name: "extracted_at",
    type: "timestamptz",
  })
  extractedAt: Date;
}
