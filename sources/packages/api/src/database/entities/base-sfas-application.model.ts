import { JoinColumn, ManyToOne, Column } from "typeorm";
import { SFASIndividual } from ".";
import { ColumnNames } from "../constant";
import { BaseModel } from "./base.model";

/**
 * Base model to accommodate the common properties of SFAS FT/PT application model.
 */
export abstract class BaseSFASApplicationModel extends BaseModel {
  /**
   * The unique key/number used in SFAS to identify this individual.
   * FT (individual.individual_idx).
   * PT (Sail_extract_data.individual_idx).
   */
  @Column({
    name: "individual_id",
    nullable: false,
  })
  individualId: number;
  /**
   * SFAS Individual many to one relationship.
   */
  @ManyToOne(() => SFASIndividual, { eager: false, cascade: false })
  @JoinColumn({
    name: "individual_id",
    referencedColumnName: ColumnNames.ID,
  })
  individual: SFASIndividual;
}
