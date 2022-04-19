import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
} from "@nestjs/common";
import { InstitutionService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  InstitutionProfileDTO,
  InstitutionDetailDTO,
} from "./models/institution.dto";
import BaseController from "../BaseController";
import { InstitutionControllerService } from "./institution.controller.service";
import { ApiTags } from "@nestjs/swagger";
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  FieldSortOrder,
  PaginationParams,
  PaginatedResults,
} from "../../utilities";
import { InstitutionUserAPIOutDTO } from "./models/institution-user.dto";

/**
 * Institution controller for AEST Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("institution")
@ApiTags("institution")
export class InstitutionAESTController extends BaseController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly institutionControllerService: InstitutionControllerService,
  ) {
    super();
  }

  /**
   * Get institution details of given institution.
   * @param institutionId
   * @returns InstitutionDetailDTO.
   */
  @Get("/:institutionId")
  async getInstitutionDetailById(
    @Param("institutionId") institutionId: number,
  ): Promise<InstitutionDetailDTO> {
    return this.institutionControllerService.getInstitutionDetail(
      institutionId,
    );
  }

  /**
   * Update institution profile details.
   * @param institutionId
   * @param payload
   */
  @Patch("/:institutionId")
  async updateInstitution(
    @Param("institutionId") institutionId: number,
    @Body() payload: InstitutionProfileDTO,
  ): Promise<void> {
    const institution =
      this.institutionService.getBasicInstitutionDetailById(institutionId);
    if (!institution) {
      throw new NotFoundException("Institution not found.");
    }
    await this.institutionService.updateInstitution(institutionId, payload);
  }

  /**
   * Controller method to get all institution users with the
   * given institutionId.
   * @queryParm page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @queryParm pageLimit, page size or records per page, if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @queryParm searchName, user's name keyword to be searched
   * @queryParm sortField, field to be sorted
   * @queryParm sortOrder, order to be sorted
   * @returns All the institution users for the given institution
   * with total count.
   */
  @Get(":institutionId/user")
  async getInstitutionUsers(
    @Param("institutionId") institutionId: number,
    @Query(PaginationParams.SearchCriteria) searchName: string,
    @Query(PaginationParams.SortField) sortField: string,
    @Query(PaginationParams.SortOrder) sortOrder = FieldSortOrder.ASC,
    @Query(PaginationParams.Page) page = DEFAULT_PAGE_NUMBER,
    @Query(PaginationParams.PageLimit) pageLimit = DEFAULT_PAGE_LIMIT,
  ): Promise<PaginatedResults<InstitutionUserAPIOutDTO>> {
    return await this.institutionControllerService.getInstitutionUsers(
      institutionId,
      {
        page: page,
        pageLimit: pageLimit,
        searchCriteria: searchName,
        sortField: sortField,
        sortOrder: sortOrder,
      },
    );
  }
}
