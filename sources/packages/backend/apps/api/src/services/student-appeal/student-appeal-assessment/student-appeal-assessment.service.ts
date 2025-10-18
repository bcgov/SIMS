import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import {
  RecordDataModelService,
  NoteType,
  StudentAppeal,
  StudentAppealRequest,
  StudentAppealStatus,
  User,
} from "@sims/sims-db";
import { StudentAppealRequestApproval } from "../student-appeal.model";
import { StudentAppealRequestsService } from "../../student-appeal-request/student-appeal-request.service";
import { CustomNamedError } from "@sims/utilities";
import {
  STUDENT_APPEAL_INVALID_OPERATION,
  STUDENT_APPEAL_NOT_FOUND,
} from "../constants";
import { NotificationActionsService } from "@sims/services/notifications";
import { NoteSharedService } from "@sims/services";
import { StudentAppealActionsProcessor } from ".";

/**
 * Service layer for Student appeals.
 */
@Injectable()
export class StudentAppealAssessmentService extends RecordDataModelService<StudentAppeal> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentAppealRequestsService: StudentAppealRequestsService,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly noteSharedService: NoteSharedService,
    private readonly studentAppealActionsProcessor: StudentAppealActionsProcessor,
  ) {
    super(dataSource.getRepository(StudentAppeal));
  }

  /**
   * Update all student appeals requests at once.
   * @param appealId appeal ID to be retrieved.
   * @param approvals all appeal requests that must be updated with
   * an approved/declined status. All requests that belongs to the
   * appeal must be provided.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   */
  async assessRequests(
    appealId: number,
    approvals: StudentAppealRequestApproval[],
    auditUserId: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (entityManager) => {
      const appealToUpdate = await this.getAppealForAssessment(
        appealId,
        approvals,
        entityManager,
      );
      const auditUser = { id: auditUserId } as User;
      const auditDate = new Date();
      appealToUpdate.appealRequests = [];
      for (const approval of approvals) {
        // Create the new note.
        const note = await this.noteSharedService.createStudentNote(
          appealToUpdate.student.id,
          NoteType.Application,
          approval.noteDescription,
          auditUserId,
          entityManager,
        );
        // Update the appeal with the associated student note.
        appealToUpdate.appealRequests.push({
          id: approval.id,
          appealStatus: approval.appealStatus,
          note,
          modifier: auditUser,
          updatedAt: auditDate,
          assessedBy: auditUser,
          assessedDate: auditDate,
        } as StudentAppealRequest);
      }
      // Save appeals and its requests.
      const updatedStudentAppeal = await entityManager
        .getRepository(StudentAppeal)
        .save(appealToUpdate);
      // Process any actions associated with the appeal assessment request.
      await this.studentAppealActionsProcessor.processActions(
        updatedStudentAppeal,
        auditUserId,
        auditDate,
        entityManager,
      );
      // Create student notification when ministry completes student appeal.
      const studentUser = appealToUpdate.student.user;
      await this.notificationActionsService.saveChangeRequestCompleteNotification(
        {
          givenNames: studentUser.firstName,
          lastName: studentUser.lastName,
          toAddress: studentUser.email,
          userId: studentUser.id,
        },
        auditUserId,
        entityManager,
      );
    });
  }

  /**
   * Get the student appeal information required to process their approval or decline.
   * @param appealId appeal ID to be retrieved.
   * @param approvals all appeal requests that must be updated with
   * an approved/declined status. All requests that belongs to the
   * appeal must be provided.
   * @param entityManager entity manager to allow the query to happen within a transaction.
   * @returns the student appeal to be assessed.
   */
  private async getAppealForAssessment(
    appealId: number,
    approvals: StudentAppealRequestApproval[],
    entityManager: EntityManager,
  ): Promise<StudentAppeal> {
    const appealRequestsIDs = approvals.map((approval) => approval.id);
    const appealToUpdate = await entityManager
      .getRepository(StudentAppeal)
      .createQueryBuilder("studentAppeal")
      .select([
        "studentAppeal.id",
        "studentAssessment.id",
        "currentAssessment.id",
        "offering.id",
        "appealRequest.id",
        "application.id",
        "student.id",
        "user.id",
        "user.firstName",
        "user.lastName",
        "user.email",
      ])
      .innerJoin("studentAppeal.appealRequests", "appealRequest")
      .innerJoin("studentAppeal.student", "student")
      .innerJoin("student.user", "user")
      .leftJoin("studentAppeal.application", "application")
      .leftJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("currentAssessment.offering", "offering")
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

    // If a student's appeal has, for instance, 3 requests, all must be updated at once.
    // The query already ensured that only pending requests will be selected and that
    // the student appeal also has nothing different then pending requests.
    if (approvals.length !== appealToUpdate.appealRequests.length) {
      throw new CustomNamedError(
        "The appeal requests must be updated all at once. The appeals requests received does not represents the entire set of records that must be updated.",
        STUDENT_APPEAL_INVALID_OPERATION,
      );
    }

    return appealToUpdate;
  }
}
