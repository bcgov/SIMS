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
  UpdateAssessmentDataDTO,
  UpdateAssessmentStatusDTO,
  UpdateAssessmentWorkflowIdDTO,
  UpdateProgramInfoDTO,
} from "./models/assessment.system-access.dto";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import { AssessmentControllerService } from "..";
import { IUserToken } from "../../auth/userToken.interface";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("assessment")
@ApiTags(`${ClientTypeBaseRoute.SystemAccess}-assessment`)
export class AssessmentSystemAccessController extends BaseController {
  constructor(
    private readonly assessmentService: StudentAssessmentService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly assessmentControllerService: AssessmentControllerService,
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
          institutionLocation?.data.address.provinceState,
      },
      student: {
        studentPDStatus: application.student.studentPDVerified,
        craReportedIncome: studentCRAIncome?.craReportedIncome,
        taxYear: studentCRAIncome?.taxYear,
      },
      supportingUsers:
        this.assessmentControllerService.flattenSupportingUsersArray(
          application.supportingUsers,
          application.craIncomeVerifications,
        ),
      appeals: this.assessmentControllerService.flattenStudentAppeals(
        assessment.studentAppeal?.appealRequests,
      ),
    };
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
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.assessmentService.updateProgramInfo(
        assessmentId,
        userToken.userId,
        payload.locationId,
        payload.status,
        payload.programId,
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
