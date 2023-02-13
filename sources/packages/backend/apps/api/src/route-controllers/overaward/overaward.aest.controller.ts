import { Controller, Param, ParseIntPipe, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { DisbursementOverawardService } from "@sims/services";
import {
  OverawardBalanceAPIOutDTO,
  OverawardAPIOutDTO,
} from "./models/overaward.dto";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("overaward")
@ApiTags(`${ClientTypeBaseRoute.AEST}-overaward`)
export class OverawardAESTController extends BaseController {
  constructor(
    private readonly disbursementOverawardService: DisbursementOverawardService,
  ) {
    super();
  }

  /**
   * Get the overaward balance of a student.
   * @param studentId student.
   * @returns overaward balance for student.
   */
  @Get("student/:studentId/balance")
  async getOverawardBalance(
    @Param("studentId", ParseIntPipe)
    studentId: number,
  ): Promise<OverawardBalanceAPIOutDTO> {
    const overawardBalance =
      await this.disbursementOverawardService.getOverawardBalance([studentId]);

    return { overawardBalanceValues: overawardBalance[studentId] };
  }

  /**
   * Get all overawards which belong to a student.
   * @param studentId student.
   * @returns overaward details of a student.
   */
  @Get("student/:studentId")
  async getOverawardsByStudent(
    studentId: number,
  ): Promise<OverawardAPIOutDTO[]> {
    const studentOverawards =
      await this.disbursementOverawardService.getOverawardsByStudent(studentId);
    return studentOverawards.map((overaward) => ({
      dateAdded: overaward.createdAt,
      overawardOrigin: overaward.originType,
      awardValueCode: overaward.disbursementValueCode,
      overawardValue: overaward.overawardValue,
      addedByUserFirstName: overaward.creator.firstName,
      addedByUserLastName: overaward.creator.lastName,
      applicationNumber:
        overaward.studentAssessment?.application.applicationNumber,
      assessmentTriggerType: overaward.studentAssessment?.triggerType,
    }));
  }
}
