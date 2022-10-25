import { Controller } from "@nestjs/common";
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
  StudentAppealRequestJobOutDTO,
  SupportingUserJobOutDTO,
  UpdateNOAStatusHeaderDTO,
  UpdateNOAStatusJobInDTO,
} from "..";
import { StudentAssessmentService } from "../../services";
import {
  CRAIncomeVerification,
  StudentAppealRequest,
  StudentAssessment,
  SupportingUser,
  SupportingUserType,
} from "@sims/sims-db";
import { filterObjectProperties } from "../../utilities";
import {
  ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW,
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
} from "../../constants";
import {
  ASSESSMENT_DATA,
  ASSESSMENT_ID,
} from "@sims/services/workflow/variables/assessment-gateway";
import { CustomNamedError } from "@sims/utilities";
import { MaxJobsToActivate } from "../../types";

@Controller()
export class AssessmentController {
  constructor(
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {}

  /**
   * Associates the workflow instance if the assessment is not associated already.
   */
  @ZeebeWorker("associate-workflow-instance", {
    fetchVariable: [ASSESSMENT_ID],
    maxJobsToActivate: MaxJobsToActivate.Normal,
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
    try {
      await this.studentAssessmentService.associateWorkflowId(
        job.variables.assessmentId,
        job.processInstanceKey,
      );
      return job.complete();
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW:
            return job.complete();
          case ASSESSMENT_NOT_FOUND:
          case ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
            return job.error(error.name, error.message);
        }
      }
      return job.fail(
        `Not able to associate the assessment id ${job.variables.assessmentId} with the workflow instance id ${job.processInstanceKey}. ${error}`,
      );
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
  @ZeebeWorker("load-assessment-consolidated-data", {
    fetchVariable: [ASSESSMENT_ID],
    maxJobsToActivate: MaxJobsToActivate.Normal,
  })
  async loadAssessmentConsolidatedData(
    job: Readonly<
      ZeebeJob<AssessmentDataJobInDTO, ICustomHeaders, IOutputVariables>
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const assessment = await this.studentAssessmentService.getById(
      job.variables.assessmentId,
    );
    if (!assessment) {
      return job.error(ASSESSMENT_NOT_FOUND, "Assessment not found.");
    }
    const assessmentDTO = this.transformToAssessmentDTO(assessment);
    const outputVariables = filterObjectProperties(
      assessmentDTO,
      job.customHeaders,
    );
    return job.complete(outputVariables);
  }

  /**
   * Updates the assessment dynamic data if it was not updated already.
   */
  @ZeebeWorker("save-assessment-data", {
    fetchVariable: [ASSESSMENT_ID, ASSESSMENT_DATA],
    maxJobsToActivate: MaxJobsToActivate.Normal,
  })
  async saveAssessmentData(
    job: Readonly<
      ZeebeJob<SaveAssessmentDataJobInDTO, ICustomHeaders, IOutputVariables>
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    await this.studentAssessmentService.updateAssessmentData(
      job.variables.assessmentId,
      job.variables.assessmentData,
    );
    return job.complete();
  }

  /**
   * Updates the NOA (Notice of Assessment) status if not updated yet.
   */
  @ZeebeWorker("update-noa-status", {
    fetchVariable: [ASSESSMENT_ID],
    maxJobsToActivate: MaxJobsToActivate.Maximum,
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
    await this.studentAssessmentService.updateNOAApprovalStatus(
      job.variables.assessmentId,
      job.customHeaders.status,
    );
    return job.complete();
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
        studentPDStatus: application.student.studentPDVerified,
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
