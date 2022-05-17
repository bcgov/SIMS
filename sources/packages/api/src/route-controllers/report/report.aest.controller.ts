import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { ReportService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
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
   * Rest API to get notes for a student.
   * @param studentId
   * @param noteType Note type(General|Restriction|System Actions|Program) which is passed to filter the notes.
   * @returns Student Notes.
   */

  @Get()
  async getStudentDetails(): Promise<any[]> {
    return await this.reportService.getReportData();
  }
}
