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
/**
 * Interface for primary contact of institution location.
 */
export interface PrimaryContact {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
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
