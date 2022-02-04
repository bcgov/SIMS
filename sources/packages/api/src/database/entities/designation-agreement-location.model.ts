import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { DesignationAgreement, InstitutionLocation } from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

/**
 * List of locations associated with the designation agreement.
 * While the designation agreement is in 'Pending' status, this is
 * the list of locations requested by the Institution to be designated.
 * Once approved by the Ministry, this list could be changed case the
 * Ministry do not approve the designation for all location requested
 * by the institution.
 */
@Entity({ name: TableNames.DesignationAgreementLocations })
export class DesignationAgreementLocation extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Designation agreement id.
   */
  @RelationId(
    (designationAgreementLocation: DesignationAgreementLocation) =>
      designationAgreementLocation.designationAgreement,
  )
  designationAgreementId: number;
  /**
   * Designation agreement.
   */
  @ManyToOne(
    () => DesignationAgreement,
    (designation) => designation.designationAgreementLocations,
    { eager: false, orphanedRowAction: "delete" },
  )
  @JoinColumn({
    name: "designation_agreement_id",
    referencedColumnName: ColumnNames.ID,
  })
  designationAgreement: DesignationAgreement;
  /**
   * Location associated with the designation agreement.
   */
  @ManyToOne(() => InstitutionLocation, { eager: false })
  @JoinColumn({
    name: "location_id",
    referencedColumnName: ColumnNames.ID,
  })
  institutionLocation: InstitutionLocation;
  /**
   * Indicates if the institution included the location in the designation agreement.
   */
  @Column({
    name: "requested",
    nullable: false,
  })
  requested: boolean;
  /**
   * Indicates if the Ministry approved th location to be part of the designation agreement.
   */
  @Column({
    name: "approved",
    nullable: true,
  })
  approved?: boolean;
}
