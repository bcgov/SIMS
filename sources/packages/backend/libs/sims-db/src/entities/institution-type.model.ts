import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { RecordDataModel } from "./record.model";
import {
  INSTITUTION_TYPE_BC_PRIVATE,
  INSTITUTION_TYPE_BC_PUBLIC,
} from "../constant";

@Entity({
  name: "institution_type",
})
export class InstitutionType extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "name",
    nullable: false,
  })
  name: string;

  /**
   * Is the institution type BC Private.
   */
  get isBCPrivate(): boolean {
    return INSTITUTION_TYPE_BC_PRIVATE === this.id;
  }

  /**
   * Is the institution type BC Public.
   */
  get isBCPublic(): boolean {
    return INSTITUTION_TYPE_BC_PUBLIC === this.id;
  }
}
