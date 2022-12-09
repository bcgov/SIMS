import { Injectable } from "@nestjs/common";

import {
  AssessmentStatus,
  RecordDataModelService,
  StudentAppealStatus,
  StudentAssessment,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { DataSource, IsNull, UpdateResult } from "typeorm";
import {
  ASSESSMENT_NOT_FOUND,
  ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW,
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
} from "@sims/services/constants";

/**
 * Manages the student assessment related operations.
 */
@Injectable()
export class StudentAssessmentService extends RecordDataModelService<StudentAssessment> {
  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(StudentAssessment));
  }

  /**
   * Associates the workflow instance if the assessment is not associated already.
   * @param assessmentId assessment id.
   * @param assessmentWorkflowId workflow instance id.
   */
  async associateWorkflowId(
    assessmentId: number,
    assessmentWorkflowId: string,
  ): Promise<void> {
    return this.dataSource.transaction(async (entityManager) => {
      const assessmentRepo = entityManager.getRepository(StudentAssessment);
      const assessment = await assessmentRepo.findOne({
        where: { id: assessmentId },
        lock: { mode: "pessimistic_write" },
      });
      if (!assessment) {
        throw new CustomNamedError(
          ASSESSMENT_NOT_FOUND,
          "Assessment id was not found.",
        );
      }
      if (!assessment.assessmentWorkflowId) {
        // Assessment is available to be associated with the workflow instance id.
        await assessmentRepo.update(assessmentId, { assessmentWorkflowId });
        return;
      }
      if (assessment.assessmentWorkflowId !== assessmentWorkflowId) {
        throw new CustomNamedError(
          ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
          `The assessment is already associated with another workflow instance. Current associated instance id ${assessment.assessmentWorkflowId}.`,
        );
      }
      // The workflow was already associated with the workflow, no need to update it again.
      throw new CustomNamedError(
        ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW,
        `The assessment is already associated to the workflow.`,
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
      { id: assessmentId, assessmentData: IsNull() },
      { assessmentData },
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
    return this.repo.update(
      {
        id: assessmentId,
        noaApprovalStatus: IsNull(),
      },
      { noaApprovalStatus: status },
    );
  }
}
