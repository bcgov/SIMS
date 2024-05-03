import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { Response } from "express";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  IsBCPublicInstitution,
} from "../../auth/decorators";
import { FormService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { CustomNamedError } from "@sims/utilities";
import BaseController from "../BaseController";
import {
  InstitutionReportsFilterAPIInDTO,
  ReportsFilterAPIInDTO,
} from "./models/report.dto";
import { FormNames } from "../../services/form/constants";
import {
  FILTER_PARAMS_MISMATCH,
  ReportService,
  REPORT_CONFIG_NOT_FOUND,
} from "@sims/services";

/**
 * Controller for Reports for Institution Client.
 * This consists of all Rest APIs for reports.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("report")
@ApiTags(`${ClientTypeBaseRoute.Institution}-report`)
export class ReportInstitutionsController extends BaseController {
  constructor(
    private readonly reportService: ReportService,
    private readonly formService: FormService,
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
