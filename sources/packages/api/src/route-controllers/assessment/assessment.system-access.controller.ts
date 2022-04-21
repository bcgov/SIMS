import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UnprocessableEntityException,
  Patch,
  Body,
  Post,
} from "@nestjs/common";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  DisbursementScheduleService,
  EducationProgramOfferingService,
  StudentAssessmentService,
} from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import {
  ApplicationAssessmentAPIOutDTO,
  CreateDisbursementsDTO,
  SupportingUsersAPIOutDTO,
  UpdateAssessmentDataDTO,
  UpdateAssessmentStatusDTO,
  UpdateAssessmentWorkflowIdDTO,
  UpdateProgramInfoDTO,
} from "./models/assessment.system-access.dto";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import { SupportingUser, SupportingUserType } from "../../database/entities";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("assessment")
@ApiTags(`${ClientTypeBaseRoute.SystemAccess}-assessment`)
export class AssessmentSystemAccessController extends BaseController {
  constructor(
    private readonly assessmentService: StudentAssessmentService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
  ) {
    super();
  }

  /**
   * Get the assessment and the related application information.
   * This method is used by the the assessment workflow as a main source
   * of information for the assessment/reassessment and the application.
   * @param assessmentId assessment id .
   * @returns assessment and the related application information.
   */
  @Get(":id")
  @ApiNotFoundResponse({
    description: "Assessment id was not found.",
  })
  async getByAssessmentId(
    @Param("id") assessmentId: number,
  ): Promise<ApplicationAssessmentAPIOutDTO> {
    const assessment = await this.assessmentService.getById(assessmentId);
    if (!assessment) {
      throw new NotFoundException(
        `Assessment id ${assessmentId} was not found.`,
      );
    }
    const application = assessment.application;
    return {
      triggerType: assessment.triggerType,
      data: application.data,
      programYear: {
        programYear: application.programYear.programYear,
        startDate: application.programYear.startDate,
        endDate: application.programYear.endDate,
      },
      offering: {
        id: assessment.offering?.id,
        studyStartDate: assessment.offering?.studyStartDate,
        studyEndDate: assessment.offering?.studyEndDate,
        actualTuitionCosts: assessment.offering?.actualTuitionCosts,
        programRelatedCosts: assessment.offering?.programRelatedCosts,
        mandatoryFees: assessment.offering?.mandatoryFees,
        exceptionalExpenses: assessment.offering?.exceptionalExpenses,
        tuitionRemittanceRequestedAmount:
          assessment.offering?.tuitionRemittanceRequestedAmount,
        offeringDelivered: assessment.offering?.offeringDelivered,
        offeringIntensity: assessment.offering?.offeringIntensity,
      },
      program: {
        programCredentialType:
          assessment.offering?.educationProgram?.credentialType,
        programLength: assessment.offering?.educationProgram?.completionYears,
      },
      institution: {
        institutionType: application.location?.institution.institutionType.name,
      },
      location: {
        institutionLocationProvince:
          application.location?.data.address.province,
      },
      student: {
        studentPDStatus: application.student.studentPDVerified,
      },
      supportingUsers: this.flattenSupportingUsersArray(
        application.supportingUsers,
      ),
    };
  }

  /**
   * Converts an arrays with supporting users to a object where every user
   * will be a property. This will keep the supporting users dynamic (it can be
   * extended to have a Parent3, Partner2 or even more types) and make easier to
   * read and process these users in the workflow.
   * @param supportingUsers supporting users to be converted.
   * @returns object where every user is a property.
   */
  private flattenSupportingUsersArray(
    supportingUsers: SupportingUser[],
  ): SupportingUsersAPIOutDTO {
    if (!supportingUsers?.length) {
      return null;
    }
    // Ensures that the users will be always ordered in the same way
    supportingUsers.sort((userA, userB) => (userA.id > userB.id ? 1 : -1));
    // Object to be returned.
    const flattenSupportingUsers = {} as SupportingUsersAPIOutDTO;
    // Filter and process by type to have the items ordered also by the type (Parent1, Parent2, Partner1).
    Object.keys(SupportingUserType).forEach((supportingUserType) => {
      supportingUsers
        .filter(
          (supportingUser) =>
            supportingUser.supportingUserType === supportingUserType,
        )
        .forEach((supportingUser, index) => {
          const [craIncome] = supportingUser.craIncomeVerifications;
          flattenSupportingUsers[`${supportingUserType}${index + 1}`] = {
            id: supportingUser.id,
            supportingUserType: supportingUser.supportingUserType,
            supportingData: supportingUser.supportingData,
            reportedIncome: craIncome?.reportedIncome,
            craReportedIncome: craIncome?.craReportedIncome,
          };
        });
    });
    return flattenSupportingUsers;
  }

  /**
   * Updates Program Information Request (PIR) related data.
   * @param assessmentId assessment id to be updated.
   * @param payload data to be updated.
   * @returns updates the assessment offering and/or the PIR
   * (Program Info Request) related application data.
   */
  @ApiOkResponse({
    description:
      "Assessment offering and/or the PIR (Program Info Request) related application data updated.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to find the offering associated with the program and location.",
  })
  @ApiNotFoundResponse({
    description: "Assessment id was not found.",
  })
  @Patch(":id/program-info")
  async updateProgramInfoRequest(
    @Param("id") assessmentId: number,
    @Body() payload: UpdateProgramInfoDTO,
  ): Promise<void> {
    if (payload.offeringId) {
      const offering = await this.offeringService.getProgramOffering(
        payload.locationId,
        payload.programId,
        payload.offeringId,
      );
      if (!offering) {
        throw new UnprocessableEntityException(
          "Not able to find the offering associated with the program and location.",
        );
      }
    }

    try {
      await this.assessmentService.updateProgramInfo(
        assessmentId,
        payload.locationId,
        payload.status,
        payload.programId,
        payload.offeringId,
      );
    } catch (error) {
      if (error.name === ASSESSMENT_NOT_FOUND) {
        throw new NotFoundException(
          `Assessment id ${assessmentId} was not found.`,
        );
      }
      throw error;
    }
  }

  /**
   * Updates the assessment workflowId.
   * The workflow id on the assessment table must be null otherwise
   * an exception will be raised. The exception is raised to prevent
   * that two different workflow instances try to process the same
   * assessment.
   * @param assessmentId assessment id to be updated.
   * @param payload contains the workflowId to be updated.
   */
  @Patch(":id/workflow-id")
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to update the assessment workflowId with provided data.",
  })
  async updateAssessmentWorkflowId(
    @Param("id") assessmentId: number,
    @Body() payload: UpdateAssessmentWorkflowIdDTO,
  ): Promise<void> {
    const updateResult = await this.assessmentService.updateWorkflowId(
      assessmentId,
      payload.workflowId,
    );

    // Checks if some record was updated.
    // If affected is zero it means that the update was not successful.
    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException(
        "Not able to update the assessment workflowId either because the id was not found or the workflow id is already present.",
      );
    }
  }

  /**
   * Updates the assessment data resulted from the
   * assessment workflow process.
   * @param assessmentId assessment to be updated.
   * @param payload data to be persisted.
   */
  @Patch(":assessmentId/assessment-data")
  @ApiNotFoundResponse({
    description: "Assessment id was not found.",
  })
  async updateAssessmentData(
    @Param("assessmentId") assessmentId: number,
    @Body() payload: UpdateAssessmentDataDTO,
  ): Promise<void> {
    const updateResult = await this.assessmentService.updateAssessmentData(
      assessmentId,
      payload.data,
    );

    if (updateResult.affected === 0) {
      // No rows updated because the assessment id was not found.
      throw new NotFoundException(
        `Assessment id ${assessmentId} was not found.`,
      );
    }
  }

  /**
   * Create the disbursements for an assessment/reassessment.
   * Creates the disbursements and values altogether.
   * @param assessmentId application id to associate the disbursements.
   * @param payload array of disbursements and values to be created.
   * @returns created disbursements ids.
   */
  @Post(":assessmentId/disbursements")
  @ApiNotFoundResponse({
    description: "Assessment id was not found.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "The disbursement information is already present or either the assessment or the application is not in the correct state.",
  })
  async createDisbursement(
    @Param("assessmentId") assessmentId: number,
    @Body() payload: CreateDisbursementsDTO,
  ): Promise<number[]> {
    try {
      const disbursements =
        await this.disbursementScheduleService.createDisbursementSchedules(
          assessmentId,
          payload.schedules,
        );
      return disbursements.map((disbursement) => disbursement.id);
    } catch (error) {
      switch (error.name) {
        case ASSESSMENT_NOT_FOUND:
          throw new NotFoundException(error.message);
        case ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
          throw new UnprocessableEntityException(error.message);
        default:
          throw error;
      }
    }
  }

  /**
   * Updates the NOA (notice of assessment) approval status.
   * The NOA status defines if the student needs to provide
   * his approval to the NOA or not.
   * @param assessmentId assessment id to be updated.
   * @param payload status of the NOA approval.
   */
  @Patch(":id/noa-approval-status")
  async updateAssessmentStatus(
    @Param("id") assessmentId: number,
    @Body() payload: UpdateAssessmentStatusDTO,
  ): Promise<void> {
    const updateResult = await this.assessmentService.updateNOAApprovalStatus(
      assessmentId,
      payload.status,
    );

    // Checks if some record was updated.
    // If affected is zero it means that the update was not successful.
    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException(
        "Not able to update the assessment status with provided data.",
      );
    }
  }
}
