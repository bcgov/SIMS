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
  StudentAppealAPIOutDTO,
  StudentAppealRequestAPIOutDTO,
  StudentAppealControllerService,
} from "..";

/**
 * Student appeal controller for institutions.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@HasStudentDataAccess("studentId", "applicationId")
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
   * @param applicationId application id.
   * @param appealId appeal id to be retrieved.
   * @returns the student appeal details.
   */
  @Get(
    "student/:studentId/application/:applicationId/appeal/:appealId/requests",
  )
  @ApiNotFoundResponse({
    description: "Not able to find the student appeal.",
  })
  async getStudentAppealWithRequests(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("appealId", ParseIntPipe) appealId: number,
  ): Promise<StudentAppealAPIOutDTO<StudentAppealRequestAPIOutDTO>> {
    return this.studentAppealControllerService.getStudentAppealWithRequests<StudentAppealRequestAPIOutDTO>(
      appealId,
      { studentId, applicationId },
    );
  }
}
