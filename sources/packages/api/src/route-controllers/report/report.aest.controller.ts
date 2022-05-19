import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { ReportService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { ReportsFilterAPIInDTO } from "./models/report.dto";
import BaseController from "../BaseController";
/**
 * Controller for Reports for AEST Client.
 * This consists of all Rest APIs for notes.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("reports")
@ApiTags(`${ClientTypeBaseRoute.AEST}-reports`)
export class ReportAESTController extends BaseController {
  constructor(private readonly reportService: ReportService) {
    super();
  }

  /**
   * Rest API to financial reports in csv format.
   * @param studentId
   * @param noteType Note type(General|Restriction|System Actions|Program) which is passed to filter the notes.
   * @returns Student Notes.
   */

  @Post()
  async exportFinancialReport(
    @Body() payload: ReportsFilterAPIInDTO,
  ): Promise<any[]> {
    const result = await this.reportService.exportFinancialReport(payload);
    return result;
  }
}
