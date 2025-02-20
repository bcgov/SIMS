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
  ExternalSearchStudentAPIInDTO,
  StudentAndApplicationDetailsAPIOutDTO,
} from "./models/student.dto";
import { Student } from "@sims/sims-db";

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
    @Body() payload: ExternalSearchStudentAPIInDTO,
  ): Promise<StudentAndApplicationDetailsAPIOutDTO> {
    const studentPromise = this.studentInformationService.getStudentBySIN(
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
    return this.transformStudentDetails(student);
  }

  /**
   * Transform to student and application details format.
   * @param student
   * @returns
   */
  private transformStudentDetails(
    student: Student,
  ): StudentAndApplicationDetailsAPIOutDTO {
    return {
      givenNames: student.user.firstName,
      lastName: student.user.lastName,
      sin: student.sinValidation.sin,
      dateOfBirth: student.birthDate,
      phoneNumber: student.contactInfo.phone,
      address: {
        addressLine1: student.contactInfo.address.addressLine1,
        addressLine2: student.contactInfo.address.addressLine2,
        city: student.contactInfo.address.city,
        provinceState: student.contactInfo.address.provinceState,
        country: student.contactInfo.address.country,
        postalCode: student.contactInfo.address.postalCode,
      },
      applications: [],
    };
  }
}
