import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { Student } from "./student.model";

@Entity({ name: TableNames.Applications })
export class Application extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "data",
    type: "jsonb",
    nullable: false,
  })
  data: any;

  @OneToOne(() => Student, { eager: false, cascade: true })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
}
