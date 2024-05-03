import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { ApiBadRequestResponse, ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  IsBCPublicInstitution,
} from "../../auth/decorators";
import { FormService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { InstitutionReportsFilterAPIInDTO } from "./models/report.dto";
import { FormNames } from "../../services/form/constants";

/**
 * Controller for Reports for Institution Client.
 * This consists of all Rest APIs for reports.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("report")
@ApiTags(`${ClientTypeBaseRoute.Institution}-report`)
export class ReportInstitutionsController extends BaseController {
  constructor(private readonly formService: FormService) {
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
  @IsBCPublicInstitution()
  @Post()
  async exportReport(
    @Body() payload: InstitutionReportsFilterAPIInDTO,
  ): Promise<void> {
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.ExportFinancialReports,
      payload,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to export report due to an invalid request.",
      );
    }
    //TODO: Build report here
  }
}
