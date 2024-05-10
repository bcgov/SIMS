import { Body, Controller, Post, Res } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  IsBCPublicInstitution,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { InstitutionReportsFilterAPIInDTO } from "./models/report.dto";
import { Response } from "express";
import { ReportControllerService } from "./report.controller.service";
import { IInstitutionUserToken } from "../../auth";

/**
 * Controller for Reports for Institution Client.
 * This consists of all Rest APIs for reports.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@IsInstitutionAdmin()
@Controller("report")
@ApiTags(`${ClientTypeBaseRoute.Institution}-report`)
export class ReportInstitutionsController extends BaseController {
  constructor(
    private readonly reportControllerService: ReportControllerService,
  ) {
    super();
  }

  /**
   * Rest API to export reports in csv format.
   * @param payload report filter payload.
   * @param userToken institution user token.
   * @param response http response as file.
   */
  @ApiBadRequestResponse({
    description: "Not able to export report due to an invalid request.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Either report config missing or filter parameters not matching the report config.",
  })
  @Post()
  async exportReport(
    @Body() payload: InstitutionReportsFilterAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
    @Res() response: Response,
  ): Promise<void> {
    await this.reportControllerService.generateReport(payload, response, {
      institutionId: userToken.authorizations.institutionId,
    });
  }
}
