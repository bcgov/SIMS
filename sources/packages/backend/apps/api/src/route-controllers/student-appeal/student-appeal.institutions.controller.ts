import { Controller, Param, Get, ParseIntPipe } from "@nestjs/common";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { DetailedStudentAppealAPIOutDTO } from "./models/student-appeal.dto";
import { StudentAppealControllerService } from "./student-appeal.controller.service";

/**
 * Student appeal controller for institutions.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
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
   * @param appealId appeal id to be retrieved.
   * @param studentId student id.
   * @returns the student appeal details.
   */
  @Get("student/:studentId/appeal/:appealId/requests")
  @ApiNotFoundResponse({
    description: "Not able to find the student appeal.",
  })
  async getStudentAppealWithRequest(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("appealId", ParseIntPipe) appealId: number,
  ): Promise<DetailedStudentAppealAPIOutDTO> {
    return this.studentAppealControllerService.getStudentAppealWithRequest(
      appealId,
      studentId,
      {assessDetails: true}
    );
  }
}
