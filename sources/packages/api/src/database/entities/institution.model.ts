import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import {
  InstitutionContact,
  InstitutionMailingContact,
  InstitutionPrimaryContact,
  LegalAuthorityContact,
} from "../../types";
import { User } from "./user.model";

@Entity({ name: TableNames.Institution })
export class Institution extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

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

  //This field seen in the mockup but not in userstory
  @Column({
    name: "institution_type",
  })
  institutionType: string;

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
  established_date: Date;

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
  institutionAddress: InstitutionContact;

  @Column({
    name: "institution_mailing_address",
    type: "jsonb",
    nullable: true,
  })
  institutionMailingAddress: InstitutionMailingContact;

  @OneToOne((type) => User, { eager: true, cascade: true })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user: User;
}
