import { Injectable } from "@nestjs/common";
import {
  AssessmentStatus,
  DisbursementScheduleStatus,
  RecordDataModelService,
  StudentAppealStatus,
  StudentAssessment,
  StudentAssessmentStatus,
  WorkflowData,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { DataSource, EntityManager, IsNull, Not, UpdateResult } from "typeorm";
import {
  ASSESSMENT_NOT_FOUND,
  ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW,
  ASSESSMENT_ALREADY_ASSOCIATED_WITH_DIFFERENT_WORKFLOW,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
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
      const auditUser = this.systemUsersService.systemUser;
      const assessmentRepo = entityManager.getRepository(StudentAssessment);
      const assessment = await assessmentRepo.findOne({
        select: {
          id: true,
          studentAssessmentStatus: true,
          assessmentWorkflowId: true,
        },
        where: { id: assessmentId },
        lock: { mode: "pessimistic_write" },
      });

      if (!assessment) {
        throw new CustomNamedError(
          "Assessment id was not found.",
          ASSESSMENT_NOT_FOUND,
        );
      }

      // Check if the assessment is in one of the initial statuses. Any status different than "Submitted" and "Queued" should
      // cancel the workflow because there is no point executing it.
      // A workflow in these statuses can be associated and updated to "In progress" nicely. The expectation is that it would
      // be primarily "Queued" but there is no harm in allowing "Submitted" also.
      // The main intention is to prevent the workflow association from happening in any other status, for instance,
      // for the case when workers are down and a workflow is triggered, the assessment can have its status updated
      // (e.g. be canceled) before the workers are up and running again, which can potentially make the workflow execution no longer needed.
      const initialStatuses = [
        StudentAssessmentStatus.Submitted,
        StudentAssessmentStatus.Queued,
      ];
      if (!initialStatuses.includes(assessment.studentAssessmentStatus)) {
        throw new CustomNamedError(
          `The assessment is not in any initial status that would allow the workflow association. Expected statuses: ${initialStatuses.join(
            ", ",
          )}.`,
          INVALID_OPERATION_IN_THE_CURRENT_STATUS,
        );
      }

      // Check it there is already a workflow id associated with the assessment.
      if (assessment.assessmentWorkflowId) {
        if (assessment.assessmentWorkflowId !== assessmentWorkflowId) {
          throw new CustomNamedError(
            `The assessment is already associated with another workflow instance. Current associated instance id ${assessment.assessmentWorkflowId}.`,
            ASSESSMENT_ALREADY_ASSOCIATED_WITH_DIFFERENT_WORKFLOW,
          );
        }
        // The workflow was already associated with the workflow, no need to update it again.
        throw new CustomNamedError(
          "The assessment is already associated to the workflow.",
          ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW,
        );
      }

      // Assessment is available to be associated with the workflow instance id.
      const now = new Date();
      await assessmentRepo.update(assessmentId, {
        assessmentWorkflowId,
        studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        studentAssessmentStatusUpdatedOn: now,
        modifier: auditUser,
        updatedAt: now,
      });
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
        "application.applicationStatus",
        "application.applicationEditStatus",
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
        "supportingUser.id",
        "supportingUser.supportingUserType",
        "supportingUser.supportingData",
        "craIncomeVerification.id",
        "craIncomeVerification.craReportedIncome",
        "craIncomeVerification.taxYear",
        "craIncomeVerificationSupportingUser.id",
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
      .leftJoin(
        "craIncomeVerification.supportingUser",
        "craIncomeVerificationSupportingUser",
      )
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
    const auditUser = this.systemUsersService.systemUser;
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
   * Updates assessment status and save workflow data ensuring
   * that the data will be updated only once.
   * @param assessmentId updated assessment.
   * @param entityManager used to execute the commands in the same transaction.
   * @param options options to be updated.
   * - `workflowData` data to be saved in the workflowData field.
   * @returns true if the update was executed or false in case the data was already present.
   */
  async updateAssessmentWrapUpData(
    assessmentId: number,
    entityManager: EntityManager,
    options?: { workflowData?: WorkflowData },
  ): Promise<boolean> {
    const studentAssessmentRepo =
      entityManager.getRepository(StudentAssessment);
    const studentAssessment = await studentAssessmentRepo.findOne({
      select: { studentAssessmentStatus: true },
      where: { id: assessmentId },
    });
    const workflowIsCancelled = [
      StudentAssessmentStatus.CancellationRequested,
      StudentAssessmentStatus.CancellationQueued,
      StudentAssessmentStatus.Cancelled,
    ].includes(studentAssessment.studentAssessmentStatus);
    const auditUser = this.systemUsersService.systemUser;
    const now = new Date();
    if (workflowIsCancelled) {
      if (!options?.workflowData) {
        // No update is executed because the data was already present or the workflow was cancelled.
        return false;
      }
      // If the workflow was cancelled and there is a workflowData to be saved,
      // save the data without updating the status.
      const updateResult = await studentAssessmentRepo.update(
        { id: assessmentId, workflowData: IsNull() },
        {
          workflowData: options.workflowData,
          modifier: auditUser,
          updatedAt: now,
        },
      );
      return !!updateResult.affected;
    }
    // Workflow is not cancelled, update the status and save the data, if not updated already.
    const updateResult = await studentAssessmentRepo.update(
      {
        id: assessmentId,
        studentAssessmentStatus: Not(StudentAssessmentStatus.Completed),
      },
      {
        studentAssessmentStatus: StudentAssessmentStatus.Completed,
        studentAssessmentStatusUpdatedOn: now,
        workflowData: options?.workflowData,
        modifier: auditUser,
        updatedAt: now,
      },
    );
    return !!updateResult.affected;
  }

  /**
   * Updates the last reported assessment for the current assessment.
   * @param assessmentId related assessment id.
   * @param entityManager entity manager to be part of the transaction.
   * @returns updated assessment.
   */
  async updateLastReportedAssessment(
    assessmentId: number,
    entityManager: EntityManager,
  ): Promise<UpdateResult | undefined> {
    const studentAssessmentRepo =
      entityManager.getRepository(StudentAssessment);
    const assessment = await studentAssessmentRepo.findOne({
      select: {
        id: true,
        offering: {
          studyStartDate: true,
          studyEndDate: true,
        },
        application: {
          id: true,
        },
      },
      relations: {
        application: true,
        offering: true,
      },
      where: { id: assessmentId },
    });
    const auditUser = this.systemUsersService.systemUser;
    const lastReportedAssessment = await this.getLastReportedAssessment(
      assessment.application.id,
      entityManager,
    );
    if (
      !lastReportedAssessment ||
      (assessment.offering.studyStartDate ===
        lastReportedAssessment.offering.studyStartDate &&
        assessment.offering.studyEndDate ===
          lastReportedAssessment.offering.studyEndDate)
    ) {
      return;
    }
    return studentAssessmentRepo.update(
      {
        id: assessmentId,
      },
      {
        previousDateChangedReportedAssessment: {
          id: lastReportedAssessment.id,
        },
        modifier: auditUser,
      },
    );
  }

  /**
   * Gets the last reported assessment.
   * @param applicationId current assessment application id.
   * @param entityManager entity manager to be part of the transaction.
   * @returns last reported assessment.
   */
  private async getLastReportedAssessment(
    applicationId: number,
    entityManager: EntityManager,
  ): Promise<StudentAssessment> {
    const studentAssessmentRepo =
      entityManager.getRepository(StudentAssessment);
    const lastApplicationChangeReportedAssessment = await studentAssessmentRepo
      .createQueryBuilder("studentAssessment")
      .select([
        "studentAssessment.id",
        "offering.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
      ])
      .innerJoin("studentAssessment.offering", "offering")
      .innerJoin("studentAssessment.application", "application")
      .where("application.id = :applicationId", {
        applicationId,
      })
      .andWhere(
        "studentAssessment.previousDateChangedReportedAssessment IS NOT NULL",
      )
      .andWhere("studentAssessment.reportedDate IS NOT NULL")
      .orderBy("studentAssessment.assessmentDate", "DESC")
      .limit(1)
      .getOne();
    if (lastApplicationChangeReportedAssessment) {
      return lastApplicationChangeReportedAssessment;
    }
    return studentAssessmentRepo
      .createQueryBuilder("studentAssessment")
      .select([
        "studentAssessment.id",
        "offering.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
      ])
      .innerJoin("studentAssessment.offering", "offering")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin(
        "studentAssessment.disbursementSchedules",
        "disbursementSchedules",
      )
      .where("application.id = :applicationId", {
        applicationId,
      })
      .andWhere(
        "disbursementSchedules.disbursementScheduleStatus = :disbursementScheduleStatus",
        { disbursementScheduleStatus: DisbursementScheduleStatus.Sent },
      )
      .orderBy("studentAssessment.assessmentDate", "DESC")
      .limit(1)
      .getOne();
  }

  /**
   * Check if there is any assessment in calculation step currently
   * during this time for the given student in given program year.
   * Calculation step includes from calculating the assessment numbers
   * to persisting calculated data in the system.
   * @param studentId student id.
   * @param programYearId program year id.
   * @returns assessment in calculation process.
   */
  async getAssessmentInCalculationStepForStudent(
    studentId: number,
    programYearId: number,
  ): Promise<StudentAssessment> {
    return this.repo.findOne({
      select: { id: true },
      where: {
        calculationStartDate: Not(IsNull()),
        studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        application: {
          student: { id: studentId },
          programYear: { id: programYearId },
        },
      },
    });
  }

  /**
   * Set assessment calculation start date.
   ** Save only when the calculation start date is not present
   ** considering the need of workers to be idempotent.
   * @param assessmentId assessment id.
   * @returns update result.
   */
  async saveAssessmentCalculationStartDate(
    assessmentId: number,
  ): Promise<UpdateResult> {
    const now = new Date();
    return this.repo.update(
      { id: assessmentId, calculationStartDate: IsNull() },
      {
        calculationStartDate: now,
        modifier: this.systemUsersService.systemUser,
        updatedAt: now,
      },
    );
  }

  /**
   * Get assessment summary details.
   * @param assessmentId assessment id.
   * @returns assessment summary details.
   */
  async getAssessmentSummary(assessmentId: number): Promise<StudentAssessment> {
    return this.repo.findOne({
      select: {
        id: true,
        previousDateChangedReportedAssessment: { id: true },
        offering: {
          offeringIntensity: true,
        },
        application: {
          id: true,
          student: { id: true },
          programYear: { id: true },
          applicationStatus: true,
        },
      },
      relations: {
        application: { student: true, programYear: true },
        previousDateChangedReportedAssessment: true,
        offering: true,
      },
      where: { id: assessmentId },
    });
  }

  /**
   * Check if any NOAs have been accepted for a given application.
   * @param applicationId the application to check associated assessments for.
   * @returns boolean if NOA acceptance exist on any related assessments.
   */
  async assessmentNOAExists(applicationId: number): Promise<boolean> {
    return this.repo.exists({
      where: {
        application: { id: applicationId },
        noaApprovalStatus: AssessmentStatus.completed,
      },
    });
  }
}
