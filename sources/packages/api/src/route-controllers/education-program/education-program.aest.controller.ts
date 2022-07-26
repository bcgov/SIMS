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
import { AllowAuthorizedParty, UserToken, Groups } from "../../auth/decorators";
import {
  EducationProgramDataDto,
  transformToEducationProgramData,
  DeclineProgram,
  ApproveProgram,
} from "./models/save-education-program.dto";
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
   * Education Program Details for ministry users
   * @param programId program id
   * @returns programs details.
   * */
  @Get(":programId")
  async getProgramForAEST(
    @Param("programId", ParseIntPipe) programId: number,
  ): Promise<EducationProgramDataDto> {
    const program = await this.programService.getEducationProgramDetails(
      programId,
    );
    if (!program) {
      throw new NotFoundException("Not able to find the requested program.");
    }

    return transformToEducationProgramData(program);
  }

  /**
   * Get the programs summary of an institution with pagination.
   * @param institutionId id of the institution.
   * @param paginationOptions pagination options.
   * @returns paginated programs summary.
   */
  @Get("institution/:institutionId/summary")
  async getProgramsSummary(
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
   * @UserToken userToken
   * @Body payload
   */
  @Patch(":programId/institution/:institutionId/approve")
  async approveProgram(
    @UserToken() userToken: IUserToken,
    @Param("programId", ParseIntPipe) programId: number,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: ApproveProgram,
  ): Promise<void> {
    await this.programService.approveEducationProgram(
      institutionId,
      programId,
      userToken.userId,
      payload,
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
    @Body() payload: DeclineProgram,
  ): Promise<void> {
    await this.programService.declineEducationProgram(
      institutionId,
      programId,
      userToken.userId,
      payload,
    );
  }
}
