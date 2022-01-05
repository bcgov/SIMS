import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { RestrictionType } from ".";

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
   * Maximum number of times the given restriction can be ignored
   */
  @Column({
    name: "allowed_count",
    nullable: false,
  })
  allowedCount: number;
}
