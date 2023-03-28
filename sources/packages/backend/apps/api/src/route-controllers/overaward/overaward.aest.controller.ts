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
  OverawardAPIOutDTO,
  OverawardManualRecordAPIInDTO,
} from "./models/overaward.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { IUserToken, Role } from "../../auth";
import { OverAwardControllerService } from "./overaward.controller.service";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("overaward")
@ApiTags(`${ClientTypeBaseRoute.AEST}-overaward`)
export class OverawardAESTController extends BaseController {
  constructor(
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly studentService: StudentService,
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
  @Get("student/:studentId/balance")
  async getOverawardBalance(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<OverawardBalanceAPIOutDTO> {
    const studentExist = await this.studentService.studentExists(studentId);
    if (!studentExist) {
      throw new NotFoundException("Student not found.");
    }
    return await this.overawardControllerService.getOverawardBalance(studentId);
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
  ): Promise<OverawardAPIOutDTO[]> {
    const studentExist = await this.studentService.studentExists(studentId);
    if (!studentExist) {
      throw new NotFoundException("Student not found.");
    }
    return await this.overawardControllerService.getOverawardsByStudent(
      studentId,
      true,
    );
  }

  /**
   * Add a manual overaward deduction for a student.
   * @param studentId student for whom overaward deduction is being added.
   * @param payload overaward deduction payload.
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
    const addedOverawardDeduction =
      await this.disbursementOverawardService.addManualOveraward(
        payload.awardValueCode,
        payload.overawardValue,
        payload.overawardNotes,
        studentId,
        userToken.userId,
      );
    return {
      id: addedOverawardDeduction.id,
    };
  }
}
