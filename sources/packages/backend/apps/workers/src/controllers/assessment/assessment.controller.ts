import { Controller, Logger } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import {
  ZeebeJob,
  ICustomHeaders,
  MustReturnJobActionAcknowledgement,
  IOutputVariables,
} from "zeebe-node";
import {
  ApplicationAssessmentJobOutDTO,
  AssessmentDataJobInDTO,
  AssociateWorkflowInstanceJobInDTO,
  SaveAssessmentDataJobInDTO,
  WorkflowWrapUpJobInDTO,
  StudentAppealRequestJobOutDTO,
  SupportingUserJobOutDTO,
  UpdateNOAStatusHeaderDTO,
  UpdateNOAStatusJobInDTO,
  VerifyAssessmentCalculationOrderJobOutDTO,
} from "..";
import { StudentAssessmentService } from "../../services";
import {
  CRAIncomeVerification,
  StudentAppealRequest,
  StudentAssessment,
  SupportingUser,
  SupportingUserType,
} from "@sims/sims-db";
import {
  createUnexpectedJobFail,
  filterObjectProperties,
} from "../../utilities";
import {
  ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW,
  ASSESSMENT_ALREADY_ASSOCIATED_WITH_DIFFERENT_WORKFLOW,
  ASSESSMENT_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  Workers,
} from "@sims/services/constants";
import {
  ASSESSMENT_DATA,
  ASSESSMENT_ID,
  WORKFLOW_DATA,
} from "@sims/services/workflow/variables/assessment-gateway";
import { CustomNamedError } from "@sims/utilities";
import { MaxJobsToActivate } from "../../types";
import {
  AssessmentSequentialProcessingService,
  SystemUsersService,
  WorkflowClientService,
} from "@sims/services";

@Controller()
export class AssessmentController {
  constructor(
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly workflowClientService: WorkflowClientService,
    private readonly assessmentSequentialProcessingService: AssessmentSequentialProcessingService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Associates the workflow instance if the assessment is not associated already.
   */
  @ZeebeWorker(Workers.AssociateWorkflowInstance, {
    fetchVariable: [ASSESSMENT_ID],
    maxJobsToActivate: MaxJobsToActivate.Medium,
  })
  async associateWorkflowInstance(
    job: Readonly<
      ZeebeJob<
        AssociateWorkflowInstanceJobInDTO,
        ICustomHeaders,
        IOutputVariables
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const logger = new Logger(job.type);
    try {
      await this.studentAssessmentService.associateWorkflowInstance(
        job.variables.assessmentId,
        job.processInstanceKey,
      );
      logger.log(
        `Assessment id ${job.variables.assessmentId} associated to workflow ${job.processInstanceKey}.`,
      );
      return job.complete();
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW:
            logger.log(error.getSummaryMessage());
            return job.complete();
          case ASSESSMENT_NOT_FOUND:
            logger.error(error.getSummaryMessage());
            return job.error(error.name, error.message);
          case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
          case ASSESSMENT_ALREADY_ASSOCIATED_WITH_DIFFERENT_WORKFLOW:
            logger.warn(error.getSummaryMessage());
            // The below method also returns JOB_ACTION_ACKNOWLEDGEMENT ideally
            // considered sufficient to acknowledge that the job is completed.
            // But during the load test it has been identified that calling `job.cancelWorkflow()`
            // was not acknowledging that job is complete after the instance was cancelled.
            // At this moment, it proves to be bug in the framework and hence the approach of calling `job.complete()`
            // was followed.
            // TODO: Raise the issue regarding the bug to zeebe-node community and modify
            // the code if required based on their response or solution.
            await job.cancelWorkflow();
            return job.complete();
        }
      }
      return createUnexpectedJobFail(error, job, { logger });
    }
  }

  /**
   * Loads consolidated assessment including the assessment itself, application
   * dynamic data, supporting users, income and more. Includes the ability to filter
   * only the necessary data using jsonpath expressions (@see https://goessner.net/articles/JsonPath).
   * The filtered data must ensures that no PII (Personal Identifiable Information)
   * data will be sent to the workflow.
   * The filter is executed based on a key/value pair containing the jsonpath expression
   * received through the job custom headers.
   * @returns filtered consolidated information.
   */
  @ZeebeWorker(Workers.LoadAssessmentConsolidatedData, {
    fetchVariable: [ASSESSMENT_ID],
    maxJobsToActivate: MaxJobsToActivate.Normal,
  })
  async loadAssessmentConsolidatedData(
    job: Readonly<
      ZeebeJob<AssessmentDataJobInDTO, ICustomHeaders, IOutputVariables>
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const jobLogger = new Logger(job.type);
    try {
      const assessment = await this.studentAssessmentService.getById(
        job.variables.assessmentId,
      );
      if (!assessment) {
        const message = "Assessment not found.";
        jobLogger.error(message);
        return job.error(ASSESSMENT_NOT_FOUND, message);
      }
      const assessmentDTO = this.transformToAssessmentDTO(assessment);
      const outputVariables = filterObjectProperties(
        assessmentDTO,
        job.customHeaders,
      );
      jobLogger.log("Assessment consolidated data loaded.");
      return job.complete(outputVariables);
    } catch (error: unknown) {
      return createUnexpectedJobFail(error, job, {
        logger: jobLogger,
      });
    }
  }

  /**
   * Updates the assessment dynamic data if it was not updated already.
   */
  @ZeebeWorker(Workers.SaveAssessmentData, {
    fetchVariable: [ASSESSMENT_ID, ASSESSMENT_DATA],
    maxJobsToActivate: MaxJobsToActivate.Normal,
  })
  async saveAssessmentData(
    job: Readonly<
      ZeebeJob<SaveAssessmentDataJobInDTO, ICustomHeaders, IOutputVariables>
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const jobLogger = new Logger(job.type);
    try {
      await this.studentAssessmentService.updateAssessmentData(
        job.variables.assessmentId,
        job.variables.assessmentData,
      );
      jobLogger.log("Assessment data saved.");
      return job.complete();
    } catch (error: unknown) {
      return createUnexpectedJobFail(error, job, {
        logger: jobLogger,
      });
    }
  }

  /**
   * Updates the NOA (Notice of Assessment) status if not updated yet.
   */
  @ZeebeWorker(Workers.UpdateNOAStatus, {
    fetchVariable: [ASSESSMENT_ID],
    maxJobsToActivate: MaxJobsToActivate.High,
  })
  async updateNOAStatus(
    job: Readonly<
      ZeebeJob<
        UpdateNOAStatusJobInDTO,
        UpdateNOAStatusHeaderDTO,
        IOutputVariables
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const jobLogger = new Logger(job.type);
    try {
      await this.studentAssessmentService.updateNOAApprovalStatus(
        job.variables.assessmentId,
        job.customHeaders.status,
      );
      jobLogger.log("NOA status updated.");
      return job.complete();
    } catch (error: unknown) {
      return createUnexpectedJobFail(error, job, {
        logger: jobLogger,
      });
    }
  }

  /**
   * Worker to be executed at very end of the workflow responsible for latest tasks before the `end event`.
   */
  @ZeebeWorker(Workers.WorkflowWrapUp, {
    fetchVariable: [ASSESSMENT_ID, WORKFLOW_DATA],
    maxJobsToActivate: MaxJobsToActivate.Normal,
  })
  async workflowWrapUp(
    job: Readonly<
      ZeebeJob<WorkflowWrapUpJobInDTO, ICustomHeaders, IOutputVariables>
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const jobLogger = new Logger(job.type);
    try {
      const assessment =
        await this.studentAssessmentService.getAssessmentSummary(
          job.variables.assessmentId,
        );
      if (!assessment) {
        const message = "Assessment not found.";
        jobLogger.error(message);
        return job.error(ASSESSMENT_NOT_FOUND, message);
      }
      await this.studentAssessmentService.updateAssessmentStatusAndSaveWorkflowData(
        job.variables.assessmentId,
        job.variables.workflowData,
      );
      await this.assessmentSequentialProcessingService.assessImpactedApplicationReassessmentNeeded(
        job.variables.assessmentId,
        this.systemUsersService.systemUser.id,
      );
      const studentId = assessment.application.student.id;
      const programYearId = assessment.application.programYear.id;
      // Check for any assessment which is waiting for calculation.
      const nextOutstandingAssessmentInSequence =
        await this.studentAssessmentService.getOutstandingAssessmentsForStudentInSequence(
          studentId,
          programYearId,
        );
      if (nextOutstandingAssessmentInSequence) {
        jobLogger.log(
          `Assessment with assessment id ${nextOutstandingAssessmentInSequence.id} is ` +
            "waiting to be calculated next.",
        );
        // Send message to unblock the assessment which is waiting for calculation.
        await this.workflowClientService.sendReleaseAssessmentCalculationMessage(
          nextOutstandingAssessmentInSequence.id,
        );
      }
      jobLogger.log("Updated assessment status and saved the workflow data.");
      return job.complete();
    } catch (error: unknown) {
      return createUnexpectedJobFail(error, job, {
        logger: jobLogger,
      });
    }
  }

  /**
   * Verify as per the order of original assessment study start date if this assessment
   * is the first in the sequence to be calculated
   * for the given student inside the given program year.
   * If an assessment is identified to be the first in sequence to be calculated
   * then set calculation start date to hold other assessments until the calculation
   * is complete.
   */
  @ZeebeWorker(Workers.VerifyAssessmentCalculationOrder, {
    fetchVariable: [ASSESSMENT_ID],
    maxJobsToActivate: MaxJobsToActivate.Normal,
  })
  async verifyAssessmentCalculationOrder(
    job: Readonly<
      ZeebeJob<
        AssessmentDataJobInDTO,
        ICustomHeaders,
        VerifyAssessmentCalculationOrderJobOutDTO
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const jobLogger = new Logger(job.type);
    const result = {
      isReadyForCalculation: false,
    } as VerifyAssessmentCalculationOrderJobOutDTO;
    try {
      const assessment =
        await this.studentAssessmentService.getAssessmentSummary(
          job.variables.assessmentId,
        );
      if (!assessment) {
        const message = "Assessment not found.";
        jobLogger.error(message);
        return job.error(ASSESSMENT_NOT_FOUND, message);
      }
      const assessmentId = job.variables.assessmentId;
      const studentId = assessment.application.student.id;
      const programYearId = assessment.application.programYear.id;
      jobLogger.log(
        `Verifying the assessment calculation order for processing assessment id ${assessmentId} student id ${studentId} ` +
          `program year id ${programYearId}.`,
      );
      // Check for any assessment with ongoing calculation.
      const assessmentInCalculationStep =
        await this.studentAssessmentService.getAssessmentInCalculationStepForStudent(
          studentId,
          programYearId,
        );

      // If an ongoing calculation is happening all other assessments for given student in program year
      // must wait until the calculation is complete and saved to the system.
      // Also if a worker job is terminated by any chance after updating the calculation start date
      // for an assessment, then the assessment must proceed for the calculation.
      if (
        assessmentInCalculationStep &&
        assessmentInCalculationStep.id !== assessmentId
      ) {
        jobLogger.log(
          `There is ongoing calculation happening for assessment id ${assessmentInCalculationStep.id} ` +
            `and hence the processing assessment id ${assessmentId} is waiting for that calculation to complete.`,
        );
        return job.complete(result);
      }
      jobLogger.log(
        `There is no ongoing calculation happening while verifying the order for processing assessment id ${assessmentId}.`,
      );
      // Get the first outstanding assessment waiting for calculation as per the sequence.
      const firstOutstandingStudentAssessment =
        await this.studentAssessmentService.getOutstandingAssessmentsForStudentInSequence(
          studentId,
          programYearId,
        );
      jobLogger.log(
        `The first outstanding assessment is identified to be assessment id ${firstOutstandingStudentAssessment.id} ` +
          `with original assessment start date  ${firstOutstandingStudentAssessment.originalAssessmentStudyStartDate} ` +
          `while verifying the order for processing assessment id ${assessmentId}.`,
      );
      // If the processing assessment is same as first outstanding assessment
      // then proceed for calculation.
      const isReadyForCalculation =
        firstOutstandingStudentAssessment.id === job.variables.assessmentId;
      if (isReadyForCalculation) {
        const saveAssessmentCalculationStartDate =
          this.studentAssessmentService.saveAssessmentCalculationStartDate(
            assessmentId,
          );
        const getProgramYearTotalAwards =
          this.assessmentSequentialProcessingService.getProgramYearPreviousAwardsTotal(
            assessmentId,
            { alternativeReferenceDate: new Date() },
          );
        const [, programYearTotalAwards] = await Promise.all([
          saveAssessmentCalculationStartDate,
          getProgramYearTotalAwards,
        ]);
        jobLogger.log(
          `The assessment calculation order has been verified and the assessment id ${assessmentId} is ready to be processed.`,
        );
        programYearTotalAwards.forEach(
          (award) =>
            (result[`programYearTotal${award.valueCode}`] = award.total),
        );
        result.isReadyForCalculation = true;
        return job.complete(result);
      }
      jobLogger.log(
        `The assessment calculation order has been verified and the assessment id ${assessmentId} is not ready to be processed.`,
      );
      return job.complete(result);
    } catch (error: unknown) {
      return createUnexpectedJobFail(error, job, {
        logger: jobLogger,
      });
    }
  }

  /**
   * Creates a well-known object that represents the universe of possible
   * information that can be later filtered.
   * @param assessment assessment to be converted.
   * @returns well-known object that represents the universe of possible
   * information that can be later filtered.
   */
  private transformToAssessmentDTO(
    assessment: StudentAssessment,
  ): ApplicationAssessmentJobOutDTO {
    const application = assessment.application;
    const [studentCRAIncome] = application.craIncomeVerifications?.filter(
      (verification) => verification.supportingUserId === null,
    );
    const offering = assessment.offering;
    const institutionLocation = offering?.institutionLocation;
    return {
      applicationId: application.id,
      triggerType: assessment.triggerType,
      data: application.data,
      programYear: {
        programYear: application.programYear.programYear,
        startDate: application.programYear.startDate,
        endDate: application.programYear.endDate,
      },
      offering: {
        id: offering?.id,
        studyStartDate: offering?.studyStartDate,
        studyEndDate: offering?.studyEndDate,
        actualTuitionCosts: offering?.actualTuitionCosts,
        programRelatedCosts: offering?.programRelatedCosts,
        mandatoryFees: offering?.mandatoryFees,
        exceptionalExpenses: offering?.exceptionalExpenses,
        offeringDelivered: offering?.offeringDelivered,
        offeringIntensity: offering?.offeringIntensity,
        courseLoad: offering?.courseLoad,
        studyBreaks: offering?.studyBreaks,
      },
      program: {
        programCredentialType: offering?.educationProgram?.credentialType,
        programLength: offering?.educationProgram?.completionYears,
      },
      institution: {
        institutionType: institutionLocation?.institution.institutionType.name,
      },
      location: {
        institutionLocationProvince:
          institutionLocation?.data.address?.provinceState,
      },
      student: {
        craReportedIncome: studentCRAIncome?.craReportedIncome,
        taxYear: studentCRAIncome?.taxYear,
      },
      supportingUsers: this.flattenSupportingUsersArray(
        application.supportingUsers,
        application.craIncomeVerifications,
      ),
      appeals: this.flattenStudentAppeals(
        assessment.studentAppeal?.appealRequests,
      ),
    };
  }

  /**
   * Converts an array with supporting users to an object where every user
   * will be a property. This will keep the supporting users dynamic (it can be
   * extended to have a Parent3, Partner2 or even more types) and make easier to
   * read and process these users in the workflow.
   * @param supportingUsers supporting users to be converted.
   * @param incomeVerifications available income verifications associated with
   * the application associated with the supporting users.
   * @returns object where every user is a property.
   */
  flattenSupportingUsersArray(
    supportingUsers: SupportingUser[],
    incomeVerifications?: CRAIncomeVerification[],
  ): Record<string, SupportingUserJobOutDTO> {
    if (!supportingUsers?.length) {
      return null;
    }
    // Ensures that the users will be always ordered in the same way.
    supportingUsers.sort((userA, userB) => (userA.id > userB.id ? 1 : -1));
    // Object to be returned.
    const flattenedSupportingUsers = {} as Record<
      string,
      SupportingUserJobOutDTO
    >;
    // Filter and process by type to have the items ordered also by the type (Parent1, Parent2, Partner1).
    Object.keys(SupportingUserType).forEach((supportingUserType) => {
      supportingUsers
        .filter(
          (supportingUser) =>
            supportingUser.supportingUserType === supportingUserType,
        )
        .forEach((supportingUser, index) => {
          const [craIncome] = incomeVerifications?.filter(
            (verification) =>
              verification.supportingUserId === supportingUser.id,
          );
          flattenedSupportingUsers[`${supportingUserType}${index + 1}`] = {
            id: supportingUser.id,
            supportingUserType: supportingUser.supportingUserType,
            supportingData: supportingUser.supportingData,
            craReportedIncome: craIncome?.craReportedIncome,
          };
        });
    });
    return flattenedSupportingUsers;
  }

  /**
   * Converts an array with student appeal requests to an object where every
   * appeal request will be a property named by the form.io definition name used
   * to execute the student appeal request submission.
   * @param appealRequests approved student appeal requests.
   * @returns object where every student appeal request is a property.
   */
  flattenStudentAppeals(
    appealRequests: StudentAppealRequest[],
  ): Record<string, StudentAppealRequestJobOutDTO> {
    if (!appealRequests?.length) {
      return null;
    }
    // Object to be returned.
    const flattenedAppealRequests = {} as Record<
      string,
      StudentAppealRequestJobOutDTO
    >;
    appealRequests.forEach((appealRequest) => {
      flattenedAppealRequests[appealRequest.submittedFormName] = {
        submittedData: appealRequest.submittedData,
      };
    });
    return flattenedAppealRequests;
  }
}
