import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApplicationService } from "../../services";
import BaseController from "../BaseController";
import { ApplicationSupplementalDataAPIOutDTO } from "./models/application.dto";
import {
  AllowAuthorizedParty,
  HasStudentDataAccess,
  IsBCPublicInstitution,
  UserToken,
} from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
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
  @Get("student/:studentId/application/:applicationId")
  async getApplication(
    @UserToken() userToken: IInstitutionUserToken,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<ApplicationSupplementalDataAPIOutDTO> {
    const application = await this.applicationService.getApplicationById(
      applicationId,
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
