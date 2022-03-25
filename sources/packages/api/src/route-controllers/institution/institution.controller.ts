import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UnprocessableEntityException,
  Param,
  Head,
  NotFoundException,
  Query,
  HttpStatus,
} from "@nestjs/common";
import {
  BCeIDService,
  InstitutionService,
  UserService,
  InstitutionLocationService,
  LEGAL_SIGNING_AUTHORITY_EXIST,
  LEGAL_SIGNING_AUTHORITY_MSG,
} from "../../services";
import {
  BasicInstitutionInfo,
  CreateInstitutionDto,
  SearchInstitutionRespDto,
} from "./models/institution.dto";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  FieldSortOrder,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  transformToInstitutionUserRespDto,
  getUserFullName,
} from "../../utilities";
import {
  InstitutionLocationUserAuthDto,
  InstitutionUserAuthorizations,
  InstitutionUserAndAuthDetailsDto,
  InstitutionUserAuth,
  InstitutionUserAndCount,
} from "./models/institution.user.res.dto";
import { InstitutionUserAuthDto } from "./models/institution-user-auth.dto";
import {
  InstitutionUserTypeAndRoleResponseDto,
  InstitutionUserPermissionDto,
  UserRoleOptionDTO,
} from "./models/institution-user-type-role.res.dto";
import { UserDto } from "../user/models/user.dto";
import {
  AllowAuthorizedParty,
  IsInstitutionAdmin,
  UserToken,
  Groups,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  InstitutionLocationsSummaryDto,
  InstitutionLocationsDetailsDto,
} from "../institution-locations/models/institution-location.dto";
import { Authorizations } from "../../services/institution-user-auth/institution-user-auth.models";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  Institution,
  InstitutionLocation,
  InstitutionUser,
} from "../../database/entities";
import { InstitutionUserRoles } from "../../auth/user-types.enum";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";

import { InstitutionLocationsControllerService } from "../institution-locations/institution-locations.controller.service";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution")
@ApiTags("institution")
export class InstitutionController extends BaseController {
  constructor(
    private readonly locationControllerService: InstitutionLocationsControllerService,
    private readonly userService: UserService,
    private readonly institutionService: InstitutionService,
    private readonly accountService: BCeIDService,
    private readonly locationService: InstitutionLocationService,
  ) {
    super();
  }

  @Post()
  @ApiOperation({ summary: "Creates a new institution" })
  @ApiResponse({ status: HttpStatus.CREATED, description: "Success" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Not found error" })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized error",
  })
  async create(
    @Body() payload: CreateInstitutionDto,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    // Check user exists or not
    const existingUser = await this.userService.getUser(userToken.userName);
    if (existingUser) {
      throw new UnprocessableEntityException("Institution User already exists");
    }

    // Save institution
    await this.institutionService.createInstitution(userToken, payload);
  } //create method ends

  @Patch("/sync")
  async sync(@UserToken() token: IInstitutionUserToken) {
    await this.institutionService.syncInstitution(token);
  }

  /**
   * Controller method to get all institution users with the
   * given institutionId for institution Admin.
   * @param institutionId institution id
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
  @IsInstitutionAdmin()
  @Get("/users")
  async allUsers(
    @Query("searchName") searchName: string,
    @Query("sortField") sortField: string,
    @Query("sortOrder") sortOrder: FieldSortOrder,
    @UserToken() user: IInstitutionUserToken,
    @Query("page") page = DEFAULT_PAGE_NUMBER,
    @Query("pageLimit") pageLimit = DEFAULT_PAGE_LIMIT,
  ): Promise<InstitutionUserAndCount> {
    const institution = await this.institutionService.getInstituteByUserName(
      user.userName,
    );
    if (!institution) {
      throw new UnprocessableEntityException(
        "The user has no institution associated with.",
      );
    }
    const [institutionUsers, count] = await this.institutionService.allUsers(
      searchName,
      sortField,
      institution.id,
      page,
      pageLimit,
      sortOrder,
    );
    return {
      users: institutionUsers.map((eachInstitutionUser: InstitutionUser) => {
        return transformToInstitutionUserRespDto(eachInstitutionUser);
      }),
      totalUsers: count,
    };
  }

  /**
   * Creates all necessary records to have a new user added to the
   * institution, with the right permissions and ready to login.
   */

  @IsInstitutionAdmin()
  @Post("/user")
  async createInstitutionUserWithAuth(
    @Body() payload: InstitutionUserAuthDto,
    @UserToken() user: IInstitutionUserToken,
  ): Promise<number> {
    // Get institution
    const institution = await this.institutionService.getInstituteByUserName(
      user.userName,
    );
    if (!institution) {
      throw new UnprocessableEntityException(
        "The user has no institution associated with.",
      );
    }
    // Find user on BCeID Web Service
    const bceidUserAccount = await this.accountService.getAccountDetails(
      payload.userId,
    );
    if (!bceidUserAccount) {
      throw new UnprocessableEntityException(
        "User not found on BCeID Web Service.",
      );
    }
    // Check if the user being added to th institution belongs to the institution.
    if (
      institution.guid.toLowerCase() !==
      bceidUserAccount.institution.guid.toLowerCase()
    ) {
      throw new UnprocessableEntityException(
        "User not found under the institution.",
      );
    }

    /** A legal signing authority role can be added to only one user per institution */
    const addLegalSigningAuthorityExist = payload.permissions.some(
      (role) => role.userRole === InstitutionUserRoles.legalSigningAuthority,
    );

    if (addLegalSigningAuthorityExist) {
      const legalSigningAuthority =
        await this.institutionService.checkLegalSigningAuthority(
          institution.id,
        );

      if (legalSigningAuthority) {
        throw new UnprocessableEntityException(
          LEGAL_SIGNING_AUTHORITY_EXIST,
          LEGAL_SIGNING_AUTHORITY_MSG,
        );
      }
    }

    // Create the user user and the related records.
    const createdInstitutionUser =
      await this.institutionService.createInstitutionUser(
        institution.id,
        bceidUserAccount,
        payload,
      );

    return createdInstitutionUser.id;
  }

  /* Since, below API is called by only Admin user, IsInstitutionAdmin 
    decorator is added, in future, if the API is shared, remove this decorator */
  @IsInstitutionAdmin()
  @Get("/user-types-roles")
  async getUserTypesAndRoles(): Promise<InstitutionUserTypeAndRoleResponseDto> {
    return this.institutionService.getUserTypesAndRoles();
  }

  /* Since, below API is called by only Admin user, IsInstitutionAdmin 
    decorator is added, in future, if the API is shared, remove this decorator */
  @IsInstitutionAdmin()
  @Get("/user/:userName")
  async getInstitutionLocationByUserName(
    @Param("userName") userName: string,
  ): Promise<InstitutionLocationUserAuthDto> {
    // Get institutionUser
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(userName);
    // disabled users details can't be edited
    if (!institutionUser.user.isActive) {
      throw new UnprocessableEntityException("Not an Active User.");
    }
    return {
      id: institutionUser.id,
      user: {
        firstName: institutionUser.user?.firstName,
        lastName: institutionUser.user?.lastName,
        userName: institutionUser.user?.userName,
        isActive: institutionUser.user?.isActive,
        id: institutionUser.user?.id,
      },
      authorizations: institutionUser.authorizations?.map((el) => {
        return {
          location: {
            name: el.location?.name,
            data: el.location?.data,
            id: el.location?.id,
          },
          authType: { type: el.authType?.type, role: el.authType?.role },
        } as InstitutionUserAuthorizations;
      }),
    } as InstitutionLocationUserAuthDto;
  }

  @IsInstitutionAdmin()
  @Patch("/user/:userName")
  async UpdateInstitutionUserWithAuth(
    @UserToken() token: IInstitutionUserToken,
    @Param("userName") userName: string,
    @Body() payload: InstitutionUserPermissionDto,
  ): Promise<void> {
    // Check its a active user
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(userName);

    // checking if user belong to logged-in users institution
    if (institutionUser.institution.id !== token.authorizations.institutionId) {
      throw new UnprocessableEntityException(
        "user does not belong to your institution.",
      );
    }
    // Get institution
    const institution = await this.institutionService.getInstituteByUserName(
      userName,
    );
    if (!institution) {
      throw new UnprocessableEntityException(
        "The user has no institution associated.",
      );
    }

    /** A legal signing authority role can be added to only one user per institution */
    const addLegalSigningAuthorityExist = payload.permissions.some(
      (role) => role.userRole === InstitutionUserRoles.legalSigningAuthority,
    );

    if (addLegalSigningAuthorityExist) {
      const legalSigningAuthority =
        await this.institutionService.checkLegalSigningAuthority(
          institution.id,
        );

      if (legalSigningAuthority) {
        throw new UnprocessableEntityException(
          LEGAL_SIGNING_AUTHORITY_EXIST,
          LEGAL_SIGNING_AUTHORITY_MSG,
        );
      }
    }

    // remove existing associations and add new associations
    await this.institutionService.updateInstitutionUser(
      payload,
      institutionUser,
    );
  }

  @IsInstitutionAdmin()
  @Patch("user-status/:userName")
  async updateUserStatus(
    @UserToken() token: IInstitutionUserToken,
    @Param("userName") userName: string,
    @Body() body: UserDto,
  ): Promise<void> {
    // Check  user exists or not
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(userName);

    // checking if user belong to logged-in users institution
    if (institutionUser.institution.id !== token.authorizations.institutionId) {
      throw new UnprocessableEntityException(
        "user does not belong to your institution.",
      );
    }
    await this.userService.updateUserStatus(
      institutionUser.user.id,
      body.isActive,
    );
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
  @ApiOkResponse({ description: "Institution found." })
  @ApiNotFoundResponse({
    description: "Institution not found.",
  })
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
    const designationAgreementLocationStatus =
      await this.locationControllerService.getInstitutionDesignationStatus(
        institutionId,
      );
    return {
      operatingName: institutionDetail.operatingName,
      designationAgreementLocationStatus: designationAgreementLocationStatus,
    };
  }

  /**
   * Controller method to get all institution locations with the
   * given institutionId for  ministry user.
   * @param institutionId institution id
   * @returns All the institution locations for the given institution.
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @ApiOkResponse({
    description: "Institution locations found.",
  })
  @ApiNotFoundResponse({
    description: "Institution locations not found.",
  })
  @Get("/:institutionId/location-summary")
  async getAllInstitutionLocationSummaryForAEST(
    @Param("institutionId") institutionId: number,
  ): Promise<InstitutionLocationsDetailsDto[]> {
    // get all institution locations with designation statuses.
    return this.locationControllerService.getInstitutionLocationsWithDesignationStatus(
      institutionId,
    );
  }

  /**
   * Controller method to get all institution users with the
   * given institutionId ministry user.
   * @param institutionId institution id
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
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get("/:institutionId/user-summary")
  async usersSummaryForAEST(
    @Query("searchName") searchName: string,
    @Query("sortField") sortField: string,
    @Query("sortOrder") sortOrder: FieldSortOrder,
    @Param("institutionId") institutionId: number,
    @Query("page") page = DEFAULT_PAGE_NUMBER,
    @Query("pageLimit") pageLimit = DEFAULT_PAGE_LIMIT,
  ): Promise<InstitutionUserAndCount> {
    const institutionUserAndCount = await this.institutionService.allUsers(
      searchName,
      sortField,
      institutionId,
      page,
      pageLimit,
      sortOrder,
    );
    return {
      users: institutionUserAndCount[0].map(
        (eachInstitutionUser: InstitutionUser) => {
          return transformToInstitutionUserRespDto(eachInstitutionUser);
        },
      ),
      totalUsers: institutionUserAndCount[1],
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
