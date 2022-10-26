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
import { User } from "./user.model";
import { ContactInfo, Note } from ".";
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
    name: "birth_date",
    type: "date",
  })
  birthDate: string;

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

  @OneToOne(() => SINValidation, { eager: false, cascade: true })
  @JoinColumn({
    name: "sin_validation_id",
    referencedColumnName: ColumnNames.ID,
  })
  sinValidation: SINValidation;
  /**
   * Indicates consent of the student to terms and conditions of the studentAid BC declaration of SIN.
   */
  @Column({
    name: "sin_consent",
  })
  sinConsent: boolean;
}
