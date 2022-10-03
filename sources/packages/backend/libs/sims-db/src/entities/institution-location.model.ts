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
import { AddressInfo } from "./address.type";
import { PrimaryContact } from "./primary-contact.type";

export interface InstitutionLocationData {
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
  data: InstitutionLocationData;

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

  @Column({
    name: "institution_code",
  })
  institutionCode: string;

  @Column({
    name: "primary_contact",
    type: "jsonb",
    nullable: false,
  })
  primaryContact: PrimaryContact;
}
