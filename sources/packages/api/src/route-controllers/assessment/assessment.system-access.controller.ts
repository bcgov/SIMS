import {
  Controller,
  Get,
  NotFoundException,
  Param,
  HttpStatus,
  UnprocessableEntityException,
  Patch,
  Body,
} from "@nestjs/common";
import {
  ASSESSMENT_NOT_FOUND,
  EducationProgramOfferingService,
  StudentAssessmentService,
} from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { IConfig } from "../../types";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  ApplicationAssessmentDTO,
  UpdateAssessmentWorkflowIdDTO,
  UpdateProgramInfoDTO,
} from "./models/assessment.system-access.dto";
import { AllowAuthorizedParty } from "../../auth/decorators";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("assessment")
@ApiTags("System Access - Assessment")
export class AssessmentSystemAccessController extends BaseController {
  constructor(
    private readonly assessmentService: StudentAssessmentService,
    private readonly offeringService: EducationProgramOfferingService,
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Assessment found.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Assessment id was not found.",
  })
  async getByAssessmentId(
    @Param("id") assessmentId: number,
  ): Promise<ApplicationAssessmentDTO> {
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
    } as ApplicationAssessmentDTO;
  }

  /**
   * Updates Program Information Request (PIR) related data.
   * @param assessmentId assessment id to be updated.
   * @param payload data to be updated.
   * @returns updates the assessment offering and/or the PIR (Program Info Request) related application data.
   */
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      "Assessment offering and/or the PIR (Program Info Request) related application data updated.",
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description:
      "Not able to find the offering associate with the program and location.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
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
          "Not able to find the offering associate with the program and location.",
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Workflow id updated.",
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
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
}
