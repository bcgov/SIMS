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
import { AllowAuthorizedParty, Groups, Roles } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { FormService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { CustomNamedError } from "@sims/utilities";
import BaseController from "../BaseController";
import { MinistryReportsFilterAPIInDTO } from "./models/report.dto";
import { FormNames } from "../../services/form/constants";
import { Role } from "../../auth/roles.enum";
import {
  FILTER_PARAMS_MISMATCH,
  ReportService,
  REPORT_CONFIG_NOT_FOUND,
} from "@sims/services";
import { ReportControllerService } from "./report.controller.service";

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
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.ExportFinancialReports,
      payload,
    );

    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to export report due to an invalid request.",
      );
    }

    try {
      const reportData = await this.reportService.getReportDataAsCSV(
        submissionResult.data.data,
      );
      this.reportControllerService.streamFile(
        response,
        payload.reportName,
        reportData,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case REPORT_CONFIG_NOT_FOUND:
          case FILTER_PARAMS_MISMATCH:
            throw new UnprocessableEntityException(error.message);
          default:
            throw error;
        }
      }
      throw error;
    }
  }
}
