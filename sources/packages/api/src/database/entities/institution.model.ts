import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import {
  InstitutionAddress,
  InstitutionPrimaryContact,
  LegalAuthorityContact,
} from "../../types";
import { User } from "./user.model";
import { InstitutionUser } from "./institution-user.model";

@Entity({ name: TableNames.Institution })
export class Institution extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "guid",
  })
  guid: string;

  @Column({
    name: "legal_operating_name",
  })
  legalOperatingName: string;

  @Column({
    name: "operating_name",
    nullable: true,
  })
  operatingName: string;

  @Column({
    name: "primary_phone",
  })
  primaryPhone: string;

  @Column({
    name: "primary_email",
  })
  primaryEmail: string;

  @Column({
    name: "website",
  })
  website: string;
  @Column({
    name: "regulating_body",
  })
  regulatingBody: string;

  @Column({
    name: "established_date",
  })
  establishedDate: Date;

  @Column({
    name: "primary_contact",
    type: "jsonb",
    nullable: false,
  })
  institutionPrimaryContact: InstitutionPrimaryContact;

  @Column({
    name: "legal_authority_contact",
    type: "jsonb",
  })
  legalAuthorityContact: LegalAuthorityContact;

  @Column({
    name: "institution_address",
    type: "jsonb",
  })
  institutionAddress: InstitutionAddress;

  @OneToMany((type) => InstitutionUser, (user) => user.institution, {
    eager: false,
    cascade: false,
  })
  users: InstitutionUser[];
}
