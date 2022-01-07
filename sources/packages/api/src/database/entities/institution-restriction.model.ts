import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { Institution, Restriction, Note } from ".";

/**
 * Entity for institution restrictions
 */
@Entity({ name: TableNames.InstitutionRestrictions })
export class InstitutionRestriction extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * institution to whom the restriction is assigned
   */
  @ManyToOne(() => Institution, { eager: false, cascade: false })
  @JoinColumn({
    name: "institution_id",
    referencedColumnName: ColumnNames.ID,
  })
  institution: Institution;

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
