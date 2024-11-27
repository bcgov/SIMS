/**
 * Workers must be implemented as idempotent methods and also with the ability to allow a retry operation.
 * The idempotency would ensure the worker can be potentially be called multiple time to process the same job
 * and it will produce the same impact and same result. To know more about it please check the link
 * https://docs.camunda.io/docs/components/best-practices/development/dealing-with-problems-and-exceptions/#writing-idempotent-workers.
 * The retry ability means that, in case of fail, the worker must ensure the data would still be consistent
 * and a new retry operation would be successfully executed.
 * Please see the below link also for some best practices for workers.
 * https://docs.camunda.io/docs/components/best-practices/development/dealing-with-problems-and-exceptions/
 */
import { Controller, Logger } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
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
import {
  DisbursementScheduleService,
  StudentAssessmentService,
} from "../../services";
import {
  ApplicationStatus,
  CRAIncomeVerification,
  OfferingIntensity,
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
  AwardTotal,
  SystemUsersService,
  WorkflowClientService,
} from "@sims/services";
import { DataSource, EntityManager } from "typeorm";
import { StudentLoanBalanceSharedService } from "@sims/services/student-loan-balance/student-loan-balance-shared.service";
import {
  ICustomHeaders,
  IOutputVariables,
  MustReturnJobActionAcknowledgement,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";

@Controller()
export class AssessmentController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly workflowClientService: WorkflowClientService,
    private readonly assessmentSequentialProcessingService: AssessmentSequentialProcessingService,
    private readonly systemUsersService: SystemUsersService,
    private readonly studentLoanBalanceSharedService: StudentLoanBalanceSharedService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
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
      const hasNOAApproval =
        await this.studentAssessmentService.assessmentNOAExists(
          assessment.application.id,
        );
      const assessmentDTO = this.transformToAssessmentDTO(
        assessment,
        hasNOAApproval,
      );
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
      await this.disbursementScheduleService.updateDisbursementsHasEstimatedAwards(
        job.variables.assessmentId,
        job.variables.assessmentData["finalAwardTotal"],
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
      // The updateAssessmentStatusAndSaveWorkflowData and assessImpactedApplicationReassessmentNeeded are executed in the same transaction
      // to force then to be successfully executed together or to fail together. In this way the worker can be safely retried from Camunda.
      await this.dataSource.transaction(async (entityManager) => {
        // Update status and workflow data ensuring that it will be updated only for the first time to ensure the worker idempotency.
        const updated =
          await this.studentAssessmentService.updateAssessmentStatusAndSaveWorkflowData(
            job.variables.assessmentId,
            job.variables.workflowData,
            entityManager,
          );
        if (!updated) {
          // If no rows were update it means that the data is already updated and the worker was already executed before.
          jobLogger.log(
            "Assessment status and workflow data were already updated. This indicates that the worker " +
              "was invoked multiple times and it was already executed with success.",
          );
          return job.complete();
        }
        const application = assessment.application;
        // Previous date change reported assessments can only exist for completed applications
        // with at least one disbursement sent to ESDC.
        // Hence applications that are not completed cannot have previous date change reported assessments.
        // To ensure the implementation to be idempotent, update previous date change reported assessment
        // only if it is not updated already.
        if (
          application.applicationStatus === ApplicationStatus.Completed &&
          !assessment.previousDateChangedReportedAssessment
        ) {
          await this.updatePreviousDateChangeReportedAssessment(
            job.variables.assessmentId,
            entityManager,
            jobLogger,
          );
        }
        const impactedApplication =
          await this.assessmentSequentialProcessingService.assessImpactedApplicationReassessmentNeeded(
            job.variables.assessmentId,
            this.systemUsersService.systemUser.id,
            entityManager,
          );
        if (impactedApplication) {
          jobLogger.log(
            `Application id ${impactedApplication.id} was detected as impacted and will be reassessed.`,
          );
        }
      });
      const studentId = assessment.application.student.id;
      const programYearId = assessment.application.programYear.id;
      // Check for any assessment which is waiting for calculation.
      const nextOutstandingAssessmentInSequence =
        await this.assessmentSequentialProcessingService.getOutstandingAssessmentsForStudentInSequence(
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
        await this.assessmentSequentialProcessingService.getOutstandingAssessmentsForStudentInSequence(
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
          this.assessmentSequentialProcessingService.getProgramYearPreviousAwardsTotals(
            assessmentId,
            { alternativeReferenceDate: new Date() },
          );
        // Updates the calculation start date and get the program year totals in parallel.
        const [, programYearTotalAwards] = await Promise.all([
          saveAssessmentCalculationStartDate,
          getProgramYearTotalAwards,
        ]);
        if (
          assessment.offering.offeringIntensity === OfferingIntensity.partTime
        ) {
          // Fetch the latest CSLP balance for the student.
          result.latestCSLPBalance =
            await this.studentLoanBalanceSharedService.getLatestCSLPBalance(
              studentId,
            );
        }
        jobLogger.log(
          `The assessment calculation order has been verified and the assessment id ${assessmentId} is ready to be processed.`,
        );
        this.createOutputForProgramYearTotals(programYearTotalAwards, result);
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
   * Create a new dynamic output variable for each award and offering intensity.
   * Each variable is prefixed with 'programYearTotal' and then concatenated
   * with the offering intensity as 'FullTime'/'PartTime' and the award code.
   * @example
   * programYearTotalFullTimeBCAG: 1250
   * programYearTotalPartTimeBCAG: 3450
   * @param programYearTotalAwards awards to be added to the output.
   * @param output output to receive the dynamic property.
   */
  private createOutputForProgramYearTotals(
    programYearTotalAwards: AwardTotal[],
    output: VerifyAssessmentCalculationOrderJobOutDTO,
  ): void {
    // Create the dynamic variables to be outputted.
    programYearTotalAwards.forEach((award) => {
      const intensity =
        award.offeringIntensity === OfferingIntensity.fullTime
          ? "FullTime"
          : "PartTime";
      const outputName = `programYearTotal${intensity}${award.valueCode}`;
      output[outputName] = output[outputName]
        ? output[outputName] + award.total
        : award.total;
    });
  }

  /**
   * Creates a well-known object that represents the universe of possible
   * information that can be later filtered.
   * @param assessment assessment to be converted.
   * @param hasNOAApproval if a notice of assessment has been approved for the application.
   * @returns well-known object that represents the universe of possible
   * information that can be later filtered.
   */
  private transformToAssessmentDTO(
    assessment: StudentAssessment,
    hasNOAApproval: boolean,
  ): ApplicationAssessmentJobOutDTO {
    const application = assessment.application;
    const [studentCRAIncome] = application.craIncomeVerifications?.filter(
      (verification) => verification.supportingUserId === null,
    );
    const offering = assessment.offering;
    const institutionLocation = offering?.institutionLocation;
    return {
      applicationId: application.id,
      applicationStatus: application.applicationStatus,
      hasNOAApproval,
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

  /**
   * Updates the last reported assessment for the provided assessment.
   * @param assessmentId assessment id.
   * @param entityManager entity manager to be used in the transaction.
   * @param jobLogger job logger.
   */
  private async updatePreviousDateChangeReportedAssessment(
    assessmentId: number,
    entityManager: EntityManager,
    jobLogger: Logger,
  ) {
    const lastReportedAssessmentUpdateResult =
      await this.studentAssessmentService.updateLastReportedAssessment(
        assessmentId,
        entityManager,
      );
    if (!lastReportedAssessmentUpdateResult) {
      jobLogger.log(
        "No last reported date change assessment was found or the last reported date change assessment update is not required.",
      );
      return;
    }
    if (lastReportedAssessmentUpdateResult.affected) {
      jobLogger.log(
        "Last reported date changed assessment was found and updated.",
      );
      return;
    }
    throw new Error(
      "Previous date changed assessment update was not successful. This could be due to assessment id being not valid.",
    );
  }
}
