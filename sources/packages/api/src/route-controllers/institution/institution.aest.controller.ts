import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InstitutionService } from "../../services";
import { AddressInfo, Institution } from "../../database/entities";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  InstitutionProfileAPIInDTO,
  InstitutionDetailAPIOutDTO,
  SearchInstitutionAPIOutDTO,
  InstitutionBasicAPIOutDTO,
  AESTCreateInstitutionFormAPIInDTO,
} from "./models/institution.dto";
import BaseController from "../BaseController";
import { InstitutionControllerService } from "./institution.controller.service";
import { InstitutionLocationControllerService } from "../institution-locations/institution-location.controller.service";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  FieldSortOrder,
  PaginationParams,
  PaginatedResults,
} from "../../utilities";
import {
  CreateInstitutionUserAPIInDTO,
  InstitutionUserAPIOutDTO,
  UpdateInstitutionUserAPIInDTO,
  UserActiveStatusAPIInDTO,
} from "./models/institution-user.dto";
import { transformAddressDetailsForAddressBlockForm } from "../utils/address-utils";
import { InstitutionLocationAPIOutDTO } from "../institution-locations/models/institution-location.dto";
import { ClientTypeBaseRoute } from "../../types";
import { IUserToken } from "../../auth/userToken.interface";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";

/**
 * Institution controller for AEST Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("institution")
@ApiTags(`${ClientTypeBaseRoute.AEST}-institution`)
export class InstitutionAESTController extends BaseController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly institutionControllerService: InstitutionControllerService,
    private readonly locationControllerService: InstitutionLocationControllerService,
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
    return searchInstitutions.map((eachInstitution: Institution) => {
      const mailingAddress =
        eachInstitution.institutionAddress.mailingAddress ??
        ({} as AddressInfo);
      return {
        id: eachInstitution.id,
        legalName: eachInstitution.legalOperatingName,
        operatingName: eachInstitution.operatingName,
        address: {
          addressLine1: mailingAddress.addressLine1,
          addressLine2: mailingAddress.addressLine2,
          city: mailingAddress.city,
          provinceState: mailingAddress.provinceState,
          country: mailingAddress.country,
          postalCode: mailingAddress.postalCode,
        },
      };
    });
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
    const institutionDetail =
      await this.institutionControllerService.getInstitutionDetail(
        institutionId,
      );
    return {
      ...institutionDetail,
      mailingAddress: transformAddressDetailsForAddressBlockForm(
        institutionDetail.mailingAddress,
      ),
    };
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
    await this.institutionService.updateInstitution(institutionId, payload);
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
      hasBusinessGuid: !!institutionDetail.businessGuid,
    };
  }

  /**
   * Controller method to get institution locations with designation status for the given institution.
   * @param institutionId
   * @returns Institution locations form.io for drop down.
   */
  @Get(":institutionId/locations")
  async getAllInstitutionLocations(
    @Param("institutionId") institutionId: number,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    // get all institution locations with designation statuses.
    return this.locationControllerService.getInstitutionLocations(
      institutionId,
    );
  }

  /**
   * Create institutions that are not allowed to create the profile by
   * themselves due to limitations, for instance, when the institution
   * has only a basic BCeID login.
   * @param payload complete information to create the profile.
   * @returns primary identifier of the created resource.
   */
  @Post()
  async createInstitution(
    @Body() payload: AESTCreateInstitutionFormAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const institution = await this.institutionService.createInstitution(
      payload,
      userToken.userId,
    );
    return {
      id: institution.id,
    };
  }

  /**
   * Create a user, associate with the institution, and assign the authorizations.
   * @param institutionId institution to have the user created.
   * @param payload authorizations to be associated with the user.
   * @returns Primary identifier of the created resource.
   */
  @ApiNotFoundResponse({ description: "Institution not found." })
  @ApiUnprocessableEntityResponse({
    description:
      "User to be added was not found on BCeID Account Service " +
      "or the user does not belong to the same institution " +
      "or the user already exists " +
      "or a second legal signing authority is trying to be set when one is already in place.",
  })
  @Post(":institutionId/user")
  async createInstitutionUserWithAuth(
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: CreateInstitutionUserAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.institutionControllerService.createInstitutionUserWithAuth(
      institutionId,
      payload,
    );
  }

  /**
   * Update the user authorizations for the institution user.
   * @param userName user to have the permissions updated.
   * @param payload permissions to be updated.
   */
  @ApiNotFoundResponse({
    description: "User to be updated not found.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "The user is not active" +
      " or the user permission is being updated in a way that no admin will be present" +
      " or a second legal signing authority is trying to be set and only one is allowed.",
  })
  @Patch("user/:userName")
  async updateInstitutionUserWithAuth(
    @Param("userName") userName: string,
    @Body() payload: UpdateInstitutionUserAPIInDTO,
  ): Promise<void> {
    await this.institutionControllerService.updateInstitutionUserWithAuth(
      userName,
      payload,
    );
  }

  /**
   * Get institution user by user name(guid).
   * @param userName user name (guid).
   * @returns institution user details.
   */
  @ApiNotFoundResponse({
    description: "User not found.",
  })
  @Get("user/:userName")
  async getInstitutionUserByUserName(
    @Param("userName") userName: string,
  ): Promise<InstitutionUserAPIOutDTO> {
    return this.institutionControllerService.getInstitutionUserByUserName(
      userName,
    );
  }

  /**
   * Update the active status of the user.
   * @param userName unique name of the user to be updated.
   * @param payload information to enable or disable the user.
   */
  @ApiNotFoundResponse({
    description: "User to be updated not found.",
  })
  @Patch("user-status/:userName")
  async updateUserStatus(
    @UserToken() userToken: IUserToken,
    @Param("userName") userName: string,
    @Body() payload: UserActiveStatusAPIInDTO,
  ): Promise<void> {
    await this.institutionControllerService.updateUserStatus(
      userName,
      payload,
      userToken.userId,
    );
  }
}
