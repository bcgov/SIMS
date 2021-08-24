import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { RecordDataModel } from "./record.model";

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
}
