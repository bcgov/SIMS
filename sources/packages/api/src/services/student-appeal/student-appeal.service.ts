import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";

import {
  Application,
  StudentAppeal,
  StudentAppealRequest,
  StudentAppealStatus,
  User,
} from "../../database/entities";
import { StudentAppealRequestModel } from "./student-appeal.model";

/**
 * Service layer for Student appeals.
 */
@Injectable()
export class StudentAppealService extends RecordDataModelService<StudentAppeal> {
  constructor(connection: Connection) {
    super(connection.getRepository(StudentAppeal));
  }

  /**
   * Save student appeals that are requested by the student.
   * @param applicationId Application to which an appeal is submitted.
   * @param userId Student user who submits the appeal.
   * @param studentAppealRequests Payload data.
   */
  async saveStudentAppeals(
    applicationId: number,
    userId: number,
    studentAppealRequests: StudentAppealRequestModel[],
  ): Promise<StudentAppeal> {
    const studentAppeal = new StudentAppeal();
    const currentDateTime = new Date();
    const creator = { id: userId } as User;
    studentAppeal.application = { id: applicationId } as Application;
    studentAppeal.creator = creator;
    studentAppeal.submittedDate = currentDateTime;
    studentAppeal.appealRequests = studentAppealRequests.map(
      (appealRequest) =>
        ({
          submittedFormName: appealRequest.formName,
          submittedData: appealRequest.formData,
          appealStatus: StudentAppealStatus.Pending,
          creator: creator,
          createdAt: currentDateTime,
        } as StudentAppealRequest),
    );
    return this.repo.save(studentAppeal);
  }

  /**
   * Find any pending appeal for a student if exists.
   * @param userId of student.
   * @returns exist status
   */
  async hasExistingAppeal(userId: number): Promise<boolean> {
    const existingAppeal = await this.repo
      .createQueryBuilder("appeal")
      .select("1")
      .innerJoin("appeal.appealRequests", "appealRequests")
      .innerJoin("appeal.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("user.id = :userId", { userId })
      .andWhere("appealRequests.appealStatus = :pending", {
        pending: StudentAppealStatus.Pending,
      })
      .limit(1)
      .getRawOne();

    return !!existingAppeal;
  }
}
