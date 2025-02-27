import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresUserAccount,
} from "../../auth/decorators";
import BaseController from "../BaseController";
import { StudentInformationService } from "../../services";
import {
  StudentSearchAPIInDTO,
  StudentSearchResultAPIOutDTO,
} from "./models/student-external-search.dto";
import { StudentExternalControllerService } from "./student.external.controller.service";

/**
 * Student controller for external client.
 */
@RequiresUserAccount(false)
@AllowAuthorizedParty(AuthorizedParties.external)
@Controller("student")
@ApiTags(`${ClientTypeBaseRoute.External}-student`)
export class StudentExternalController extends BaseController {
  constructor(
    private readonly studentInformationService: StudentInformationService,
    private readonly studentExternalControllerService: StudentExternalControllerService,
  ) {
    super();
  }

  /**
   * Searches for student details.
   * This request method is POST to avoid passing sensitive data in the URL.
   * @param payload payload with SIN to retrieve the student details.
   * @returns student details.
   */
  @Post()
  @ApiNotFoundResponse({ description: "Student not found." })
  @HttpCode(HttpStatus.OK)
  async searchStudentDetails(
    @Body() payload: StudentSearchAPIInDTO,
  ): Promise<StudentSearchResultAPIOutDTO> {
    const studentPromise =
      this.studentInformationService.getStudentAndApplicationsBySIN(
        payload.sin,
      );
    const sfasIndividualPromise =
      await this.studentInformationService.getSFASIndividualBySIN(payload.sin);
    const [student, sfasIndividual] = await Promise.all([
      studentPromise,
      sfasIndividualPromise,
    ]);
    if (!student && !sfasIndividual) {
      throw new NotFoundException("Student not found.");
    }
    return this.studentExternalControllerService.getStudentSearchResult(
      student,
      sfasIndividual,
    );
  }
}
