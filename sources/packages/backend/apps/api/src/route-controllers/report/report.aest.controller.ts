import { Body, Controller, Post, Res } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, Roles } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { ReportControllerService } from "./report.controller.service";
import { Role } from "../../auth";
import {
  MinistryReportNames,
  MinistryReportsFilterAPIInDTO,
} from "./models/report.dto";
import { Response } from "express";

/**
 * Controller for Reports for AEST Client.
 * This consists of all Rest APIs for reports.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("report")
@ApiTags(`${ClientTypeBaseRoute.AEST}-report`)
export class ReportAESTController extends BaseController {
  constructor(
    private readonly reportControllerService: ReportControllerService,
  ) {
    super();
  }

  /**
   * Rest API to export reports in csv format.
   * @param payload report filter payload.
   * @param response http response as file.
   */
  @ApiBadRequestResponse({
    description: "Not able to export report due to an invalid request.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Either report config missing or filter parameters not matching the report config.",
  })
  @Roles(Role.AESTReports)
  @Post()
  async exportReport(
    @Body() payload: MinistryReportsFilterAPIInDTO,
    @Res() response: Response,
  ): Promise<void> {
    if (
      payload.reportName === MinistryReportNames.StudentUnmetNeed &&
      payload.params["institutionId"] === ""
    ) {
      payload.params["institutionId"] = -1;
    }
    await this.reportControllerService.generateReport(payload, response);
  }
}
