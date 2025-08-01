import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { User } from "./user.model";
import {
  Application,
  ContactInfo,
  FormYesNoOptions,
  SupportingUserType,
} from ".";

/**
 * Maximum length for supporting user full name as defined in the database schema.
 */
export const SUPPORTING_USER_FULL_NAME_MAX_LENGTH = 250;

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
  })
  birthDate?: string;
  /**
   * Dynamic data that will be used alongside the Student Application workflow.
   */
  @Column({
    name: "supporting_data",
    type: "jsonb",
    nullable: true,
  })
  supportingData: Record<string, unknown>;
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
   * Application that needs additional information.
   */
  @ManyToOne(() => Application, { eager: false, cascade: false })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;
  /**
   * Indicates if the supporting user will report its own data,
   * otherwise the data will be reported by the student.
   */
  @Column({
    name: "is_able_to_report",
  })
  isAbleToReport: boolean;
  /**
   * Used to identify the supporting user when more than one is provided for same application.
   * Should be used for basic identification of the user only, the
   * real name should be captured while supporting user data is provided.
   */
  @Column({
    name: "full_name",
    nullable: true,
  })
  fullName?: string;
  /**
   * Personal information of the supporting user.
   */
  @Column({
    name: "personal_info",
    type: "jsonb",
    nullable: true,
  })
  personalInfo?: SupportingUserPersonalInfo;
}
/**
 * Supporting user personal information details.
 */
export interface SupportingUserPersonalInfo {
  givenNames?: string;
  lastName?: string;
  hasValidSIN?: FormYesNoOptions;
}
