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
   * Save student appeals that are requested by the student
   * @param applicationId
   * @param userId
   * @param studentAppealRequests
   */
  async saveStudentAppeals(
    applicationId: number,
    userId: number,
    studentAppealRequests: StudentAppealRequestModel[],
  ): Promise<void> {
    const studentAppeal = new StudentAppeal();
    const currentDateTime = new Date();
    studentAppeal.application = { id: applicationId } as Application;
    studentAppeal.creator = { id: userId } as User;
    studentAppeal.submittedDate = currentDateTime;
    studentAppeal.appealRequests = studentAppealRequests.map(
      (appealRequest) =>
        ({
          submittedFormName: appealRequest.formName,
          submittedData: appealRequest.formData,
          appealStatus: StudentAppealStatus.Pending,
          creator: { id: userId } as User,
          createdAt: currentDateTime,
        } as StudentAppealRequest),
    );
    this.repo.save(studentAppeal);
  }

  /**
   * Find any pending appeal for a student if exists
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
