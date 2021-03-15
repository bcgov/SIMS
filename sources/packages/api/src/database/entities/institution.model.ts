import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { ContactInfo, LegalAuthorityContactInfo } from "../../types";
import { User } from "./user.model";

@Entity({ name: TableNames.Institution })
export class Institution extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "operatingName",
  })
  operatingName: string;

  @Column({
    name: "institution_address_info",
    type: "jsonb",
    nullable: false,
  })
  institutionAddress: ContactInfo;

  @Column({
    name: "institution_mailing_address_info",
    type: "jsonb",
    nullable: true,
  })
  institutionMailingAddress: ContactInfo;

  @Column({
    name: "legal_authority_contact_info",
    type: "jsonb",
    nullable: false,
  })
  legalAuthorityContactInfo: LegalAuthorityContactInfo;

  @Column({
    name: "established_date",
  })
  established_date: Date;

  @Column({
    name: "website",
  })
  website: string;

  @Column({
    name: "primaryPhone",
  })
  primaryPhone: string;

  @Column({
    name: "regulatingBody",
  })
  regulatingBody: string;

  @OneToOne((type) => User, { eager: true, cascade: true })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user: User;
}
