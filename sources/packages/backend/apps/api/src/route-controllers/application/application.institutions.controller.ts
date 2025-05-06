import {
  Controller,
  DefaultValuePipe,
  Get,
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
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
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
   * @param isParentApplication flag for if the application is a parent application.
   * @returns Application details.
   */
  @HasStudentDataAccess("studentId")
  @ApiNotFoundResponse({
    description: `Current application for provided parent application not found.`,
  })
  @ApiUnprocessableEntityResponse({
    description: "Dynamic form configuration not found.",
  })
  @Get("student/:studentId/application/:applicationId")
  async getApplication(
    @UserToken() userToken: IInstitutionUserToken,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("studentId", ParseIntPipe) studentId: number,
    @Query("isParentApplication", new DefaultValuePipe(false), ParseBoolPipe)
    isParentApplication: boolean,
    @Query("loadDynamicData", new DefaultValuePipe(true), ParseBoolPipe)
    loadDynamicData: boolean,
  ): Promise<ApplicationSupplementalDataAPIOutDTO> {
    // When the application is a parent application, get the current application by parent application id.
    // Otherwise, set the current application id to the provided application id.
    const currentApplicationId =
      await this.applicationControllerService.getCurrentApplicationId(
        applicationId,
        isParentApplication,
      );
    const application = await this.applicationService.getApplicationById(
      currentApplicationId,
      {
        loadDynamicData,
        studentId: studentId,
        institutionId: userToken.authorizations.institutionId,
      },
    );
    if (loadDynamicData) {
      application.data =
        await this.applicationControllerService.generateApplicationFormData(
          application.data,
        );
    }
    return this.applicationControllerService.transformToApplicationDTO(
      application,
    );
  }
}
