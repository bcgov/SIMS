import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import BaseController from "../BaseController";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  AssessmentHistorySummaryAPIOutDTO,
  AssessmentNOAAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
  AwardDetailsAPIOutDTO,
} from "./models/assessment.dto";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AssessmentControllerService } from "./assessment.controller.service";
import {
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "@sims/services/constants";
import { StudentAssessmentStatus } from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { Role, IUserToken } from "../../auth";
import { ManualReassessmentAPIInDTO } from "apps/api/src/route-controllers/application/models/application.dto";
import { PrimaryIdentifierAPIOutDTO } from "apps/api/src/route-controllers/models/primary.identifier.dto";
import { StudentAssessmentService } from "../../services";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("assessment")
@ApiTags(`${ClientTypeBaseRoute.AEST}-assessment`)
export class AssessmentAESTController extends BaseController {
  constructor(
    private readonly assessmentControllerService: AssessmentControllerService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {
    super();
  }

  /**
   * Get all pending and declined requests related to an application which would result
   * a new assessment when that request is approved.
   * @param applicationId application id.
   * @returns assessment requests or exceptions for a student application.
   */
  @Get("application/:applicationId/requests")
  async getRequestedAssessmentSummary(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    return this.assessmentControllerService.requestedStudentAssessmentSummary(
      applicationId,
      {
        includeOfferingChanges: true,
      },
    );
  }

  /**
   * Method to get history of assessments for an application,
   * i.e, this will have original assessment for the
   * student application, and all approved student
   * appeal and scholastic standings for the application
   * which will have different assessment status.
   * @param applicationId, application number.
   * @returns summary of the assessment history for a student application.
   */
  @Get("application/:applicationId/history")
  async getAssessmentHistorySummary(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<AssessmentHistorySummaryAPIOutDTO[]> {
    return this.assessmentControllerService.getAssessmentHistorySummary(
      applicationId,
    );
  }

  /**
   * Get the NOA values for a student application on a particular assessment.
   * @param assessmentId assessment id to get the NOA values.
   * @returns NOA and application data.
   */
  @Get(":assessmentId/noa")
  @ApiNotFoundResponse({
    description: "Assessment id not found.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Notice of assessment data is not present.",
  })
  async getAssessmentNOA(
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
  ): Promise<AssessmentNOAAPIOutDTO> {
    return this.assessmentControllerService.getAssessmentNOA(assessmentId, {
      maskMSFAA: false,
    });
  }

  /**
   * Get estimated and actual(if present) award details of an assessment.
   * @param assessmentId assessment to which awards details belong to.
   * @returns estimated and actual award details.
   */
  @Get(":assessmentId/award")
  @ApiNotFoundResponse({
    description: "Assessment not found.",
  })
  async getAssessmentAwardDetails(
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
  ): Promise<AwardDetailsAPIOutDTO> {
    return this.assessmentControllerService.getAssessmentAwardDetails(
      assessmentId,
      true,
    );
  }

  /**
   * Triggers manual reassessment for an application.
   * Application cannot be archived and original assessment must be in completed status.
   * @param payload request payload.
   * @param applicationId application id.
   */
  @Roles(Role.AESTManualTriggerReassessment)
  @Post(":applicationId/manual-reassessment")
  @ApiNotFoundResponse({ description: "Application id not found." })
  @ApiUnprocessableEntityResponse({
    description:
      `Application original assessment expected to be '${StudentAssessmentStatus.Completed}' to allow manual reassessment or ` +
      "application cannot have manual reassessment after being archived.",
  })
  async manualReassessment(
    @Body() payload: ManualReassessmentAPIInDTO,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const manualAssessment =
        await this.studentAssessmentService.manualReassessment(
          applicationId,
          payload.note,
          userToken.userId,
        );
      return { id: manualAssessment.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        if (error.name === APPLICATION_NOT_FOUND) {
          throw new NotFoundException(error.message);
        }
        if (error.name === INVALID_OPERATION_IN_THE_CURRENT_STATUS) {
          throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }
}
