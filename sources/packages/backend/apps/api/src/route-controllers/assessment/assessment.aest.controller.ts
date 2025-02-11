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
import { ApplicationStatus, StudentAssessmentStatus } from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { Role, IUserToken } from "../../auth";
import { ManualReassessmentAPIInDTO } from "../assessment/models/assessment.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { ApplicationService, StudentAssessmentService } from "../../services";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("assessment")
@ApiTags(`${ClientTypeBaseRoute.AEST}-assessment`)
export class AssessmentAESTController extends BaseController {
  constructor(
    private readonly assessmentControllerService: AssessmentControllerService,
    private readonly applicationService: ApplicationService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {
    super();
  }

  /**
   * Get all pending and declined requests related to an application which would result
   * a new assessment when that request is approved.
   * @param applicationId parent application id.
   * @returns assessment requests or exceptions for a student application.
   */
  @Get("application/:applicationId/requests")
  async getRequestedAssessmentSummary(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    const currentApplicationId =
      await this.applicationService.getApplicationIdByParentApplicationId(
        applicationId,
      );
    return this.assessmentControllerService.requestedStudentAssessmentSummary(
      currentApplicationId,
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
   * @param applicationId parent application id.
   * @returns summary of the assessment history for a student application.
   */
  @Get("application/:applicationId/history")
  async getAssessmentHistorySummary(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<AssessmentHistorySummaryAPIOutDTO[]> {
    const currentApplicationId =
      await this.applicationService.getApplicationIdByParentApplicationId(
        applicationId,
      );
    return this.assessmentControllerService.getAssessmentHistorySummary(
      currentApplicationId,
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
      maskTotalFamilyIncome: false,
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
      { includeDateSent: true, includeDocumentNumber: true, maskMSFAA: false },
    );
  }

  /**
   * Triggers manual reassessment for an application.
   * Application cannot be archived or in any of the statuses 'Cancelled', 'Overwritten' or 'Draft' and original assessment must be in completed status.
   * @param payload request payload.
   * @param applicationId parent application id.
   * @returns id of the assessment created.
   */
  @Roles(Role.AESTManualTriggerReassessment)
  @Post("application/:applicationId/manual-reassessment")
  @ApiNotFoundResponse({ description: "Application id not found." })
  @ApiUnprocessableEntityResponse({
    description:
      `Application original assessment expected to be '${StudentAssessmentStatus.Completed}' to allow manual reassessment or ` +
      "application cannot have manual reassessment after being archived or " +
      `application cannot have manual reassessment in any of the statuses: ${ApplicationStatus.Cancelled}, ${ApplicationStatus.Overwritten} or ${ApplicationStatus.Draft}.`,
  })
  async manualReassessment(
    @Body() payload: ManualReassessmentAPIInDTO,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const currentApplicationId =
        await this.applicationService.getApplicationIdByParentApplicationId(
          applicationId,
        );
      const manualAssessment =
        await this.studentAssessmentService.createManualReassessment(
          currentApplicationId,
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
