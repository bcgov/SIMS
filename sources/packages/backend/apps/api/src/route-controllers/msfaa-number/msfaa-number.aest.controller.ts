import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { StudentService } from "../../services";
import { MSFAANumberService } from "../../services/msfaa-number/msfaa-number.service";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { MSFAANumberAPIOutDTO } from "./models/msfaa-number.dto";

/**
 * MSFAA number controller for AEST Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("msfaa-number")
@ApiTags(`${ClientTypeBaseRoute.AEST}-msfaa-number`)
export class MSFAANumberAESTController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly msfaaNumberService: MSFAANumberService,
  ) {
    super();
  }

  /**
   * Gets the full MSFAA activity for a student, ordered by date created newest to oldest.
   * @param studentId student id to retrieve MSFAA records.
   * @returns list of MSFAA activity records for the student.
   */
  @ApiNotFoundResponse({ description: "Student not found." })
  @Get("student/:studentId")
  async getStudentMSFAAActivity(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<MSFAANumberAPIOutDTO[]> {
    const studentExists = await this.studentService.studentExists(studentId);
    if (!studentExists) {
      throw new NotFoundException("Student not found.");
    }
    const msfaaActivity =
      await this.msfaaNumberService.getStudentMSFAAActivity(studentId);
    return msfaaActivity.map((msfaa) => ({
      createdAt: msfaa.createdAt,
      offeringIntensity: msfaa.offeringIntensity,
      msfaaNumber: msfaa.msfaaNumber,
      dateSent: msfaa.dateRequested,
      dateSigned: msfaa.dateSigned,
      cancelledDate: msfaa.cancelledDate,
      newIssuingProvince: msfaa.newIssuingProvince,
    }));
  }
}
