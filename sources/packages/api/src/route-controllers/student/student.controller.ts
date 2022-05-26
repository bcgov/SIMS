import { Controller, Get, Param } from "@nestjs/common";
import {
  EducationProgramService,
  StudentRestrictionService,
} from "../../services";
import {
  StudentEducationProgramDto,
  StudentRestrictionDTO,
} from "./models/student.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { deliveryMethod, credentialTypeToDisplay } from "../../utilities";
import { ApiTags } from "@nestjs/swagger";

@Controller("students")
@ApiTags("students")
export class StudentController extends BaseController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {
    super();
  }

  /**
   * This returns only a part of the EducationProgram details for the student
   * @param programId
   * @returns StudentEducationProgramDto
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("/education-program/:programId")
  async getStudentEducationProgram(
    @Param("programId") programId: number,
  ): Promise<StudentEducationProgramDto> {
    const educationProgram =
      await this.programService.getStudentEducationProgram(programId);
    return {
      id: educationProgram.id,
      name: educationProgram.name,
      description: educationProgram.description,
      credentialType: educationProgram.credentialType,
      credentialTypeToDisplay: credentialTypeToDisplay(
        educationProgram.credentialType,
      ),
      deliveryMethod: deliveryMethod(
        educationProgram.deliveredOnline,
        educationProgram.deliveredOnSite,
      ),
    };
  }

  /**
   * GET API which returns student restriction details.
   * @param userToken
   * @returns Student Restriction
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("restriction")
  async getStudentRestrictions(
    @UserToken() userToken: IUserToken,
  ): Promise<StudentRestrictionDTO> {
    const studentRestrictionStatus =
      await this.studentRestrictionService.getStudentRestrictionsByUserId(
        userToken.userId,
      );
    return {
      hasRestriction: studentRestrictionStatus.hasRestriction,
      hasFederalRestriction: studentRestrictionStatus.hasFederalRestriction,
      hasProvincialRestriction:
        studentRestrictionStatus.hasProvincialRestriction,
      restrictionMessage: studentRestrictionStatus.restrictionMessage,
    } as StudentRestrictionDTO;
  }
}
