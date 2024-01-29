import { Injectable } from "@nestjs/common";
import {
  AssessmentStatus,
  AssessmentTriggerType,
  RecordDataModelService,
  StudentAppealStatus,
  StudentAssessment,
  StudentAssessmentStatus,
  WorkflowData,
  mapFromRawAndEntities,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import {
  DataSource,
  EntityManager,
  In,
  IsNull,
  Not,
  UpdateResult,
} from "typeorm";
import {
  ASSESSMENT_NOT_FOUND,
  ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW,
  ASSESSMENT_ALREADY_ASSOCIATED_WITH_DIFFERENT_WORKFLOW,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "@sims/services/constants";
import { NotificationActionsService, SystemUsersService } from "@sims/services";
import { StudentAssessmentDetail } from "./student-assessment.model";

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
        "programYear.id",
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
   * Updates assessment status and save workflow data.
   * @param assessmentId updated assessment.
   * @param workflowData workflow data to be saved.
   */
  async updateAssessmentStatusAndSaveWorkflowData(
    assessmentId: number,
    workflowData: WorkflowData,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const now = new Date();
    const studentAssessment = await this.repo.findOne({
      select: { studentAssessmentStatus: true },
      where: { id: assessmentId },
    });
    const assessmentUpdate: Partial<StudentAssessment> = {
      workflowData,
      modifier: auditUser,
      updatedAt: now,
    };
    // In case the student assessment is in process of being cancelled or is already cancelled,
    // it does not update status and update date.
    if (
      [
        StudentAssessmentStatus.CancellationRequested,
        StudentAssessmentStatus.CancellationQueued,
        StudentAssessmentStatus.Cancelled,
      ].includes(studentAssessment.studentAssessmentStatus)
    ) {
      await this.repo.update(assessmentId, assessmentUpdate);
    } else {
      await this.repo.update(assessmentId, {
        ...assessmentUpdate,
        studentAssessmentStatus: StudentAssessmentStatus.Completed,
        studentAssessmentStatusUpdatedOn: now,
      });
    }
  }

  /**
   * Get all outstanding student assessments to be calculated
   * in the order of original assessment study start date.
   * @param studentId student id.
   * @param programYearId program year id.
   * @returns student assessment to be calculated.
   */
  async getOutstandingAssessmentsForStudentInSequence(
    studentId: number,
    programYearId: number,
  ): Promise<StudentAssessmentDetail[]> {
    const originalAssessmentStudyStartDateAlias =
      "originalAssessmentStudyStartDate";
    // Sub query to get the original assessment study start date of a given assessment's application.
    const originalAssessmentDateSubQuery = this.repo
      .createQueryBuilder("studentAssessment")
      .select("offering.studyStartDate")
      .innerJoin("studentAssessment.offering", "offering")
      .where("studentAssessment.application.id = assessment.application.id")
      .andWhere("studentAssessment.triggerType = :triggerType")
      .getSql();

    const studentAssessmentsResult = await this.repo
      .createQueryBuilder("assessment")
      .select("assessment.id")
      .addSelect(
        `(${originalAssessmentDateSubQuery})`,
        originalAssessmentStudyStartDateAlias,
      )
      .innerJoin("assessment.application", "application")
      .where(
        "assessment.studentAssessmentStatus NOT IN (:...studentAssessmentStatus)",
      )
      .andWhere("assessment.offering IS NOT NULL")
      .andWhere("application.student.id = :studentId")
      .andWhere("application.programYear.id = :programYearId")
      .setParameter("triggerType", AssessmentTriggerType.OriginalAssessment)
      .setParameter("studentAssessmentStatus", [
        StudentAssessmentStatus.Completed,
        StudentAssessmentStatus.CancellationRequested,
        StudentAssessmentStatus.CancellationQueued,
        StudentAssessmentStatus.Cancelled,
      ])
      .setParameter("studentId", studentId)
      .setParameter("programYearId", programYearId)
      .orderBy(`"${originalAssessmentStudyStartDateAlias}"`)
      .addOrderBy("assessment.createdAt")
      .getRawAndEntities();
    return mapFromRawAndEntities<StudentAssessmentDetail>(
      studentAssessmentsResult,
      originalAssessmentStudyStartDateAlias,
    );
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
        studentAssessmentStatus: Not(
          In([
            StudentAssessmentStatus.Completed,
            StudentAssessmentStatus.CancellationRequested,
            StudentAssessmentStatus.CancellationQueued,
            StudentAssessmentStatus.Cancelled,
          ]),
        ),
        application: {
          student: { id: studentId },
          programYear: { id: programYearId },
        },
      },
    });
  }

  /**
   * Set assessment calculation start date.
   * @param assessmentId assessment id.
   * @returns update result.
   */
  async saveAssessmentCalculationStartDate(assessmentId: number) {
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
}
