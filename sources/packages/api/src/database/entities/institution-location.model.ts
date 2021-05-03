import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Institution } from "./institution.model";
import { RecordDataModel } from "./record.model";
import { ColumnNames } from "../constant";
import { AddressInfo } from "../../types";

export interface InstitutionLocationInfo {
  address: AddressInfo;
}

@Entity({
  name: "institution_locations",
})
export class InstitutionLocation extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "info",
    type: "jsonb",
    nullable: false,
  })
  data: InstitutionLocationInfo;

  @Column({
    name: "name",
    nullable: false,
  })
  name: string;

  @OneToOne((type) => Institution, { eager: false, cascade: true })
  @JoinColumn({
    name: "institution_id",
    referencedColumnName: ColumnNames.ID,
  })
  institution: Institution;
}
