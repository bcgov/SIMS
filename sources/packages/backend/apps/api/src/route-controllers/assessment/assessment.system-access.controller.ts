import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UnprocessableEntityException,
  Patch,
  Body,
} from "@nestjs/common";
import {
  ASSESSMENT_NOT_FOUND,
  DisbursementScheduleService,
  StudentAssessmentService,
  InstitutionLocationService,
  EducationProgramService,
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
  UpdateAssessmentDataDTO,
  UpdateAssessmentWorkflowIdDTO,
  UpdateProgramInfoAPIInDTO,
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
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly assessmentControllerService: AssessmentControllerService,
    private readonly locationService: InstitutionLocationService,
    private readonly programService: EducationProgramService,
  ) {
    super();
  }

  /**
   * Updates Program Information Request (PIR) related data.
   * @param assessmentId assessment id to be updated.
   * @param payload data to be updated.
   */
  @ApiOkResponse({
    description:
      "Assessment offering and/or the PIR (Program Info Request) related application data updated.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Location not valid or program not valid for given location",
  })
  @ApiNotFoundResponse({
    description: "Assessment id was not found.",
  })
  @Patch(":id/program-info")
  async updateProgramInfoRequest(
    @Param("id") assessmentId: number,
    @Body() payload: UpdateProgramInfoAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const location = await this.locationService.getInstitutionLocationById(
      payload.locationId,
    );
    if (!location) {
      throw new UnprocessableEntityException("Location not valid.");
    }
    // Validating the program when program id is present.
    // Program id may not be available when PIR is required.
    if (payload.programId) {
      const program = await this.programService.getInstitutionProgram(
        payload.programId,
        location.institution.id,
      );
      if (!program) {
        throw new UnprocessableEntityException(
          "Program not valid for given location.",
        );
      }
    }
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
}
