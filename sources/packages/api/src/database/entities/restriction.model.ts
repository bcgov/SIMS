import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { RestrictionType } from ".";
import { RestrictionNotificationType } from "./restriction_notification_type";
import { RestrictionActionType } from "./restriction_action_type";

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
   * Action type of the restriction
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
   * Notification type of the restriction
   */
  @Column({
    name: "notification_type",
    nullable: false,
    type: "enum",
    enum: RestrictionNotificationType,
    enumName: "RestrictionNotificationType",
  })
  notificationType: RestrictionNotificationType;
}
