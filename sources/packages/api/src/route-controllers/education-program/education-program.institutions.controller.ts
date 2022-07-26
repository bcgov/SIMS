import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import { EducationProgramAPIInDTO } from "./models/education-program.dto";
import { EducationProgramsSummary } from "../../services/education-program/education-program.service.models";
import {
  EducationProgramAPIOutDTO,
  EducationProgramDetailsAPIOutDTO,
} from "./models/education-program.dto";
import { ClientTypeBaseRoute } from "../../types";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { EducationProgramService } from "../../services";
import {
  PaginatedResultsAPIOutDTO,
  ProgramsPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { EducationProgramControllerService } from "..";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { OptionItemAPIOutDTO } from "../models/common.dto";

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

  @Post()
  async createEducationProgram(
    @Body() payload: EducationProgramAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const newProgram = await this.educationProgramControllerService.saveProgram(
      payload,
      userToken.authorizations.institutionId,
      userToken.userId,
    );
    return { id: newProgram.id };
  }

  @Patch(":programId")
  async update(
    @Param("programId", ParseIntPipe) programId: number,
    @Body() payload: EducationProgramAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    await this.educationProgramControllerService.saveProgram(
      payload,
      userToken.authorizations.institutionId,
      userToken.userId,
      programId,
    );
  }

  /**
   * Get a key/value pair list of all programs.
   * @param userToken User token from request.
   * @returns key/value pair list of programs.
   */
  @Get("programs-list")
  async getLocationProgramsOptionListForInstitution(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<OptionItemAPIOutDTO[]> {
    const programs = await this.programService.getPrograms(
      userToken.authorizations.institutionId,
    );
    return programs.map((program) => ({
      id: program.id,
      description: program.name,
    }));
  }

  /**
   * Get program details for a program id.
   * @param programId program id
   * @returns program information.
   */
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
}
