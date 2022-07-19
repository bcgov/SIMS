import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
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
import { ApiTags } from "@nestjs/swagger";
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
}
