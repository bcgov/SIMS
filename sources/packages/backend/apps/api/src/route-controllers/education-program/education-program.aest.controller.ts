import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { IUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  UserToken,
  Groups,
  Roles,
} from "../../auth/decorators";
import {
  DeclineProgramAPIInDTO,
  ApproveProgramAPIInDTO,
  EducationProgramAPIOutDTO,
  EducationProgramsSummaryAPIOutDTO,
  DeactivateProgramAPIInDTO,
} from "./models/education-program.dto";
import { EducationProgramService, InstitutionService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  PaginatedResultsAPIOutDTO,
  ProgramsPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { EducationProgramControllerService } from "./education-program.controller.service";
import { Role } from "../../auth/roles.enum";
import { OptionItemAPIOutDTO } from "..";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("education-program")
@ApiTags(`${ClientTypeBaseRoute.AEST}-education-program`)
export class EducationProgramAESTController extends BaseController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly educationProgramControllerService: EducationProgramControllerService,
    private readonly institutionService: InstitutionService,
  ) {
    super();
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
  ): Promise<EducationProgramAPIOutDTO> {
    return this.educationProgramControllerService.getEducationProgram(
      programId,
    );
  }

  /**
   * Get the programs summary of an institution with pagination.
   * @param institutionId id of the institution.
   * @param paginationOptions pagination options.
   * @returns paginated programs summary.
   */
  @Get("institution/:institutionId/summary")
  async getProgramsSummaryByInstitutionId(
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Query() paginationOptions: ProgramsPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>> {
    return this.educationProgramControllerService.getProgramsSummary(
      institutionId,
      paginationOptions,
    );
  }

  /**
   * Get a key/value pair list of all approved programs and active programs.
   * @returns key/value pair list of all approved programs.
   */
  @ApiNotFoundResponse({
    description: "Not able to find the institution.",
  })
  @Get("institution/:institutionId/programs-list")
  async getProgramsListForInstitutions(
    @Param("institutionId", ParseIntPipe) institutionId: number,
  ): Promise<OptionItemAPIOutDTO[]> {
    const institutionExists =
      await this.institutionService.institutionExists(institutionId);
    if (!institutionExists) {
      throw new NotFoundException(`Institution ID ${institutionId} not found.`);
    }
    const programs = await this.programService.getPrograms(institutionId);
    return programs.map((program) => ({
      id: program.id,
      description: program.name,
    }));
  }

  /**
   * Ministry user approves a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @param payload information to approve the program.
   */
  @Roles(Role.InstitutionApproveDeclineProgram)
  @Patch(":programId/institution/:institutionId/approve")
  async approveProgram(
    @UserToken() userToken: IUserToken,
    @Param("programId", ParseIntPipe) programId: number,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: ApproveProgramAPIInDTO,
  ): Promise<void> {
    await this.programService.approveEducationProgram(
      payload.effectiveEndDate,
      payload.approvedNote,
      institutionId,
      programId,
      userToken.userId,
    );
  }

  /**
   * Ministry user declines a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @payload note to decline the program.
   */
  @Roles(Role.InstitutionApproveDeclineProgram)
  @Patch(":programId/institution/:institutionId/decline")
  async declineProgram(
    @UserToken() userToken: IUserToken,
    @Param("programId", ParseIntPipe) programId: number,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: DeclineProgramAPIInDTO,
  ): Promise<void> {
    await this.programService.declineEducationProgram(
      payload.declinedNote,
      institutionId,
      programId,
      userToken.userId,
    );
  }

  /**
   * Allows a program to be deactivated.
   * @param programId program to be deactivated.
   * @param payload information to support the deactivation.
   */
  @ApiNotFoundResponse({
    description: "Not able to find the education program.",
  })
  @ApiUnprocessableEntityResponse({
    description: "The education program is already set as requested.",
  })
  @Roles(Role.InstitutionDeactivateEducationProgram)
  @Patch(":programId/deactivate")
  async deactivateProgram(
    @UserToken() userToken: IUserToken,
    @Param("programId", ParseIntPipe) programId: number,
    @Body() payload: DeactivateProgramAPIInDTO,
  ): Promise<void> {
    await this.educationProgramControllerService.deactivateProgram(
      programId,
      userToken.userId,
      { notes: payload.note },
    );
  }
}
