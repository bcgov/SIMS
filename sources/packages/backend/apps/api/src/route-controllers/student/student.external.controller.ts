import { Body, Controller, Post } from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresUserAccount,
} from "../../auth/decorators";
import BaseController from "../BaseController";
import { StudentService } from "@sims/integrations/services";
import {
  ExternalSearchStudentAPIInDTO,
  StudentDetailsAPIOutDTO,
} from "apps/api/src/route-controllers/student/models/student.dto";

/**
 * Student controller for External Client.
 */
@RequiresUserAccount(false)
@AllowAuthorizedParty(AuthorizedParties.external)
@Controller("student")
@ApiTags(`${ClientTypeBaseRoute.External}-student`)
export class StudentExternalController extends BaseController {
  constructor(private readonly studentService: StudentService) {
    super();
  }

  /**
   * Get student student details.
   * @param payload payload with sin to retrieve the student details.
   * @returns student details.
   */
  @Post()
  @ApiNotFoundResponse({ description: "Student not found." })
  async getStudentProfile(
    @Body() payload: ExternalSearchStudentAPIInDTO,
  ): Promise<StudentDetailsAPIOutDTO> {
    const student = await this.studentService.getStudentBySIN(payload.sin);
    if (!student) {
      throw new Error("Student not found.");
    }
    return {
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      sin: student.sinValidation.sin,
      dateOfBirth: student.birthDate,
      address: student.contactInfo.address,
      applicationNumbers: student.applications.map((a) => a.applicationNumber),
    };
  }
}
