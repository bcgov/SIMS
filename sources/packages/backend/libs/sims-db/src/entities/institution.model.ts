import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { InstitutionUser } from "./institution-user.model";
import { InstitutionType } from "./institution-type.model";
import { Note } from ".";
import { AddressInfo } from "./address.type";
import { PrimaryContact } from "./primary-contact.type";

export const OPERATING_NAME_MAX_LENGTH = 250;
export const LEGAL_OPERATING_NAME_MAX_LENGTH = 250;

export interface InstitutionAddress {
  mailingAddress: AddressInfo;
}

@Entity({ name: TableNames.Institution })
export class Institution extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Business identifier of an institution.
   */
  @Column({
    name: "business_guid",
  })
  businessGuid: string;

  @Column({
    name: "legal_operating_name",
    length: LEGAL_OPERATING_NAME_MAX_LENGTH,
  })
  legalOperatingName: string;

  @Column({
    name: "operating_name",
    nullable: true,
    length: OPERATING_NAME_MAX_LENGTH,
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

  /**
   * Other institution regulating body.
   */
  @Column({
    name: "other_regulating_body",
  })
  otherRegulatingBody?: string;

  @Column({
    name: "established_date",
    type: "date",
  })
  establishedDate: string;

  @Column({
    name: "primary_contact",
    type: "jsonb",
    nullable: false,
  })
  institutionPrimaryContact: PrimaryContact;

  @Column({
    name: "institution_address",
    type: "jsonb",
  })
  institutionAddress: InstitutionAddress;

  @OneToMany(() => InstitutionUser, (user) => user.institution, {
    eager: false,
    cascade: false,
  })
  users: InstitutionUser[];

  @ManyToOne(() => InstitutionType, { eager: false, cascade: false })
  @JoinColumn({
    name: "institution_type_id",
    referencedColumnName: ColumnNames.ID,
  })
  institutionType: InstitutionType;

  @ManyToMany(() => Note, { eager: false, cascade: true })
  @JoinTable({
    name: TableNames.InstitutionNotes,
    joinColumn: { name: ColumnNames.InstitutionId },
    inverseJoinColumn: { name: ColumnNames.NoteId },
  })
  notes: Note[];
}
