import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Brackets, Connection } from "typeorm";
import {
  Application,
  AssessmentTriggerType,
  Note,
  NoteType,
  StudentAppeal,
  StudentAppealRequest,
  StudentAppealStatus,
  StudentAssessment,
  User,
} from "../../database/entities";
import {
  PendingAndDeniedAppeals,
  StudentAppealRequestApproval,
  StudentAppealRequestModel,
  StudentAppealWithStatus,
} from "./student-appeal.model";
import { StudentAppealRequestsService } from "../student-appeal-request/student-appeal-request.service";
import { CustomNamedError, mapFromRawAndEntities } from "../../utilities";
import {
  STUDENT_APPEAL_INVALID_OPERATION,
  STUDENT_APPEAL_NOT_FOUND,
} from "./constants";

/**
 * Service layer for Student appeals.
 */
@Injectable()
export class StudentAppealService extends RecordDataModelService<StudentAppeal> {
  constructor(
    connection: Connection,
    private readonly studentAppealRequestsService: StudentAppealRequestsService,
  ) {
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

  /**
   * Get all pending and declined student Appeals
   * for an application.
   * Here we have added different when statement
   * in CASE to fetch the status of the appeals.
   * * WHEN: is checking if at least one Pending
   * * appeals request is there for an appeal,
   * * then the status is considered as Pending.
   * * END: if any of them is not falling
   * * under above case and applying the andWhere
   * * condition, we get Declined.
   * * andWhere: will only take Pending and
   * * Declined status.
   * @param applicationId application id .
   * @returns StudentAppeal list.
   */
  async getPendingAndDeniedAppeals(
    applicationId: number,
  ): Promise<PendingAndDeniedAppeals[]> {
    return this.repo
      .createQueryBuilder("studentAppeal")
      .select("studentAppeal.id", "id")
      .addSelect("studentAppeal.submittedDate", "submittedDate")
      .addSelect(
        `CASE
            WHEN EXISTS(${this.studentAppealRequestsService
              .appealsByStatusQueryObject(StudentAppealStatus.Pending)
              .getSql()}) THEN '${StudentAppealStatus.Pending}'
            ELSE '${StudentAppealStatus.Declined}'
        END`,
        "status",
      )
      .innerJoin("studentAppeal.application", "application")
      .where(`application.id = ${applicationId}`)
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            ` EXISTS(${this.studentAppealRequestsService
              .appealsByStatusQueryObject(StudentAppealStatus.Pending)
              .getSql()})`,
          ).orWhere(
            `NOT EXISTS(${this.studentAppealRequestsService
              .appealsByStatusQueryObject(StudentAppealStatus.Declined, false)
              .getSql()})`,
          );
        }),
      )
      .getRawMany();
  }

  /**
   * Get the student appeal and its requests.
   * @param appealId appeal if to be retrieved.
   * @returns student appeal and its requests.
   */
  async getAppealAndRequestsById(
    appealId: number,
  ): Promise<StudentAppealWithStatus> {
    const queryResult = await this.repo
      .createQueryBuilder("studentAppeal")
      .select([
        "studentAppeal.id",
        "studentAppeal.submittedDate",
        "appealRequest.id",
        "appealRequest.submittedData",
        "appealRequest.submittedFormName",
        "appealRequest.appealStatus",
        "appealRequest.assessedDate",
        "user.firstName",
        "user.lastName",
        "note.description",
      ])
      .addSelect(this.buildStatusSelect(), "status")
      .innerJoin("studentAppeal.appealRequests", "appealRequest")
      .leftJoin("appealRequest.assessedBy", "user")
      .leftJoin("appealRequest.note", "note")
      .where("studentAppeal.id = :appealId", { appealId })
      .getRawAndEntities();

    const [appealWithStatus] = mapFromRawAndEntities<StudentAppealWithStatus>(
      queryResult,
      "status",
    );
    return appealWithStatus;
  }

  /**
   * Builds the conditions to define the status of a student appeal
   * based on the statuses of its appeal requests.
   * @returns SQL select to be used in a query to return the appeal status.
   */
  private buildStatusSelect(): string {
    return `CASE
      WHEN EXISTS(${this.studentAppealRequestsService
        .appealsByStatusQueryObject(StudentAppealStatus.Pending)
        .getSql()}) THEN '${StudentAppealStatus.Pending}'
      WHEN EXISTS(${this.studentAppealRequestsService
        .appealsByStatusQueryObject(StudentAppealStatus.Approved)
        .getSql()}) THEN '${StudentAppealStatus.Approved}'
      ELSE '${StudentAppealStatus.Declined}'
    END`;
  }

  /**
   * Update all student appeals requests at once.
   * @param appealId appeal if to be retrieved.
   * @param approvals all appeal requests that must be updated with
   * an approved/declined status. All requests that belongs to the
   * appeal must be provided.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   */
  async approveRequests(
    appealId: number,
    approvals: StudentAppealRequestApproval[],
    auditUserId: number,
  ): Promise<StudentAppeal> {
    const appealRequestsIDs = approvals.map((approval) => approval.id);
    const appealToUpdate = await this.repo
      .createQueryBuilder("studentAppeal")
      .select(["studentAppeal.id", "studentAssessment.id", "appealRequest.id"])
      .innerJoin("studentAppeal.appealRequests", "appealRequest")
      .leftJoin("studentAppeal.studentAssessment", "studentAssessment")
      .where("studentAppeal.id = :appealId", { appealId })
      // Ensures that the provided appeal requests IDs belongs to the appeal.
      .andWhere("appealRequest.id IN (:...requestIDs)", {
        requestIDs: appealRequestsIDs,
      })
      // Ensures that all appeal requests are on pending status.
      .andWhere(
        `NOT EXISTS(${this.studentAppealRequestsService
          .appealsByStatusQueryObject(StudentAppealStatus.Pending, false)
          .getSql()})`,
      )
      .getOne();

    if (!appealToUpdate) {
      throw new CustomNamedError(
        `Not able to find the appeal or the appeal has requests different from '${StudentAppealStatus.Pending}'.`,
        STUDENT_APPEAL_NOT_FOUND,
      );
    }

    if (appealToUpdate.studentAssessment) {
      throw new CustomNamedError(
        "An assessment was already created to this student appeal.",
        STUDENT_APPEAL_INVALID_OPERATION,
      );
    }

    // If a students appel has, for instance, 3 requests, all must be updated at once.
    // The query already ensured that only pending requests will be selected and that
    // the student appeal also has nothing different then pending requests.
    if (approvals.length !== appealToUpdate.appealRequests.length) {
      throw new CustomNamedError(
        "The appeal requests must be updated all at once. The appeals requests received does not represents the entire set of records that must be updated.",
        STUDENT_APPEAL_INVALID_OPERATION,
      );
    }

    const auditUser = { id: auditUserId } as User;
    const auditDate = new Date();

    appealToUpdate.appealRequests = approvals.map(
      (approval) =>
        ({
          id: approval.id,
          appealStatus: approval.appealStatus,
          note: {
            noteType: NoteType.General,
            description: approval.noteDescription,
          } as Note,
          modifier: auditUser,
          assessedBy: auditUser,
          assessedDate: auditDate,
        } as StudentAppealRequest),
    );

    // Check is at least one appeal was approved and an assessment is needed.
    if (
      appealToUpdate.appealRequests.some(
        (request) => request.appealStatus === StudentAppealStatus.Approved,
      )
    ) {
      // Create the new assessment to be processed.
      appealToUpdate.studentAssessment = {
        application: { id: appealToUpdate.application.id } as Application,
        triggerType: AssessmentTriggerType.StudentAppeal,
        creator: auditUser,
        submittedBy: auditUser,
        submittedDate: auditDate,
      } as StudentAssessment;
    }

    return this.repo.save(appealToUpdate);
  }
}
