import {
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { ApplicationService } from "../../services";
import BaseController from "../BaseController";
import { ApplicationSupplementalDataAPIOutDTO } from "./models/application.dto";
import {
  AllowAuthorizedParty,
  HasStudentDataAccess,
  IsBCPublicInstitution,
  UserToken,
} from "../../auth/decorators";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { ApplicationControllerService } from "./application.controller.service";
import { AuthorizedParties, IInstitutionUserToken } from "../../auth";

@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.Institution}-application`)
export class ApplicationInstitutionsController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly applicationControllerService: ApplicationControllerService,
  ) {
    super();
  }

  /**
   * API to fetch application details by applicationId.
   * This API will be used by institution users.
   * @param applicationId for the application.
   * @param studentId for the student.
   * @returns Application details.
   */
  @HasStudentDataAccess("studentId")
  @ApiNotFoundResponse({
    description: `Current application for provided parent application not found.`,
  })
  @Get("student/:studentId/application/:applicationId")
  async getApplication(
    @UserToken() userToken: IInstitutionUserToken,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("studentId", ParseIntPipe) studentId: number,
    @Query("isParentApplication", new DefaultValuePipe(true), ParseBoolPipe)
    isParentApplication: boolean,
  ): Promise<ApplicationSupplementalDataAPIOutDTO> {
    let currentApplicationId: number;
    if (isParentApplication) {
      currentApplicationId =
        await this.applicationService.getApplicationIdByParentApplicationId(
          applicationId,
        );
      if (!currentApplicationId) {
        throw new NotFoundException(
          `Current application for application ${applicationId} was not found.`,
        );
      }
    }
    const application = await this.applicationService.getApplicationById(
      currentApplicationId,
      {
        loadDynamicData: true,
        studentId: studentId,
        institutionId: userToken.authorizations.institutionId,
      },
    );
    application.data =
      await this.applicationControllerService.generateApplicationFormData(
        application.data,
      );
    return this.applicationControllerService.transformToApplicationDTO(
      application,
    );
  }
}
