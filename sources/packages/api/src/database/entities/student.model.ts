import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { ContactInfo } from "../../types";
import { User } from "./user.model";

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

  @OneToOne((type) => User, { eager: true, cascade: true })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user: User;
}
