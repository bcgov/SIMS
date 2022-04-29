import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import { FormService, InstitutionService } from "../../services";
import { Institution } from "../../database/entities";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  InstitutionProfileAPIInDTO,
  InstitutionDetailAPIOutDTO,
  SearchInstitutionAPIOutDTO,
  InstitutionBasicAPIOutDTO,
} from "./models/institution.dto";
import BaseController from "../BaseController";
import { InstitutionControllerService } from "./institution.controller.service";
import { InstitutionLocationControllerService } from "../institution-locations/institution-location.controller.service";
import { ApiTags } from "@nestjs/swagger";
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  FieldSortOrder,
  PaginationParams,
  PaginatedResults,
} from "../../utilities";
import { InstitutionUserAPIOutDTO } from "./models/institution-user.dto";
import { FormNames } from "../../services/form/constants";

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
    private readonly locationControllerService: InstitutionLocationControllerService,
    private readonly formService: FormService,
  ) {
    super();
  }

  /**
   * Search the institution based on the search criteria.
   *!This API method is kept above getInstitutionDetailById to avoid route conflict.
   * @param legalName legalName of the institution.
   * @param operatingName operatingName of the institution.
   * @returns Searched institution details.
   */
  @Get("search")
  async searchInstitutions(
    @Query("legalName") legalName: string,
    @Query("operatingName") operatingName: string,
  ): Promise<SearchInstitutionAPIOutDTO[]> {
    if (!legalName && !operatingName) {
      throw new UnprocessableEntityException(
        "Search with at least one search criteria",
      );
    }
    const searchInstitutions = await this.institutionService.searchInstitution(
      legalName,
      operatingName,
    );
    return searchInstitutions.map((eachInstitution: Institution) => ({
      id: eachInstitution.id,
      legalName: eachInstitution.legalOperatingName,
      operatingName: eachInstitution.operatingName,
      address: {
        addressLine1: eachInstitution.institutionAddress.addressLine1,
        addressLine2: eachInstitution.institutionAddress.addressLine2,
        city: eachInstitution.institutionAddress.city,
        provinceState: eachInstitution.institutionAddress.provinceState,
        country: eachInstitution.institutionAddress.country,
        postalCode: eachInstitution.institutionAddress.postalCode,
      },
    }));
  }

  /**
   * Get institution details of given institution.
   * @param institutionId
   * @returns InstitutionDetailDTO.
   */
  @Get(":institutionId")
  async getInstitutionDetailById(
    @Param("institutionId") institutionId: number,
  ): Promise<InstitutionDetailAPIOutDTO> {
    return this.institutionControllerService.getInstitutionDetail(
      institutionId,
    );
  }

  /**
   * Update institution profile details.
   * @param institutionId
   * @param payload
   */
  @Patch(":institutionId")
  async updateInstitution(
    @Param("institutionId") institutionId: number,
    @Body() payload: InstitutionProfileAPIInDTO,
  ): Promise<void> {
    const institution =
      this.institutionService.getBasicInstitutionDetailById(institutionId);
    if (!institution) {
      throw new NotFoundException("Institution not found.");
    }

    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.InstitutionProfile,
      payload,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to update a student due to an invalid request.",
      );
    }
    await this.institutionService.updateInstitution(
      institutionId,
      submissionResult.data.data,
    );
  }

  /**
   * Controller method to get all institution users with the
   * given institutionId.
   * @param institutionId
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
    @Query(PaginationParams.SearchCriteria) searchCriteria: string,
    @Query(PaginationParams.SortField) sortField: string,
    @Query(PaginationParams.SortOrder) sortOrder = FieldSortOrder.ASC,
    @Query(PaginationParams.Page) page = DEFAULT_PAGE_NUMBER,
    @Query(PaginationParams.PageLimit) pageLimit = DEFAULT_PAGE_LIMIT,
  ): Promise<PaginatedResults<InstitutionUserAPIOutDTO>> {
    return this.institutionControllerService.getInstitutionUsers(
      institutionId,
      {
        page,
        pageLimit,
        searchCriteria,
        sortField,
        sortOrder,
      },
    );
  }

  /**
   * Get the Basic Institution info for the ministry institution detail page.
   * @param institutionId
   * @returns Basic information of institution.
   */
  @Get(":institutionId/basic-details")
  async getBasicInstitutionInfoById(
    @Param("institutionId") institutionId: number,
  ): Promise<InstitutionBasicAPIOutDTO> {
    const institutionDetail =
      await this.institutionService.getBasicInstitutionDetailById(
        institutionId,
      );
    const designationStatus =
      await this.locationControllerService.getInstitutionDesignationStatus(
        institutionId,
      );
    return {
      operatingName: institutionDetail.operatingName,
      designationStatus: designationStatus,
    };
  }
}
