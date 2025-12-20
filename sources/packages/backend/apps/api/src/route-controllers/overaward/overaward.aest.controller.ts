import {
  Controller,
  Param,
  ParseIntPipe,
  Get,
  Post,
  Body,
  NotFoundException,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { DisbursementOverawardService } from "@sims/services";
import { StudentService } from "../../services";
import {
  OverawardBalanceAPIOutDTO,
  AESTOverawardAPIOutDTO,
  OverawardManualRecordAPIInDTO,
} from "./models/overaward.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { IUserToken, Role } from "../../auth";
import { OverawardControllerService } from "..";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("overaward")
@ApiTags(`${ClientTypeBaseRoute.AEST}-overaward`)
export class OverawardAESTController extends BaseController {
  constructor(
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly studentService: StudentService,
    private readonly overawardControllerService: OverawardControllerService,
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
  @Get("student/:studentId/balance")
  async getOverawardBalance(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<OverawardBalanceAPIOutDTO> {
    const studentExist = await this.studentService.studentExists(studentId);
    if (!studentExist) {
      throw new NotFoundException("Student not found.");
    }
    return this.overawardControllerService.getOverawardBalance(studentId);
  }

  /**
   * Get all overawards which belong to a student.
   * @param studentId student.
   * @returns overaward details of a student.
   */
  @ApiNotFoundResponse({
    description: "Student not found.",
  })
  @Get("student/:studentId")
  async getOverawardsByStudent(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<AESTOverawardAPIOutDTO[]> {
    const studentExist = await this.studentService.studentExists(studentId);
    if (!studentExist) {
      throw new NotFoundException("Student not found.");
    }
    return this.overawardControllerService.getOverawardsByStudent(studentId, {
      audit: true,
    });
  }

  /**
   * Add a manual overaward for a student.
   * @param studentId student for whom overaward amount is being applied.
   * @param payload overaward payload. Overaward value can be negative or positive.
   * @returns primary identifier of the resource created.
   */
  @ApiNotFoundResponse({
    description: "Student not found.",
  })
  @Roles(Role.StudentAddOverawardManual)
  @Post("student/:studentId")
  async addManualOveraward(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Body() payload: OverawardManualRecordAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const studentExist = await this.studentService.studentExists(studentId);
    if (!studentExist) {
      throw new NotFoundException("Student not found.");
    }
    const addedManualOveraward =
      await this.disbursementOverawardService.addManualOveraward(
        payload.awardValueCode,
        payload.overawardValue,
        payload.overawardNotes,
        studentId,
        userToken.userId,
      );
    return {
      id: addedManualOveraward.id,
    };
  }
}
