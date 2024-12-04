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
import { StudentService } from "@sims/integrations/services";
import {
  ExternalSearchStudentAPIInDTO,
  StudentDetailsAPIOutDTO,
} from "./models/student.dto";

/**
 * Student controller for external client.
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
   * Searches for student details.
   * This request method is POST to avoid passing sensitive data in the URL.
   * @param payload payload with SIN to retrieve the student details.
   * @returns student details.
   */
  @Post()
  @ApiNotFoundResponse({ description: "Student not found." })
  @HttpCode(HttpStatus.OK)
  async searchStudentDetails(
    @Body() payload: ExternalSearchStudentAPIInDTO,
  ): Promise<StudentDetailsAPIOutDTO> {
    const student = await this.studentService.getStudentBySIN(payload.sin);
    if (!student) {
      throw new NotFoundException("Student not found.");
    }
    return {
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      sin: student.sinValidation.sin,
      dateOfBirth: student.birthDate,
      address: {
        addressLine1: student.contactInfo.address.addressLine1,
        addressLine2: student.contactInfo.address.addressLine2,
        city: student.contactInfo.address.city,
        provinceState: student.contactInfo.address.provinceState,
        country: student.contactInfo.address.country,
        postalCode: student.contactInfo.address.postalCode,
      },
      applicationNumbers: student.applications.map((a) => a.applicationNumber),
    };
  }
}
