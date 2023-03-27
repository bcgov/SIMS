import { Controller, Get } from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  OverawardBalanceAPIOutDTO,
  StudentOverawardAPIOutDTO,
} from "./models/overaward.dto";
import { OverAwardControllerService } from "./overaward.controller.service";
import { StudentUserToken } from "../../auth";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("overaward")
@ApiTags(`${ClientTypeBaseRoute.Student}-overaward`)
export class OverawardStudentsController extends BaseController {
  constructor(
    private readonly overawardControllerService: OverAwardControllerService,
  ) {
    super();
  }

  /**
   * Get the overaward balance of a student.
   * @param studentId student.
   * @returns overaward balance for student.
   */
  @ApiNotFoundResponse({
    description: "Student not found.",
  })
  @Get("student/balance")
  async getOverawardBalance(
    @UserToken() userToken: StudentUserToken,
  ): Promise<OverawardBalanceAPIOutDTO> {
    return await this.overawardControllerService.getOverawardBalance(
      userToken.studentId,
    );
  }

  /**
   * Get all overawards which belong to a student.
   * @param studentId student.
   * @returns overaward details of a student.
   */
  @ApiNotFoundResponse({
    description: "Student not found.",
  })
  @Get("student")
  async getOverawardsByStudent(
    @UserToken() userToken: StudentUserToken,
  ): Promise<StudentOverawardAPIOutDTO[]> {
    const studentOverawards =
      await this.overawardControllerService.getOverawardsByStudent(
        userToken.studentId,
      );
    return studentOverawards.map((overaward) => ({
      dateAdded: overaward.addedDate,
      overawardOrigin: overaward.originType,
      awardValueCode: overaward.disbursementValueCode,
      overawardValue: overaward.overawardValue,
      applicationNumber:
        overaward.studentAssessment?.application.applicationNumber,
      assessmentTriggerType: overaward.studentAssessment?.triggerType,
    }));
  }
}
