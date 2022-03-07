import {
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Application } from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { StudentAppealRequest } from "./student-appeal-requests.model";

/**
 * Represents as set of appeals requested by a student, for instance, to have his income
 * or dependents data changed on his Student Application after it was completed.
 */
@Entity({ name: TableNames.StudentAppeal })
export class StudentAppeal extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Application id related to this student appeal.
   */
  @RelationId(
    (studentAssessment: StudentAppeal) => studentAssessment.application,
  )
  applicationId: number;
  /**
   * Application related to this student appeal.
   */
  @ManyToOne(() => Application, {
    eager: false,
    cascade: false,
    nullable: false,
  })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;
  /**
   * Individual appeals that belongs to the same request.
   */
  @OneToMany(
    () => StudentAppealRequest,
    (studentAppealRequest) => studentAppealRequest.studentAppeal,
    {
      eager: false,
      cascade: true,
      nullable: false,
    },
  )
  appealRequests: StudentAppealRequest[];
}
