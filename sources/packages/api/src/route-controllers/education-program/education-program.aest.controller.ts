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
  ProgramsSummary,
  DeclineProgram,
  ApproveProgram,
} from "./models/save-education-program.dto";
import { EducationProgramService } from "../../services";
import { OfferingTypes } from "../../database/entities";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import { FieldSortOrder, PaginatedResults } from "../../utilities";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Controller("education-program")
@ApiTags(`${ClientTypeBaseRoute.AEST}-education-program`)
export class EducationProgramAESTController extends BaseController {
  constructor(private readonly programService: EducationProgramService) {
    super();
  }

  /**
   * Education Program Details for ministry users
   * @param programId program id
   * @returns programs details.
   * */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get(":programId/aest")
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
   * Get all programs of an institution with pagination
   * for ministry users
   * @param institutionId id of the institution.
   * @param pageSize is the number of rows shown in the table
   * @param page is the number of rows that is skipped/offset from the total list.
   * For example page 2 the skip would be 10 when we select 10 rows per page.
   * @param sortColumn the sorting column.
   * @param sortOrder sorting order.
   * @param searchCriteria Search the program name in the query
   * @returns ProgramsSummaryPaginated.
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get("institution/:institutionId/aest")
  async getPaginatedProgramsForAEST(
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Query("pageSize") pageSize: number,
    @Query("page") page: number,
    @Query("sortColumn") sortColumn: string,
    @Query("sortOrder") sortOrder: FieldSortOrder,
    @Query("searchCriteria") searchCriteria: string,
  ): Promise<PaginatedResults<ProgramsSummary>> {
    return this.programService.getPaginatedProgramsForAEST(
      institutionId,
      [OfferingTypes.Public, OfferingTypes.Private],
      {
        searchCriteria: searchCriteria,
        sortField: sortColumn,
        sortOrder: sortOrder,
        page: page,
        pageLimit: pageSize,
      },
    );
  }

  /**
   * Ministry user approve's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @UserToken userToken
   * @Body payload
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Patch(":programId/institution/:institutionId/approve/aest")
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
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Patch(":programId/institution/:institutionId/decline/aest")
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
