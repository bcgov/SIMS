import {
  Body,
  Controller,
  Get,
  Head,
  NotFoundException,
  Param,
  Patch,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  Groups,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { Institution, InstitutionLocation } from "../../database/entities";
import {
  InstitutionLocationService,
  InstitutionService,
  UserService,
} from "../../services";
import { Authorizations } from "../../services/institution-user-auth/institution-user-auth.models";
import { getUserFullName } from "../../utilities";
import BaseController from "../BaseController";
import { InstitutionLocationControllerService } from "../institution-locations/institution-location.controller.service";
import { InstitutionLocationsSummaryDto } from "../institution-locations/models/institution-location.dto";
import { UserRoleOptionDTO } from "./models/institution-user-type-role.res.dto";
import {
  BasicInstitutionInfo,
  SearchInstitutionRespDto,
} from "./models/institution.dto";
import {
  InstitutionUserAndAuthDetailsDto,
  InstitutionUserAuth,
} from "./models/institution.user.res.dto";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution")
@ApiTags("institution")
export class InstitutionController extends BaseController {
  constructor(
    private readonly locationControllerService: InstitutionLocationControllerService,
    private readonly userService: UserService,
    private readonly institutionService: InstitutionService,
    private readonly locationService: InstitutionLocationService,
  ) {
    super();
  }

  @Patch("/sync")
  async sync(@UserToken() token: IInstitutionUserToken) {
    await this.institutionService.syncInstitution(token);
  }

  @Get("/my-details")
  async getMyDetails(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionUserAndAuthDetailsDto> {
    // Get logged in user and location details with auth
    const userDetails = await this.userService.getUser(token.userName);
    const user = {
      user: {
        firstName: userDetails?.firstName,
        lastName: userDetails?.lastName,
        isActive: userDetails?.isActive,
        userFullName: getUserFullName(userDetails),
        isAdmin: token.authorizations.isAdmin(),
        email: userDetails?.email,
      },
    };
    const locationAuth = {
      authorizations: {
        institutionId: token.authorizations.institutionId,
        authorizations: token.authorizations.authorizations.map(
          (el: Authorizations) => {
            return {
              locationId: el.locationId,
              userType: el.userType,
              userRole: el.userRole,
            };
          },
        ),
      } as InstitutionUserAuth,
    };

    return {
      ...user,
      ...locationAuth,
    };
  }

  @Get("/my-locations")
  async getMyInstitutionLocations(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionLocationsSummaryDto[]> {
    // get all institution locations that user has access too.
    const InstitutionLocationData: InstitutionLocation[] =
      userToken.authorizations.isAdmin()
        ? await this.locationService.getAllInstitutionLocations(
            userToken?.authorizations?.institutionId,
          )
        : await this.locationService.getMyInstitutionLocations(
            userToken.authorizations.getLocationsIds(),
          );
    return InstitutionLocationData.map((el: InstitutionLocation) => {
      return {
        id: el.id,
        name: el.name,
        address: {
          addressLine1: el.data.address?.addressLine1,
          addressLine2: el.data.address?.addressLine2,
          province: el.data.address?.province,
          country: el.data.address?.country,
          city: el.data.address?.city,
          postalCode: el.data.address?.postalCode,
        },
      } as InstitutionLocationsSummaryDto;
    });
  }
  @Head("/:guid")
  async checkIfInstitutionExist(@Param("guid") guid: string): Promise<void> {
    const response = await this.institutionService.doesExist(guid);
    if (!response) {
      throw new NotFoundException(
        `Institution with guid: ${guid} does not exist`,
      );
    }
  }

  /**
   * Search the institution based on the search criteria.
   * @param legalName legalName of the institution.
   * @param operatingName operatingName of the institution.
   * @returns Searched institution details.
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get("search")
  async searchInsitutions(
    @Query("legalName") legalName: string,
    @Query("operatingName") operatingName: string,
  ): Promise<SearchInstitutionRespDto[]> {
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
   * Get the Basic Institution info for the ministry institution detail page
   * @param institutionId
   * @returns BasicInstitutionInfo
   */
  @ApiOkResponse({ description: "Basic Institution info found." })
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get("/:institutionId/basic-details")
  async getBasicInstitutionInfoById(
    @Param("institutionId") institutionId: number,
  ): Promise<BasicInstitutionInfo> {
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

  /**
   * API to get the lookup values for admin role.
   **Note: There are are more than one type of admin role. Basic admin has role as NULL rest of them have role name.
   **This API is exclusively for admin roles and does not include other non-admin roles.
   * @returns Admin Roles.
   */
  @IsInstitutionAdmin()
  @Get("admin-roles")
  async getAdminRoles(): Promise<UserRoleOptionDTO[]> {
    const userRoles = await this.institutionService.getAdminRoles();
    /** This API is to feed the values to drop-down component. Name and code have same value in this scenario. */
    return userRoles.map((role) => ({
      name: role.role || role.type,
      code: role.role || role.type,
    }));
  }
}
