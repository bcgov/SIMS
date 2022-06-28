import {
  Body,
  Controller,
  Patch,
  Get,
  Post,
  UnprocessableEntityException,
  Query,
  Param,
  NotFoundException,
  Head,
  ForbiddenException,
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import { InstitutionUserRoles } from "../../auth/user-types.enum";
import {
  InstitutionService,
  UserService,
  BCeIDService,
  InstitutionLocationService,
  LEGAL_SIGNING_AUTHORITY_EXIST,
  LEGAL_SIGNING_AUTHORITY_MSG,
} from "../../services";
import {
  InstitutionContactAPIInDTO,
  InstitutionDetailAPIOutDTO,
  InstitutionFormAPIInDTO,
} from "./models/institution.dto";

import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import {
  InstitutionUserAPIOutDTO,
  InstitutionUserAPIInDTO,
  InstitutionUserPermissionAPIInDTO,
  UserActiveStatusAPIInDTO,
  InstitutionUserDetailAPIOutDTO,
  InstitutionUserLocationsAPIOutDTO,
  UserRoleOptionAPIOutDTO,
  InstitutionUserTypeAndRoleAPIOutDTO,
} from "./models/institution-user.dto";
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { InstitutionControllerService } from "./institution.controller.service";
import { ClientTypeBaseRoute } from "../../types";
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  FieldSortOrder,
  PaginationParams,
  PaginatedResults,
  getUserFullName,
} from "../../utilities";
import { transformAddressDetailsForAddressBlockForm } from "../utils/address-utils";
import { InstitutionLocationAPIOutDTO } from "../institution-locations/models/institution-location.dto";
import { InstitutionLocationControllerService } from "../institution-locations/institution-location.controller.service";

/**
 * Institution controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution")
@ApiTags(`${ClientTypeBaseRoute.Institution}-institution`)
export class InstitutionInstitutionsController extends BaseController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly institutionControllerService: InstitutionControllerService,
    private readonly userService: UserService,
    private readonly bceidAccountService: BCeIDService,
    private readonly locationService: InstitutionLocationService,
    private readonly locationControllerService: InstitutionLocationControllerService,
  ) {
    super();
  }

  /**
   * Create institution on Institution setup process.
   * @param payload
   * @param userToken
   * @returns Primary identifier of the created resource.
   */
  @ApiUnprocessableEntityResponse({
    description: "Institution user already exist",
  })
  @Post()
  async createInstitution(
    @Body() payload: InstitutionFormAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    // Check user exists or not
    const existingUser = await this.userService.getUser(userToken.userName);
    if (existingUser) {
      throw new UnprocessableEntityException("Institution User already exists");
    }

    // Save institution
    const institution =
      await this.institutionService.createInstitutionWithAssociatedUser(
        payload,
        userToken,
      );

    return {
      id: institution.id,
    };
  }

  /**
   * Controller method to get all institution users for institution Admin.
   * @queryParm page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @queryParm pageLimit, page size or records per page, if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @queryParm searchCriteria, user's name keyword to be searched
   * @queryParm sortField, field to be sorted
   * @queryParm sortOrder, order to be sorted
   * @returns All the institution users for the given institution
   * with total count.
   */
  @IsInstitutionAdmin()
  @Get("user")
  async getInstitutionUsers(
    @Query(PaginationParams.SearchCriteria) searchCriteria: string,
    @Query(PaginationParams.SortField) sortField: string,
    @UserToken() user: IInstitutionUserToken,
    @Query(PaginationParams.SortOrder) sortOrder = FieldSortOrder.ASC,
    @Query(PaginationParams.Page) page = DEFAULT_PAGE_NUMBER,
    @Query(PaginationParams.PageLimit) pageLimit = DEFAULT_PAGE_LIMIT,
  ): Promise<PaginatedResults<InstitutionUserAPIOutDTO>> {
    return this.institutionControllerService.getInstitutionUsers(
      user.authorizations.institutionId,
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
   * Get institution details of given institution.
   * @returns Institution details.
   */
  @IsInstitutionAdmin()
  @Get()
  async getInstitutionDetail(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionDetailAPIOutDTO> {
    const institutionDetail =
      await this.institutionControllerService.getInstitutionDetail(
        token.authorizations.institutionId,
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
   * @param payload
   */
  @IsInstitutionAdmin()
  @Patch()
  async update(
    @Body() payload: InstitutionContactAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    await this.institutionService.updateInstitution(
      userToken.authorizations.institutionId,
      payload,
    );
  }

  /**
   * Create an Institution user.
   * @param payload
   * @param user
   * @returns Primary identifier of the created resource.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "User to be added either not found in BCeID Account Service or does not belong to same institution of logged in user.",
  })
  @IsInstitutionAdmin()
  @Post("user")
  async createInstitutionUserWithAuth(
    @Body() payload: InstitutionUserAPIInDTO,
    @UserToken() user: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    // Get institution
    const institution = await this.institutionService.getInstituteByUserName(
      user.userName,
    );

    // Find user on BCeID Web Service
    const bceidUserAccount = await this.bceidAccountService.getAccountDetails(
      payload.userId,
    );
    if (!bceidUserAccount) {
      throw new UnprocessableEntityException(
        "User to be added not found on BCeID Web Service.",
      );
    }
    // Check if the user being added to th institution belongs to the institution.
    if (
      institution.guid.toLowerCase() !==
      bceidUserAccount.institution.guid.toLowerCase()
    ) {
      throw new UnprocessableEntityException(
        "User to be added not found under the institution.",
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

    // Create the user and the related records.
    const createdInstitutionUser =
      await this.institutionService.createInstitutionUser(
        institution.id,
        bceidUserAccount,
        payload,
      );

    return { id: createdInstitutionUser.id };
  }

  /**
   * Get Institution user types and roles.
   * @returns Institution user types and roles.
   */
  @IsInstitutionAdmin()
  @Get("user-types-roles")
  async getUserTypesAndRoles(): Promise<InstitutionUserTypeAndRoleAPIOutDTO> {
    return this.institutionService.getUserTypesAndRoles();
  }

  /**
   * Get institution user by user name(guid).
   * @param userName
   * @returns Institution user details.
   */
  @ApiNotFoundResponse({
    description: "User not found.",
  })
  @ApiUnprocessableEntityResponse({
    description: "User not active.",
  })
  @ApiForbiddenResponse({
    description:
      "Details requested for user who does not belong to the institution of logged in user.",
  })
  @IsInstitutionAdmin()
  @Get("user/:userName")
  async getInstitutionUserByUserName(
    @Param("userName") userName: string,
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionUserAPIOutDTO> {
    // Get institutionUser
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(userName);

    if (!institutionUser) {
      throw new NotFoundException("User not found.");
    }
    // disabled users details can't be edited
    if (!institutionUser.user.isActive) {
      throw new UnprocessableEntityException("Not an Active User.");
    }
    // checking if user belong to logged-in users institution
    if (institutionUser.institution.id !== token.authorizations.institutionId) {
      throw new ForbiddenException(
        "Details requested for user who does not belong to the institution of logged in user.",
      );
    }
    return {
      id: institutionUser.id,
      user: {
        firstName: institutionUser.user?.firstName,
        lastName: institutionUser.user?.lastName,
        userName: institutionUser.user?.userName,
        isActive: institutionUser.user?.isActive,
        id: institutionUser.user?.id,
        email: institutionUser.user.email,
      },
      authorizations: institutionUser.authorizations?.map((el) => {
        return {
          location: {
            name: el.location?.name,
            data: el.location?.data,
            id: el.location?.id,
          },
          authType: { type: el.authType?.type, role: el.authType?.role },
        };
      }),
    };
  }

  /**
   * Update the permissions of institution user.
   * @param token
   * @param userName
   * @param payload
   */
  @ApiNotFoundResponse({
    description: "User to be updated not found.",
  })
  @ApiForbiddenResponse({
    description:
      "User to be updated does not belong to the institution of logged in user.",
  })
  @IsInstitutionAdmin()
  @Patch("user/:userName")
  async updateInstitutionUserWithAuth(
    @UserToken() token: IInstitutionUserToken,
    @Param("userName") userName: string,
    @Body() payload: InstitutionUserPermissionAPIInDTO,
  ): Promise<void> {
    // Check its a active user
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(userName);

    if (!institutionUser) {
      throw new NotFoundException("User to be updated not found");
    }

    // checking if user belong to logged-in users institution
    if (institutionUser.institution.id !== token.authorizations.institutionId) {
      throw new ForbiddenException(
        "User to be updated does not belong to the institution of logged in user.",
      );
    }

    /** A legal signing authority role can be added to only one user per institution */
    const addLegalSigningAuthorityExist = payload.permissions.some(
      (role) => role.userRole === InstitutionUserRoles.legalSigningAuthority,
    );

    if (addLegalSigningAuthorityExist) {
      const legalSigningAuthority =
        await this.institutionService.checkLegalSigningAuthority(
          token.authorizations.institutionId,
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

  /**
   * Update the active status of the user.
   * @param token
   * @param userName
   * @param body
   */
  @ApiNotFoundResponse({
    description: "User to be updated not found.",
  })
  @ApiForbiddenResponse({
    description:
      "User to be updated doesn't belong to institution of logged in user.",
  })
  @IsInstitutionAdmin()
  @Patch("user-status/:userName")
  async updateUserStatus(
    @UserToken() token: IInstitutionUserToken,
    @Param("userName") userName: string,
    @Body() body: UserActiveStatusAPIInDTO,
  ): Promise<void> {
    // Check  user exists or not
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(userName);

    if (!institutionUser) {
      throw new NotFoundException("Institution user to be updated not found.");
    }

    // checking if user belong to logged-in users institution
    if (institutionUser.institution.id !== token.authorizations.institutionId) {
      throw new ForbiddenException(
        "User to be updated doesn't belong to institution of logged in user.",
      );
    }
    await this.userService.updateUserStatus(
      institutionUser.user.id,
      body.isActive,
    );
  }

  /**
   * Get details of user who is logged in.
   * @param token
   * @returns User details.
   */
  @Get("my-details")
  async getMyDetails(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionUserDetailAPIOutDTO> {
    // Get logged in user and location details with auth
    const userDetails = await this.userService.getUser(token.userName);
    const user = {
      firstName: userDetails?.firstName,
      lastName: userDetails?.lastName,
      isActive: userDetails?.isActive,
      userFullName: getUserFullName(userDetails),
      isAdmin: token.authorizations.isAdmin(),
      email: userDetails?.email,
    };
    const authorizations = {
      institutionId: token.authorizations.institutionId,
      authorizations: token.authorizations.authorizations.map((el) => {
        return {
          locationId: el.locationId,
          userType: el.userType,
          userRole: el.userRole,
        };
      }),
    };
    return {
      user: user,
      authorizations: authorizations,
    };
  }

  /**
   * Get Location details of logged in user.
   * @param userToken
   * @returns Location details.
   */
  @Get("my-locations")
  async getMyInstitutionLocations(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionUserLocationsAPIOutDTO[]> {
    // get all institution locations that user has access too.
    const InstitutionLocationData =
      await this.locationService.getMyInstitutionLocations(
        userToken.authorizations.getLocationsIds(),
      );
    return InstitutionLocationData.map((el) => {
      return {
        id: el.id,
        name: el.name,
        address: {
          addressLine1: el.data.address?.addressLine1,
          addressLine2: el.data.address?.addressLine2,
          provinceState: el.data.address?.provinceState,
          country: el.data.address?.country,
          city: el.data.address?.city,
          postalCode: el.data.address?.postalCode,
        },
      };
    });
  }

  /**
   * Check if an Institution exist.
   ** Returns HTTP 404 if institution does not exist.
   ** Otherwise return HTTP 200.
   * @param guid
   */
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
   * API to get the lookup values for admin role.
   **Note: There are are more than one type of admin role. Basic admin has role as NULL rest of them have role name.
   **This API is exclusively for admin roles and does not include other non-admin roles.
   * @returns Admin Roles.
   */
  @IsInstitutionAdmin()
  @Get("admin-roles")
  async getAdminRoles(): Promise<UserRoleOptionAPIOutDTO[]> {
    const userRoles = await this.institutionService.getAdminRoles();
    /** This API is to feed the values to drop-down component. Name and code have same value in this scenario. */
    return userRoles.map((role) => ({
      name: role.role || role.type,
      code: role.role || role.type,
    }));
  }

  @Patch("sync")
  async sync(@UserToken() token: IInstitutionUserToken) {
    await this.institutionService.syncInstitution(token);
  }

  /**
   * Controller method to get institution locations with designation status for the given institution.
   * @param userToken
   * @returns Details of all locations of an institution.
   */
  @IsInstitutionAdmin()
  @Get("locations")
  async getAllInstitutionLocations(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    // get all institution locations with designation statuses.
    return this.locationControllerService.getInstitutionLocations(
      userToken.authorizations.institutionId,
    );
  }
}
