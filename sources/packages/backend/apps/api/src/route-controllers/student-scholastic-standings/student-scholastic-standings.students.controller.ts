import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import {
  ScholasticStandingSubmittedDetailsAPIOutDTO,
  ScholasticStandingSummaryDetailsAPIOutDTO,
} from "./models/student-scholastic-standings.dto";
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

  /**
   * Get Scholastic Standing submitted details.
   * @param scholasticStandingId scholastic standing id.
   * @returns Scholastic Standing.
   */
  @Get(":scholasticStandingId")
  @ApiNotFoundResponse({
    description: "Scholastic Standing not found.",
  })
  async getScholasticStanding(
    @Param("scholasticStandingId", ParseIntPipe) scholasticStandingId: number,
    @UserToken() studentUserToken: StudentUserToken,
  ): Promise<ScholasticStandingSubmittedDetailsAPIOutDTO> {
    return this.scholasticStandingControllerService.getScholasticStanding(
      scholasticStandingId,
      {
        studentId: studentUserToken.studentId,
      },
    );
  }
}
