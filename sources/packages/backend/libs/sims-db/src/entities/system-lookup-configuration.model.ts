import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { RecordDataModel, SystemLookupCategory } from ".";
import { TableNames } from "../constant";

/**
 * System lookup configurations to store lookup data based on lookup category.
 */
@Entity({ name: TableNames.SystemLookupConfigurations })
export class SystemLookupConfiguration extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Lookup category of a lookup data.
   */
  @Column({
    name: "lookup_category",
  })
  lookupCategory: SystemLookupCategory;

  /**
   * Lookup key of a lookup data.
   */
  @Column({
    name: "lookup_key",
  })
  lookupKey: string;

  /**
   * Lookup value of a lookup data.
   */
  @Column({
    name: "lookup_value",
  })
  lookupValue: string;
}
