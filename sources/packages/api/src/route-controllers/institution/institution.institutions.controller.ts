import {
  Body,
  Controller,
  Patch,
  Get,
  Post,
  UnprocessableEntityException,
  Query,
  Param,
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  AllowInactiveUser,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import {
  InstitutionService,
  UserService,
  BCeIDService,
  InstitutionLocationService,
} from "../../services";
import {
  InstitutionContactAPIInDTO,
  InstitutionDetailAPIOutDTO,
  CreateInstitutionAPIInDTO,
} from "./models/institution.dto";

import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import {
  InstitutionUserAPIOutDTO,
  CreateInstitutionUserAPIInDTO,
  UpdateInstitutionUserAPIInDTO,
  UserActiveStatusAPIInDTO,
  InstitutionUserDetailAPIOutDTO,
  InstitutionUserLocationsAPIOutDTO,
  InstitutionUserStatusAPIOutDTO,
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
import { BCeIDAccountTypeCodes } from "../../services/bceid/bceid.models";

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
   * Creates an institution during institution setup process when the
   * institution profile and the user are created and associated altogether.
   * @param payload information from the institution and the user.
   * @returns primary identifier of the created resource.
   */
  @ApiUnprocessableEntityResponse({
    description: "Institution user already exist",
  })
  @Post()
  async createInstitutionWithAssociatedUser(
    @Body() payload: CreateInstitutionAPIInDTO,
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
   * Create a user, associate with the institution, and assign the authorizations.
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
  @IsInstitutionAdmin()
  @Post("user")
  async createInstitutionUserWithAuth(
    @UserToken() userToken: IInstitutionUserToken,
    @Body() payload: CreateInstitutionUserAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.institutionControllerService.createInstitutionUserWithAuth(
      userToken.authorizations.institutionId,
      payload,
    );
  }

  /**
   * Get the user status from institution perspective returning the
   * possible user and institution association.
   * @returns information to support the institution login process and
   * the decisions that need happen to complete the process.
   */
  @AllowInactiveUser()
  @Get("user/status")
  async getInstitutionUserStatus(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionUserStatusAPIOutDTO> {
    const status = {} as InstitutionUserStatusAPIOutDTO;
    status.isExistingUser = !!token.userId;
    status.isActiveUser = token.isActive;
    if (status.isExistingUser) {
      // If the user exists there is no need to return any additional data.
      return status;
    }
    // Try to find the business BCeID user on BCeID Web Service.
    // For basic BCeID user the information isExistingUser and isActiveUser
    // are enough to define if the user can complete the login or not.
    const businessBCeIDUserAccount =
      await this.bceidAccountService.getAccountDetails(
        token.idp_user_name,
        BCeIDAccountTypeCodes.Business,
      );
    if (businessBCeIDUserAccount) {
      status.hasBusinessBCeIDAccount = true;
      // Check if the institution associated with the BCeID business guid is already present.
      status.associatedInstitutionExists =
        await this.institutionService.doesExist(
          businessBCeIDUserAccount.institution.guid,
        );
    }
    return status;
  }

  /**
   * Get institution user by user name(guid).
   * @param userName user name (guid).
   * @returns institution user details.
   */
  @ApiNotFoundResponse({
    description: "User not found.",
  })
  @ApiForbiddenResponse({
    description:
      "Details requested for user who does not belong to the institution.",
  })
  @IsInstitutionAdmin()
  @Get("user/:userName")
  async getInstitutionUserByUserName(
    @Param("userName") userName: string,
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionUserAPIOutDTO> {
    return this.institutionControllerService.getInstitutionUserByUserName(
      userName,
      token.authorizations.institutionId,
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
  @ApiForbiddenResponse({
    description:
      "User to be updated does not belong to the institution of logged in user.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "The user is not active" +
      " or the user permission is being updated in a way that no admin will be present" +
      " or a second legal signing authority is trying to be set and only one is allowed.",
  })
  @IsInstitutionAdmin()
  @Patch("user/:userName")
  async updateInstitutionUserWithAuth(
    @UserToken() token: IInstitutionUserToken,
    @Param("userName") userName: string,
    @Body() payload: UpdateInstitutionUserAPIInDTO,
  ): Promise<void> {
    await this.institutionControllerService.updateInstitutionUserWithAuth(
      userName,
      payload,
      token.authorizations.institutionId,
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
  @ApiForbiddenResponse({
    description:
      "User to be updated doesn't belong to institution of logged in user.",
  })
  @IsInstitutionAdmin()
  @Patch("user-status/:userName")
  async updateUserStatus(
    @UserToken() token: IInstitutionUserToken,
    @Param("userName") userName: string,
    @Body() payload: UserActiveStatusAPIInDTO,
  ): Promise<void> {
    await this.institutionControllerService.updateUserStatus(
      userName,
      payload,
      token.authorizations.institutionId,
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
