import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import {
  APPLICATION_NOT_FOUND,
  ASSESSMENT_ALREADY_IN_PROGRESS,
  FormService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  StudentAssessmentService,
  StudentScholasticStandingsService,
} from "../../services";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { CustomNamedError } from "../../utilities";
import BaseController from "../BaseController";
import { FormNames } from "../../services/form/constants";
import { APPLICATION_CHANGE_NOT_ELIGIBLE } from "../../constants";
import {
  ScholasticStandingAPIInDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
} from "./models/student-scholastic-standings.dto";
import { ScholasticStandingControllerService } from "./student-scholastic-standings.controller.service";

/**
 * Scholastic standing controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("scholastic-standing")
@ApiTags(`${ClientTypeBaseRoute.Institution}-scholastic-standing`)
export class ScholasticStandingInstitutionsController extends BaseController {
  constructor(
    private readonly formService: FormService,
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly scholasticStandingControllerService: ScholasticStandingControllerService,
  ) {
    super();
  }

  /**
   * Save scholastic standing and create new assessment.
   * @param locationId location id to check whether the requested user and the requested application has the permission to this location.
   * @param applicationId application id.
   * @UserToken institution user token
   * @param payload Scholastic Standing payload.
   */
  @ApiBadRequestResponse({ description: "Invalid form data." })
  @ApiUnprocessableEntityResponse({
    description:
      "Application not found or invalid application or invalid" +
      " application status or another assessment already in progress.",
  })
  @HasLocationAccess("locationId")
  @Post("location/:locationId/application/:applicationId")
  async saveScholasticStanding(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Body() payload: ScholasticStandingAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    try {
      const submissionResult = await this.formService.dryRunSubmission(
        FormNames.ReportScholasticStandingChange,
        payload.data,
      );

      if (!submissionResult.valid) {
        throw new BadRequestException("Invalid submission.");
      }
      const scholasticStanding =
        await this.studentScholasticStandingsService.processScholasticStanding(
          locationId,
          applicationId,
          userToken.userId,
          submissionResult.data.data,
        );

      // Start assessment.
      if (scholasticStanding.studentAssessment) {
        await this.studentAssessmentService.startAssessment(
          scholasticStanding.studentAssessment.id,
        );
      }
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_NOT_FOUND:
          case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
          case ASSESSMENT_ALREADY_IN_PROGRESS:
          case APPLICATION_CHANGE_NOT_ELIGIBLE:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
          default:
            throw error;
        }
      }
      throw error;
    }
  }

  /**
   * Get Scholastic Standing submitted details.
   * @param locationId location id to check whether the requested user and the requested application has the permission to this location.
   * @param scholasticStandingId scholastic standing id.
   * @returns Scholastic Standing.
   */
  @HasLocationAccess("locationId")
  @Get(":scholasticStandingId/location/:locationId")
  @ApiNotFoundResponse({
    description: "Scholastic Standing not found.",
  })
  async getScholasticStanding(
    @Param("scholasticStandingId", ParseIntPipe) scholasticStandingId: number,
    @Param("locationId", ParseIntPipe) locationId: number,
  ): Promise<ScholasticStandingSubmittedDetailsAPIOutDTO> {
    return this.scholasticStandingControllerService.getScholasticStanding(
      scholasticStandingId,
      locationId,
    );
  }
}
