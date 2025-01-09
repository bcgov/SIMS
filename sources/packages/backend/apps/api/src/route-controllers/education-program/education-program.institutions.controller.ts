import {
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import { EducationProgramsSummary } from "../../services/education-program/education-program.service.models";
import {
  EducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
} from "./models/education-program.dto";
import { ClientTypeBaseRoute } from "../../types";
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  EducationProgramService,
  InstitutionUserAuthorizations,
} from "../../services";
import {
  PaginatedResultsAPIOutDTO,
  ProgramsPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { EducationProgramControllerService } from "..";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { InstitutionUserTypes } from "@sims/sims-db";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("education-program")
@ApiTags(`${ClientTypeBaseRoute.Institution}-education-program`)
export class EducationProgramInstitutionsController extends BaseController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly educationProgramControllerService: EducationProgramControllerService,
  ) {
    super();
  }

  /**
   * Get programs for a particular location with pagination.
   * @param locationId id of the location.
   * @param paginationOptions pagination options.
   * @returns paginated programs summary.
   */
  @HasLocationAccess("locationId")
  @Get("location/:locationId/summary")
  async getProgramsSummaryByLocationId(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Query() paginationOptions: ProgramsPaginationOptionsAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummary>> {
    return this.educationProgramControllerService.getProgramsSummary(
      userToken.authorizations.institutionId,
      paginationOptions,
      locationId,
    );
  }

  /**
   * Creates a new education program.
   * @param payload information to create the new program.
   * @returns id of the created program.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to a save the program due to an invalid request or " +
      "duplicate SABC code.",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to create or modify a program.",
  })
  @Post()
  async createEducationProgram(
    @Body() payload: EducationProgramAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    this.checkAuthorization(userToken.authorizations);
    const newProgram = await this.educationProgramControllerService.saveProgram(
      payload,
      userToken.authorizations.institutionId,
      userToken.userId,
    );
    return { id: newProgram.id };
  }

  /**
   * Updates the main information for an existing education program.
   * @param programId program to be updated.
   * @param payload information to be updated.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to a save the program due to an invalid request or " +
      "SABC code is duplicated or " +
      "program is inactive.",
  })
  @ApiNotFoundResponse({
    description: "Not able to find the education program.",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to create or modify a program.",
  })
  @Patch(":programId")
  async updateEducationProgram(
    @Param("programId", ParseIntPipe) programId: number,
    @Body() payload: EducationProgramAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    this.checkAuthorization(userToken.authorizations);
    await this.educationProgramControllerService.saveProgram(
      payload,
      userToken.authorizations.institutionId,
      userToken.userId,
      programId,
    );
  }

  /**
   * Allows a program to be deactivated.
   * @param programId program to be deactivated.
   */
  @ApiNotFoundResponse({
    description: "Not able to find the education program.",
  })
  @ApiUnprocessableEntityResponse({
    description: "The education program is already set as requested.",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to create or modify a program.",
  })
  @Patch(":programId/deactivate")
  async deactivateProgram(
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    this.checkAuthorization(userToken.authorizations);
    await this.educationProgramControllerService.deactivateProgram(
      programId,
      userToken.userId,
      { institutionId: userToken.authorizations.institutionId },
    );
  }

  /**
   * Get a key/value pair list of all approved programs.
   * @param isIncludeInActiveProgram if true, only education programs with active
   * are considered else both active and inactive programs are considered.
   * @returns key/value pair list of all approved programs.
   */
  @Get("programs-list")
  async getProgramsListForInstitutions(
    @UserToken() userToken: IInstitutionUserToken,
    @Query(
      "isIncludeInActiveProgram",
      new DefaultValuePipe(false),
      ParseBoolPipe,
    )
    isIncludeInActiveProgram: boolean,
  ): Promise<OptionItemAPIOutDTO[]> {
    const programs = await this.programService.getPrograms(
      userToken.authorizations.institutionId,
      { isIncludeInActiveProgram },
    );
    return programs.map((program) => ({
      id: program.id,
      description: program.name,
    }));
  }

  /**
   * Get the education program information.
   * @param programId program id.
   * @returns programs information.
   * */
  @ApiNotFoundResponse({
    description: "Not able to find the requested program.",
  })
  @Get(":programId")
  async getEducationProgram(
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<EducationProgramAPIOutDTO> {
    return this.educationProgramControllerService.getEducationProgram(
      programId,
      userToken.authorizations.institutionId,
    );
  }

  /**
   * Checks if the user is authorized to create or modify programs for the institution.
   * User should have a user type different from read-only user.
   * @param userToken user token.
   * @throws ForbiddenException if the user is not authorized.
   */
  private checkAuthorization(
    institutionUserAuthorizations: InstitutionUserAuthorizations,
  ) {
    const isAuthorized = institutionUserAuthorizations.authorizations.some(
      (auth) =>
        auth.userType === InstitutionUserTypes.admin ||
        auth.userType === InstitutionUserTypes.user,
    );
    if (!isAuthorized) {
      throw new ForbiddenException(
        "You are not authorized to create or modify a program.",
      );
    }
  }
}
