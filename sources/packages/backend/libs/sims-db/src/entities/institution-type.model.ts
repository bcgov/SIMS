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
    if (INSTITUTION_TYPE_BC_PRIVATE === this.id) {
      return true;
    }
    return false;
  }

  /**
   * Is the institution type BC Public.
   */
  get isBCPublic(): boolean {
    if (INSTITUTION_TYPE_BC_PUBLIC === this.id) {
      return true;
    }
    return false;
  }
}
