import { Injectable } from "@nestjs/common";
import {
  AssessmentStatus,
  RecordDataModelService,
  StudentAppealStatus,
  StudentAssessment,
  StudentAssessmentStatus,
  WorkflowData,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { DataSource, EntityManager, IsNull, UpdateResult } from "typeorm";
import {
  ASSESSMENT_NOT_FOUND,
  ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW,
  ASSESSMENT_ALREADY_ASSOCIATED_WITH_DIFFERENT_WORKFLOW,
} from "@sims/services/constants";
import { NotificationActionsService, SystemUsersService } from "@sims/services";

/**
 * Manages the student assessment related operations.
 */
@Injectable()
export class StudentAssessmentService extends RecordDataModelService<StudentAssessment> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly systemUsersService: SystemUsersService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    super(dataSource.getRepository(StudentAssessment));
  }

  /**
   * Associates the workflow instance to the assessment record,
   * updating its status to "In progress".
   * @param assessmentId assessment id.
   * @param assessmentWorkflowId workflow instance id.
   */
  async associateWorkflowInstance(
    assessmentId: number,
    assessmentWorkflowId: string,
  ): Promise<void> {
    return this.dataSource.transaction(async (entityManager) => {
      const auditUser = await this.systemUsersService.systemUser();
      const assessmentRepo = entityManager.getRepository(StudentAssessment);
      const assessment = await assessmentRepo.findOne({
        where: { id: assessmentId },
        lock: { mode: "pessimistic_write" },
      });
      if (!assessment) {
        throw new CustomNamedError(
          "Assessment id was not found.",
          ASSESSMENT_NOT_FOUND,
        );
      }
      if (!assessment.assessmentWorkflowId) {
        // Assessment is available to be associated with the workflow instance id.
        const now = new Date();
        await assessmentRepo.update(assessmentId, {
          assessmentWorkflowId,
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
          studentAssessmentStatusUpdatedOn: now,
          modifier: auditUser,
          updatedAt: now,
        });
        return;
      }
      if (assessment.assessmentWorkflowId !== assessmentWorkflowId) {
        throw new CustomNamedError(
          `The assessment is already associated with another workflow instance. Current associated instance id ${assessment.assessmentWorkflowId}.`,
          ASSESSMENT_ALREADY_ASSOCIATED_WITH_DIFFERENT_WORKFLOW,
        );
      }
      // The workflow was already associated with the workflow, no need to update it again.
      throw new CustomNamedError(
        `The assessment is already associated to the workflow.`,
        ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW,
      );
    });
  }

  /**
   * Gets the consolidated assessment including the assessment itself, application
   * dynamic data, supporting users, income and more. Contains all data needed to execute
   * an assessment or reassessment.
   * @param assessmentId assessment to have the data retrieve.
   * @returns consolidated assessment information.
   */
  async getById(assessmentId: number): Promise<StudentAssessment> {
    // TODO: To be converted to object query.
    return this.repo
      .createQueryBuilder("assessment")
      .select([
        "assessment.id",
        "assessment.triggerType",
        "application.id",
        "application.data",
        "programYear.programYear",
        "programYear.startDate",
        "programYear.endDate",
        "offering.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "offering.mandatoryFees",
        "offering.exceptionalExpenses",
        "offering.offeringDelivered",
        "offering.offeringIntensity",
        "offering.courseLoad",
        "offering.studyBreaks",
        "educationProgram.id",
        "educationProgram.credentialType",
        "educationProgram.completionYears",
        "institution.id",
        "institutionType.name",
        "student.id",
        "student.studentPDVerified",
        "supportingUser.id",
        "supportingUser.supportingUserType",
        "supportingUser.supportingData",
        "craIncomeVerification.id",
        "craIncomeVerification.craReportedIncome",
        "craIncomeVerification.taxYear",
        "craIncomeVerification.supportingUser.id",
        "studentAppeal.id",
        "appealRequest.id",
        "institutionLocation.data",
        "appealRequest.submittedFormName",
        "appealRequest.submittedData",
      ])
      .innerJoin("assessment.application", "application")
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.student", "student")
      .leftJoin("assessment.offering", "offering")
      .leftJoin("offering.institutionLocation", "institutionLocation")
      .leftJoin("offering.educationProgram", "educationProgram")
      .leftJoin("institutionLocation.institution", "institution")
      .leftJoin("institution.institutionType", "institutionType")
      .leftJoin("application.supportingUsers", "supportingUser")
      .leftJoin("assessment.studentAppeal", "studentAppeal")
      .leftJoin(
        "studentAppeal.appealRequests",
        "appealRequest",
        "appealRequest.appealStatus = :appealStatus",
        { appealStatus: StudentAppealStatus.Approved },
      )
      .leftJoin("application.craIncomeVerifications", "craIncomeVerification")
      .where("assessment.id = :assessmentId", {
        assessmentId,
      })
      .getOne();
  }

  /**
   * Updates the assessment dynamic data if it was not updated already.
   * @param assessmentId assessment id to have the data updated.
   * @param assessmentData dynamic data to be updated.
   * @returns update result.
   */
  async updateAssessmentData(
    assessmentId: number,
    assessmentData: unknown,
  ): Promise<UpdateResult> {
    return this.repo.update(
      {
        id: assessmentId,
        assessmentData: IsNull(),
      },
      {
        assessmentData,
        assessmentDate: new Date(),
      },
    );
  }

  /**
   * Updates the NOA (notice of assessment) approval status.
   * The NOA status defines if the student needs to provide
   * his approval to the NOA or not.
   * @param assessmentId assessment id to be updated.
   * @param status status of the assessment.
   * @returns update result.
   */
  async updateNOAApprovalStatus(
    assessmentId: number,
    status: AssessmentStatus,
  ): Promise<UpdateResult> {
    const auditUser = await this.systemUsersService.systemUser();
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const updateResult = await transactionalEntityManager
        .getRepository(StudentAssessment)
        .update(
          { id: assessmentId, noaApprovalStatus: IsNull() },
          { noaApprovalStatus: status, modifier: auditUser },
        );

      if (updateResult.affected === 1) {
        // Create a student notification when NOA approval status is updated from null.
        await this.createAssessmentReadyForConfirmationNotification(
          assessmentId,
          auditUser.id,
          transactionalEntityManager,
        );
        return updateResult;
      }
    });
  }

  /**
   * Create assessment ready for student confirmation notification to notify student
   * when workflow update the NOA approval status.
   * @param assessmentId updated assessment.
   * @param auditUserId user who creates notification.
   * @param transactionalEntityManager entity manager to execute in transaction.
   */
  async createAssessmentReadyForConfirmationNotification(
    assessmentId: number,
    auditUserId: number,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    const studentAssessment = await transactionalEntityManager
      .getRepository(StudentAssessment)
      .findOne({
        select: {
          id: true,
          application: {
            id: true,
            student: {
              id: true,
              user: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        relations: {
          application: { student: { user: true } },
        },
        where: { id: assessmentId },
      });

    const studentUser = studentAssessment.application.student.user;
    await this.notificationActionsService.saveAssessmentReadyForConfirmationNotification(
      {
        givenNames: studentUser.firstName,
        lastName: studentUser.lastName,
        toAddress: studentUser.email,
        userId: studentUser.id,
      },
      auditUserId,
      transactionalEntityManager,
    );
  }

  /**
   * Updates assessment status and save workflow data.
   * @param assessmentId updated assessment.
   * @param workflowData workflow data to be saved.
   */
  async updateAssessmentStatusAndSaveWorkflowData(
    assessmentId: number,
    workflowData: WorkflowData,
  ): Promise<void> {
    const auditUser = await this.systemUsersService.systemUser();
    const now = new Date();
    await this.repo.update(assessmentId, {
      workflowData,
      studentAssessmentStatus: StudentAssessmentStatus.Completed,
      studentAssessmentStatusUpdatedOn: now,
      modifier: auditUser,
      updatedAt: now,
    });
  }
}
