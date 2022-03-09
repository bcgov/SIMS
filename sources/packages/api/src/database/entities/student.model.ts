import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { ContactInfo } from "../../types";
import { User } from "./user.model";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";
import { Note } from ".";
import { SINValidation } from "./sin-validation.model";

@Entity({ name: TableNames.Student })
export class Student extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "contact_info",
    type: "jsonb",
    nullable: false,
  })
  contactInfo: ContactInfo;

  @Column({
    name: "sin",
  })
  sin: string;

  @Column({
    name: "birth_date",
    type: "date",
    transformer: dateOnlyTransformer,
  })
  birthDate: Date;

  @Column({
    name: "pd_verified",
    nullable: true,
  })
  studentPDVerified?: boolean;

  @Column({
    name: "gender",
  })
  gender: string;

  @OneToOne(() => User, { eager: true, cascade: true })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user: User;

  @Column({
    name: "pd_date_sent",
    nullable: true,
  })
  studentPDSentAt?: Date;

  @Column({
    name: "pd_date_update",
    nullable: true,
  })
  studentPDUpdateAt?: Date;

  @ManyToMany(() => Note, { eager: false, cascade: true })
  @JoinTable({
    name: TableNames.StudentNotes,
    joinColumn: { name: ColumnNames.StudentId },
    inverseJoinColumn: { name: ColumnNames.NoteId },
  })
  notes: Note[];

  @OneToOne(() => SINValidation, { eager: true, cascade: true })
  @JoinColumn({
    name: "sin_validations_id",
    referencedColumnName: ColumnNames.ID,
  })
  sinValidation: SINValidation;
}
