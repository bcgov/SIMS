import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { RestrictionType } from ".";
import { RestrictionNotificationType } from "./restriction-notification-type.type";
import { RestrictionActionType } from "./restriction-action-type.type";

export const RESTRICTION_CATEGORY_MAX_LENGTH = 50;

/**
 * Entity for restrictions
 */
@Entity({ name: TableNames.Restrictions })
export class Restriction extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Restriction type - Federal/Provincial
   */
  @Column({
    name: "restriction_type",
    type: "enum",
    enum: RestrictionType,
    enumName: "RestrictionType",
    nullable: false,
  })
  restrictionType: RestrictionType;
  /**
   * Restriction category of the restriction.
   * This category is fixed for federal restrictions as Federal.
   */
  @Column({
    name: "restriction_category",
    nullable: false,
    length: RESTRICTION_CATEGORY_MAX_LENGTH,
  })
  restrictionCategory: string;
  /**
   * Restriction code of the restriction
   */
  @Column({
    name: "restriction_code",
    nullable: false,
  })
  restrictionCode: string;
  /**
   * Description of the restriction
   */
  @Column({
    name: "description",
    nullable: false,
  })
  description: string;

  /**
   * Actions associated with the restriction, for instance, when a restriction must prevent the student from applying to a Student Application.
   */
  @Column({
    name: "action_type",
    nullable: false,
    type: "enum",
    enum: RestrictionActionType,
    enumName: "RestrictionActionType",
    array: true,
  })
  actionType: RestrictionActionType[];

  /**
   * The type of notification for the restriction.
   */
  @Column({
    name: "notification_type",
    nullable: false,
    type: "enum",
    enum: RestrictionNotificationType,
    enumName: "RestrictionNotificationType",
  })
  notificationType: RestrictionNotificationType;

  /**
   * Indicate that the restriction is a legacy and should not be
   * managed by SIMS, it can only transition to resolved.
   */
  @Column({
    name: "is_legacy",
  })
  isLegacy: boolean;
}
