import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import {
  DesignationAgreementLocation,
  DesignationAgreementStatus,
  Institution,
  User,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";
import { RecordDataModel } from "./record.model";

/**
 * Designation agreement created by the institution for the Ministry assessment.
 * The Ministry will check the data provide and approve of deny the request,
 * providing also start/end dates and removing/adding locations.
 */
@Entity({ name: TableNames.DesignationAgreements })
export class DesignationAgreement extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Institution id that submitted the designation agreement.
   */
  @RelationId((designation: DesignationAgreement) => designation.institution)
  institutionId: number;
  /**
   * Institution that submitted the designation agreement.
   */
  @ManyToOne(() => Institution, { eager: false, cascade: false })
  @JoinColumn({
    name: "institution_id",
    referencedColumnName: ColumnNames.ID,
  })
  institution: Institution;
  /**
   * Dynamic data that represents the designation agreement requested by the Institution to be approved by the Ministry.
   * The data is going to be the result of an area in the form.io that is not required to have any constraints and could
   * be freely changed by the Ministry. The data under this particular section is also not supposed to be used anywhere
   * in the API, only to populate the same form again for visualization.
   */
  @Column({
    name: "submitted_data",
    type: "jsonb",
    nullable: false,
  })
  submittedData: any;
  /**
   * Current status of the designation agreement.
   */
  @Column({
    name: "designation_status",
    nullable: false,
  })
  designationStatus: DesignationAgreementStatus;
  /**
   * Institution user that submitted the designation agreement.
   */
  @ManyToOne(() => User, { eager: false, cascade: false })
  @JoinColumn({
    name: "submitted_by",
    referencedColumnName: ColumnNames.ID,
  })
  submittedBy: User;
  /**
   * Date that the designation agreement was submitted by the institution.
   */
  @Column({
    name: "submitted_date",
    type: "timestamptz",
    nullable: false,
  })
  submittedDate: Date;
  /**
   * Date that the designation agreement starts to be considered active.
   * This date will be defined by the Ministry once the designation
   * agreement is approved.
   */
  @Column({
    name: "start_date",
    type: "date",
    transformer: dateOnlyTransformer,
    nullable: true,
  })
  startDate?: Date;
  /**
   * Date that the designation agreement stops to be considered active.
   * This date will be defined by the Ministry once the designation
   * agreement is approved.
   */
  @Column({
    name: "end_date",
    type: "date",
    transformer: dateOnlyTransformer,
    nullable: true,
  })
  endDate?: Date;
  /**
   * Ministry user that approved or declined the designation agreement.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "assessed_by",
    referencedColumnName: ColumnNames.ID,
  })
  assessedBy?: User;
  /**
   * Date that the Ministry user approved or declined the designation agreement.
   */
  @Column({
    name: "assessed_date",
    type: "timestamptz",
    nullable: true,
  })
  assessedDate?: Date;

  /**
   * Locations associated with this designation agreement.
   */
  @OneToMany(
    () => DesignationAgreementLocation,
    (designationAgreementLocation) =>
      designationAgreementLocation.designationAgreement,
    {
      eager: false,
      cascade: true,
    },
  )
  designationAgreementLocations: DesignationAgreementLocation[];
}
