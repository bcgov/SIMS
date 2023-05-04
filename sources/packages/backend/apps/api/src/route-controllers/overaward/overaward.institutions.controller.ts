import { Controller, Param, ParseIntPipe, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  OverawardBalanceAPIOutDTO,
  StudentsOverawardAPIOutDTO,
} from "./models/overaward.dto";
import { OverawardControllerService } from "..";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("overaward")
@ApiTags(`${ClientTypeBaseRoute.Institution}-overaward`)
export class OverawardInstitutionsController extends BaseController {
  constructor(
    private readonly overawardControllerService: OverawardControllerService,
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
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<OverawardBalanceAPIOutDTO> {
    return this.overawardControllerService.getOverawardBalance(studentId);
  }

  /**
   * Get all overawards which belong to a student.
   * @param studentId student.
   * @returns overaward details of a student.
   */
  @Get("student/:studentId")
  async getOverawardsByStudent(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<StudentsOverawardAPIOutDTO[]> {
    return this.overawardControllerService.getOverawardsByStudent(studentId);
  }
}
