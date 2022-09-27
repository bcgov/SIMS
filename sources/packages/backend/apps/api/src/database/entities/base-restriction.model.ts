import { JoinColumn, ManyToOne, Column, OneToOne } from "typeorm";
import { ColumnNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { Restriction, Note } from ".";
/**
 * Abstract model for Student/Institution restriction as most of their properties are common.
 */
export abstract class BaseRestrictionModel extends RecordDataModel {
  /**
   * Restriction details
   */
  @ManyToOne(() => Restriction, { eager: false, cascade: false })
  @JoinColumn({
    name: "restriction_id",
    referencedColumnName: ColumnNames.ID,
  })
  restriction: Restriction;
  /**
   * Active flag which decides if the restriction is active
   */
  @Column({
    name: "is_active",
    nullable: false,
  })
  isActive: boolean;
  /**
   * Note entered during restriction creation.
   */
  @OneToOne(() => Note, { eager: false, cascade: true })
  @JoinColumn({
    name: "restriction_note_id",
    referencedColumnName: ColumnNames.ID,
  })
  restrictionNote: Note;
  /**
   * Note entered during restriction resolution.
   */
  @OneToOne(() => Note, { eager: false, cascade: true })
  @JoinColumn({
    name: "resolution_note_id",
    referencedColumnName: ColumnNames.ID,
  })
  resolutionNote: Note;
}
