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
  AESTInstitutionDetailDto,
  BasicInstitutionInfo,
  CreateInstitutionDto,
  InstitutionDetailDto,
  InstitutionDto,
  SearchInstitutionRespDto,
} from "./models/institution.dto";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import {
  INSTITUTION_TYPE_BC_PRIVATE,
  getExtendedDateFormat,
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

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution")
export class InstitutionController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly institutionService: InstitutionService,
    private readonly accountService: BCeIDService,
    private readonly locationService: InstitutionLocationService,
  ) {
    super();
  }

  @Post()
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

  @IsInstitutionAdmin()
  @Patch()
  async update(
    @Body() payload: InstitutionDto,
    @UserToken() userToken: IInstitutionUserToken,
  ) {
    await this.institutionService.updateInstitution(userToken, payload);
  }

  @Get()
  async getInstitutionDetail(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionDetailDto> {
    // BCeID account information.
    const accountRequest = this.accountService.getAccountDetails(
      token.idp_user_name,
    );
    // Institution account.
    const institutionDetailRequest =
      this.institutionService.getInstituteByUserName(token.userName);
    // User account in SIMS.
    const userRequest = this.userService.getActiveUser(token.userName);
    // Execute all request in parallel.
    const [account, institutionDetail, user] = await Promise.all([
      accountRequest,
      institutionDetailRequest,
      userRequest,
    ]);

    const isBCPrivate =
      INSTITUTION_TYPE_BC_PRIVATE === institutionDetail.institutionType.id;
    return {
      institution: {
        userFirstName: user.firstName,
        userLastName: user.lastName,
        userEmail: user.email,
        legalOperatingName: institutionDetail.legalOperatingName,
        operatingName: institutionDetail.operatingName,
        primaryPhone: institutionDetail.primaryPhone,
        primaryEmail: institutionDetail.primaryEmail,
        website: institutionDetail.website,
        regulatingBody: institutionDetail.regulatingBody,
        establishedDate: institutionDetail.establishedDate,
        primaryContactEmail:
          institutionDetail.institutionPrimaryContact.primaryContactEmail,
        primaryContactFirstName:
          institutionDetail.institutionPrimaryContact.primaryContactFirstName,
        primaryContactLastName:
          institutionDetail.institutionPrimaryContact.primaryContactLastName,
        primaryContactPhone:
          institutionDetail.institutionPrimaryContact.primaryContactPhone,
        legalAuthorityEmail:
          institutionDetail.legalAuthorityContact.legalAuthorityEmail,
        legalAuthorityFirstName:
          institutionDetail.legalAuthorityContact.legalAuthorityFirstName,
        legalAuthorityLastName:
          institutionDetail.legalAuthorityContact.legalAuthorityLastName,
        legalAuthorityPhone:
          institutionDetail.legalAuthorityContact.legalAuthorityPhone,
        addressLine1: institutionDetail.institutionAddress.addressLine1,
        addressLine2: institutionDetail.institutionAddress.addressLine2,
        city: institutionDetail.institutionAddress.city,
        country: institutionDetail.institutionAddress.country,
        provinceState: institutionDetail.institutionAddress.provinceState,
        postalCode: institutionDetail.institutionAddress.postalCode,
        institutionType: institutionDetail.institutionType.id,
        institutionTypeName: institutionDetail.institutionType.name,
      },
      account: {
        user: {
          guid: account.user.guid,
          displayName: account.user.displayName,
          firstname: account.user.firstname,
          surname: account.user.surname,
          email: account.user.email,
        },
        institution: {
          guid: account.institution.guid,
          legalName: account.institution.legalName,
        },
      },
      isBCPrivate: isBCPrivate,
    };
  }

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
    const institutionUserAndCount = await this.institutionService.allUsers(
      searchName,
      sortField,
      institution.id,
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
   * Get the Institution details for the ministry institution detail page
   * @param institutionId
   * @returns AESTInstitutionDetailDto
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get("/:institutionId/detail")
  async getAESTInstitutionDetailById(
    @Param("institutionId") institutionId: number,
  ): Promise<AESTInstitutionDetailDto> {
    const institutionDetail =
      await this.institutionService.getAESTInstitutionDetailById(institutionId);
    return {
      legalOperatingName: institutionDetail.legalOperatingName,
      operatingName: institutionDetail.operatingName,
      primaryPhone: institutionDetail.primaryPhone,
      primaryEmail: institutionDetail.primaryEmail,
      website: institutionDetail.website,
      regulatingBody: institutionDetail.regulatingBody,
      institutionTypeName: institutionDetail.institutionType.name,
      formattedEstablishedDate: getExtendedDateFormat(
        institutionDetail.establishedDate,
      ),
      primaryContactEmail:
        institutionDetail.institutionPrimaryContact.primaryContactEmail,
      primaryContactFirstName:
        institutionDetail.institutionPrimaryContact.primaryContactFirstName,
      primaryContactLastName:
        institutionDetail.institutionPrimaryContact.primaryContactLastName,
      primaryContactPhone:
        institutionDetail.institutionPrimaryContact.primaryContactPhone,
      legalAuthorityEmail:
        institutionDetail.legalAuthorityContact.legalAuthorityEmail,
      legalAuthorityFirstName:
        institutionDetail.legalAuthorityContact.legalAuthorityFirstName,
      legalAuthorityLastName:
        institutionDetail.legalAuthorityContact.legalAuthorityLastName,
      legalAuthorityPhone:
        institutionDetail.legalAuthorityContact.legalAuthorityPhone,
      address: {
        addressLine1: institutionDetail.institutionAddress.addressLine1,
        addressLine2: institutionDetail.institutionAddress.addressLine2,
        city: institutionDetail.institutionAddress.city,
        country: institutionDetail.institutionAddress.country,
        provinceState: institutionDetail.institutionAddress.provinceState,
        postalCode: institutionDetail.institutionAddress.postalCode,
      },
    };
  }

  /**
   * Get the Basic Institution info for the ministry institution detail page
   * @param institutionId
   * @returns BasicInstitutionInfo
   */
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
    return {
      operatingName: institutionDetail.operatingName,
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
  @Get("/:institutionId/location-summary")
  async getAllInstitutionLocationSummaryForAEST(
    @Param("institutionId") institutionId: number,
  ): Promise<InstitutionLocationsDetailsDto[]> {
    // get all institution locations.
    const InstitutionLocationData =
      await this.locationService.getAllInstitutionLocations(institutionId);
    return InstitutionLocationData.map(
      (institutionLocation: InstitutionLocation) => {
        return {
          id: institutionLocation.id,
          name: institutionLocation.name,
          data: {
            address: {
              addressLine1: institutionLocation.data.address?.addressLine1,
              addressLine2: institutionLocation.data.address?.addressLine2,
              province: institutionLocation.data.address?.province,
              country: institutionLocation.data.address?.country,
              city: institutionLocation.data.address?.city,
              postalCode: institutionLocation.data.address?.postalCode,
            },
          },
          primaryContact: {
            primaryContactFirstName:
              institutionLocation.primaryContact.firstName,
            primaryContactLastName: institutionLocation.primaryContact.lastName,
            primaryContactEmail: institutionLocation.primaryContact.email,
            primaryContactPhone: institutionLocation.primaryContact.phoneNumber,
          },
          institution: {
            institutionPrimaryContact: {
              primaryContactEmail:
                institutionLocation.institution.institutionPrimaryContact
                  .primaryContactEmail,
              primaryContactFirstName:
                institutionLocation.institution.institutionPrimaryContact
                  .primaryContactFirstName,
              primaryContactLastName:
                institutionLocation.institution.institutionPrimaryContact
                  .primaryContactLastName,
              primaryContactPhone:
                institutionLocation.institution.institutionPrimaryContact
                  .primaryContactPhone,
            },
          },
          institutionCode: institutionLocation.institutionCode,
        } as InstitutionLocationsDetailsDto;
      },
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
