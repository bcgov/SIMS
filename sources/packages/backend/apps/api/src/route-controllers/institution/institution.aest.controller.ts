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
} from "@nestjs/common";
import { InstitutionService } from "../../services";
import { AddressInfo, Institution } from "@sims/sims-db";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  InstitutionProfileAPIInDTO,
  InstitutionDetailAPIOutDTO,
  SearchInstitutionAPIOutDTO,
  InstitutionBasicAPIOutDTO,
  AESTCreateInstitutionFormAPIInDTO,
  SearchInstitutionQueryAPIInDTO,
} from "./models/institution.dto";
import BaseController from "../BaseController";
import { InstitutionControllerService } from "./institution.controller.service";
import { InstitutionLocationControllerService } from "../institution-locations/institution-location.controller.service";
import { ApiTags } from "@nestjs/swagger";
import { transformAddressDetailsForAddressBlockForm } from "../utils/address-utils";
import { InstitutionLocationAPIOutDTO } from "../institution-locations/models/institution-location.dto";
import { ClientTypeBaseRoute } from "../../types";
import { IUserToken } from "../../auth/userToken.interface";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { Role } from "../../auth/roles.enum";

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
    @Query() searchInstitutionQuery: SearchInstitutionQueryAPIInDTO,
  ): Promise<SearchInstitutionAPIOutDTO[]> {
    const searchInstitutions = await this.institutionService.searchInstitution(
      searchInstitutionQuery.legalName,
      searchInstitutionQuery.operatingName,
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
   * @param institutionId id for the institution to be retrieved.
   * @returns institution details.
   */
  @Get(":institutionId")
  async getInstitutionDetailById(
    @Param("institutionId", ParseIntPipe) institutionId: number,
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
   * @param institutionId id for the institution to be updated.
   * @param payload institution details to be updated.
   */
  @Roles(Role.InstitutionEditProfile)
  @Patch(":institutionId")
  async updateInstitution(
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: InstitutionProfileAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const institution =
      await this.institutionService.getBasicInstitutionDetailById(
        institutionId,
      );
    if (!institution) {
      throw new NotFoundException("Institution not found.");
    }
    await this.institutionService.updateInstitution(
      institutionId,
      userToken.userId,
      payload,
      { allowFullUpdate: true },
    );
  }

  /**
   * Get the Basic Institution info for the ministry institution detail page.
   * @param institutionId id for the institution to retrieved.
   * @returns Basic information of institution.
   */
  @Get(":institutionId/basic-details")
  async getBasicInstitutionInfoById(
    @Param("institutionId", ParseIntPipe) institutionId: number,
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
   * @param institutionId id for the institution to retrieve its locations.
   * @returns Institution locations form.io for drop down.
   */
  @Get(":institutionId/locations")
  async getAllInstitutionLocations(
    @Param("institutionId", ParseIntPipe) institutionId: number,
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
  @Roles(Role.AESTCreateInstitution)
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
   * Get the list of all institutions types to be returned in an option
   * list (key/value pair) schema.
   * @returns institutions types in an option list (key/value pair) schema.
   */
  @Get("type/options-list")
  async getInstitutionTypeOptions(): Promise<OptionItemAPIOutDTO[]> {
    return this.institutionControllerService.getInstitutionTypeOptions();
  }

  /**
   * Get the list of all institutions names to be returned in an option
   * list (key/value pair) schema.
   * @returns institutions names in an option list (key/value pair) schema.
   */
  @Get("name/options-list")
  async getAllInstitutionNameOptions(): Promise<OptionItemAPIOutDTO[]> {
    return this.institutionControllerService.getInstitutionNameOptions();
  }
}
