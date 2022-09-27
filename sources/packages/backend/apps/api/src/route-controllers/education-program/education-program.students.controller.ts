import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
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
import { OptionItemAPIOutDTO } from "../models/common.dto";

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
    @Param("programId", ParseIntPipe) programId: number,
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

  /**
   * Get a key/value pair list of all programs that have at least one offering for the particular location.
   * Executes the students-based authorization (students must have access to all programs).
   * @param locationId location id.
   * @param programYearId program year that the program belongs to.
   * @param isIncludeInActiveProgramYear if true, only programs associate with active
   * program years are considered.
   * @returns key/value pair list of programs.
   */
  @Get("location/:locationId/program-year/:programYearId/options-list")
  async getLocationProgramsOptionList(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programYearId", ParseIntPipe) programYearId: number,
    @Query(
      "isIncludeInActiveProgramYear",
      new DefaultValuePipe(false),
      ParseBoolPipe,
    )
    isIncludeInActiveProgramYear,
  ): Promise<OptionItemAPIOutDTO[]> {
    const programs = await this.programService.getProgramsForLocation(
      locationId,
      programYearId,
      isIncludeInActiveProgramYear,
    );

    return programs.map((program) => ({
      id: program.id,
      description: program.name,
    }));
  }
}
