import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { IUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken, Groups } from "../../auth/decorators";
import {
  DeclineProgramAPIInDTO,
  ApproveProgramAPIInDTO,
  EducationProgramAPIOutDTO,
} from "./models/education-program.dto";
import { EducationProgramService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  PaginatedResultsAPIOutDTO,
  ProgramsPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { EducationProgramsSummaryAPIOutDTO } from "./models/education-program.dto";
import { EducationProgramControllerService } from "./education-program.controller.service";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("education-program")
@ApiTags(`${ClientTypeBaseRoute.AEST}-education-program`)
export class EducationProgramAESTController extends BaseController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly educationProgramControllerService: EducationProgramControllerService,
  ) {
    super();
  }

  /**
   * Get the education program information.
   * @param programId program id.
   * @returns programs information.
   * */
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
   * Ministry user approve's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @param payload information to approve the program.
   */
  @Patch(":programId/institution/:institutionId/approve")
  async approveProgram(
    @UserToken() userToken: IUserToken,
    @Param("programId", ParseIntPipe) programId: number,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: ApproveProgramAPIInDTO,
  ): Promise<void> {
    await this.programService.approveEducationProgram(
      new Date(payload.effectiveEndDate),
      payload.approvedNote,
      institutionId,
      programId,
      userToken.userId,
    );
  }

  /**
   * Ministry user decline's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @UserToken userToken
   * @Body payload
   */
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
}
