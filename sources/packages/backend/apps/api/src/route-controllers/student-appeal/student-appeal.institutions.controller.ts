import { Controller, Param, Get, ParseIntPipe } from "@nestjs/common";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  IsBCPublicInstitution,
  HasStudentDataAccess,
} from "../../auth/decorators";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import {
  DetailedStudentAppealRequestAPIOutDTO,
  StudentAppealAPIOutDTO,
} from "./models/student-appeal.dto";
import { StudentAppealControllerService } from "..";

/**
 * Student appeal controller for institutions.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@HasStudentDataAccess("studentId")
@Controller("appeal")
@ApiTags(`${ClientTypeBaseRoute.Institution}-appeal`)
export class StudentAppealInstitutionsController extends BaseController {
  constructor(
    private readonly studentAppealControllerService: StudentAppealControllerService,
  ) {
    super();
  }

  /**
   * Get the student appeal details.
   * @param studentId student id.
   * @param appealId appeal id to be retrieved.
   * @returns the student appeal details.
   */
  @Get("student/:studentId/appeal/:appealId/requests")
  @ApiNotFoundResponse({
    description: "Not able to find the student appeal.",
  })
  async getStudentAppealWithRequest(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("appealId", ParseIntPipe) appealId: number,
  ): Promise<StudentAppealAPIOutDTO<DetailedStudentAppealRequestAPIOutDTO>> {
    return this.studentAppealControllerService.getStudentAppealWithRequest<DetailedStudentAppealRequestAPIOutDTO>(
      appealId,
      { assessDetails: true, studentId: studentId },
    );
  }
}
