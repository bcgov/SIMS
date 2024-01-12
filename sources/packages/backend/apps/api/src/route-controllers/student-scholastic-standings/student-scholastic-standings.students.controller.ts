import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { ScholasticStandingSummaryDetailsAPIOutDTO } from "./models/student-scholastic-standings.dto";
import { ScholasticStandingControllerService } from "..";
import { StudentUserToken } from "../../auth";

/**
 * Scholastic standing controller for students Client.
 */
@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("scholastic-standing")
@ApiTags(`${ClientTypeBaseRoute.Student}-scholastic-standing`)
export class ScholasticStandingStudentsController extends BaseController {
  constructor(
    private readonly scholasticStandingControllerService: ScholasticStandingControllerService,
  ) {
    super();
  }

  /**
   * Get Scholastic Standing summary details.
   * @param studentToken token from the authenticated student.
   * @returns Scholastic Standing Summary details.
   */
  @Get("summary")
  async getScholasticStandingSummary(
    @UserToken() studentUserToken: StudentUserToken,
  ): Promise<ScholasticStandingSummaryDetailsAPIOutDTO> {
    return this.scholasticStandingControllerService.getScholasticStandingSummary(
      studentUserToken.studentId,
    );
  }
}
