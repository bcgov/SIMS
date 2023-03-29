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
  StudentsOverawardAPIOutDTO,
} from "./models/overaward.dto";
import { OverawardControllerService } from "..";
import { StudentUserToken } from "../../auth";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("overaward")
@ApiTags(`${ClientTypeBaseRoute.Student}-overaward`)
export class OverawardStudentsController extends BaseController {
  constructor(
    private readonly overawardControllerService: OverawardControllerService,
  ) {
    super();
  }

  /**
   * Get the overaward balance of a student.
   * @returns overaward balance for student.
   */
  @Get("balance")
  async getOverawardBalance(
    @UserToken() userToken: StudentUserToken,
  ): Promise<OverawardBalanceAPIOutDTO> {
    return this.overawardControllerService.getOverawardBalance(
      userToken.studentId,
    );
  }

  /**
   * Get all overawards which belong to a student.
   * @returns overaward details of a student.
   */
  @Get()
  async getOverawardsByStudent(
    @UserToken() userToken: StudentUserToken,
  ): Promise<StudentsOverawardAPIOutDTO[]> {
    return this.overawardControllerService.getOverawardsByStudent(
      userToken.studentId,
    );
  }
}
