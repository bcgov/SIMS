import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { ContactInfo } from "../../types";
import { User } from "./user.model";
import { Application, SupportingUserType } from ".";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";
import { CRAIncomeVerification } from "./cra-income-verification.model";

/**
 * Users that provide supporting information for a Student Application
 * (e.g. parents and partners). For every application that requires a
 * parent/partner information, a new entry will be created to allow
 * the parent/partner to login to the system and provide the information
 * for that particular Student Application. The same parent/partner
 * could be having different entries for different applications or even
 * be a parent for on Student Application and a partner on another one.
 */
@Entity({ name: TableNames.SupportingUsers })
export class SupportingUser extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Contact information for the supporting user.
   */
  @Column({
    name: "contact_info",
    type: "jsonb",
    nullable: true,
  })
  contactInfo?: ContactInfo;
  /**
   * SIN for the supporting user that will be used for CRA inquiries.
   */
  @Column({
    name: "sin",
    nullable: true,
  })
  sin?: string;
  /**
   * Birth date for the supporting user that will be used for CRA inquiries.
   */
  @Column({
    name: "birth_date",
    type: "date",
    nullable: true,
    transformer: dateOnlyTransformer,
  })
  birthDate?: Date;
  /**
   * Gender as received from BCSC authentication.
   */
  @Column({
    name: "gender",
    nullable: true,
  })
  gender?: string;
  /**
   * Dynamic data that will be used alongside the Student Application workflow.
   */
  @Column({
    name: "supporting_data",
    type: "jsonb",
    nullable: true,
  })
  supportingData: any;
  /**
   * Type of the supporting user (e.g. Parent/Partner).
   */
  @Column({
    name: "supporting_user_type",
    type: "enum",
    enum: SupportingUserType,
    enumName: "SupportingUserType",
    nullable: false,
  })
  supportingUserType: SupportingUserType;
  /**
   * User id of the authenticated user providing the information
   * as a Parent/Partner.
   */
  @RelationId((supportingUser: SupportingUser) => supportingUser.user)
  userId?: number;
  /**
   * User of the authenticated user providing the information
   * as a Parent/Partner.
   */
  @ManyToOne(() => User, { eager: false, cascade: false })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user?: User;
  /**
   * Application id that needs additional information.
   */
  @RelationId((supportingUser: SupportingUser) => supportingUser.user)
  applicationId: number;
  /**
   * Application that needs additional information.
   */
  @ManyToOne(() => Application, { eager: false, cascade: false })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;
  /**
   * CRA verification income associated with the supporting user.
   * The record is created once the supporting user submits its data.
   */
  @OneToMany(
    () => CRAIncomeVerification,
    (craIncomeVerification) => craIncomeVerification.supportingUser,
    { eager: false, cascade: false, nullable: true },
  )
  @JoinColumn({
    name: "supporting_user_id",
    referencedColumnName: ColumnNames.ID,
  })
  craIncomeVerifications: CRAIncomeVerification[];
}
