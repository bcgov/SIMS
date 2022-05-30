import { Controller, Get, Param } from "@nestjs/common";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
} from "../../auth/decorators";
import { EducationProgramService } from "../../services";
import { StudentEducationProgramAPIOutDTO } from "./models/education-program.dto";
import { ClientTypeBaseRoute } from "../../types";
import { credentialTypeToDisplay, deliveryMethod } from "../../utilities";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("education-program")
@ApiTags(`${ClientTypeBaseRoute.Student}-education-program`)
export class EducationProgramStudentsController extends BaseController {
  constructor(private readonly programService: EducationProgramService) {
    super();
  }

  /**
   * Returns the education program for a student.
   * @param programId program id to be returned.
   * @returns education program for a student.
   */
  @Get(":programId")
  async getStudentEducationProgram(
    @Param("programId") programId: number,
  ): Promise<StudentEducationProgramAPIOutDTO> {
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
}
