import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import {
  AllowAuthorizedParty,
  IsBCPublicInstitution,
  HasStudentDataAccess,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ApplicationExceptionAPIOutDTO } from "./models/application-exception.dto";
import { ApplicationExceptionControllerService } from "./application-exception.controller.service";

/**
 * Application exception controller for institutions.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("application-exception")
@IsBCPublicInstitution()
@HasStudentDataAccess("studentId")
@ApiTags(`${ClientTypeBaseRoute.Institution}-application-exception`)
export class ApplicationExceptionInstitutionsController extends BaseController {
  constructor(
    private readonly applicationExceptionControllerService: ApplicationExceptionControllerService,
  ) {
    super();
  }

  /**
   * Get a student application exception of a student.
   * @param studentId student id.
   * @param exceptionId exception to be retrieved.
   * @returns student application exception information.
   */
  @Get("student/:studentId/exception/:exceptionId")
  @ApiNotFoundResponse({
    description: "Student application exception not found.",
  })
  async getException(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("exceptionId", ParseIntPipe) exceptionId: number,
  ): Promise<ApplicationExceptionAPIOutDTO> {
    return this.applicationExceptionControllerService.getExceptionDetails<ApplicationExceptionAPIOutDTO>(
      exceptionId,
      { studentId },
    );
  }
}
