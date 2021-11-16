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
} from "../../services";
import {
  CreateInstitutionDto,
  InstitutionDetailDto,
  InstitutionDto,
  SearchInstitutionRespDto,
} from "./models/institution.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import { INSTITUTION_TYPE_BC_PRIVATE } from "../../utilities";
import {
  InstitutionUserRespDto,
  InstitutionLocationUserAuthDto,
  InstitutionUserAuthorizations,
  InstitutionUserAndAuthDetailsDto,
  InstitutionUserAuth,
} from "./models/institution.user.res.dto";
import { InstitutionUserAuthDto } from "./models/institution-user-auth.dto";
import {
  InstitutionUserTypeAndRoleResponseDto,
  InstitutionUserPermissionDto,
} from "./models/institution-user-type-role.res.dto";
import { UserDto } from "../user/models/user.dto";
import {
  AllowAuthorizedParty,
  IsInstitutionAdmin,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { InstitutionLocationsSummaryDto } from "../institution-locations/models/institution-location.dto";
import { Authorizations } from "../../services/institution-user-auth/institution-user-auth.models";
import { InstitutionLocation } from "../../database/entities/institution-location.model";
import { UserGroups } from "../../auth/user-groups.enum";
import { Groups } from "../../auth/decorators";
import { Institution } from "src/database/entities";

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
  async institutionDetail(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionDetailDto> {
    const institutionDetail = await this.institutionService.institutionDetail(
      token,
    );
    const isBCPrivate =
      INSTITUTION_TYPE_BC_PRIVATE ===
      institutionDetail.institution.institutionType;
    return {
      institution: {
        userFirstName: institutionDetail.institution.userFirstName,
        userLastName: institutionDetail.institution.userLastName,
        userEmail: institutionDetail.institution.userEmail,
        legalOperatingName: institutionDetail.institution.legalOperatingName,
        operatingName: institutionDetail.institution.operatingName,
        primaryPhone: institutionDetail.institution.primaryPhone,
        primaryEmail: institutionDetail.institution.primaryEmail,
        website: institutionDetail.institution.website,
        regulatingBody: institutionDetail.institution.regulatingBody,
        establishedDate: institutionDetail.institution.establishedDate,
        primaryContactEmail: institutionDetail.institution.primaryContactEmail,
        primaryContactFirstName:
          institutionDetail.institution.primaryContactFirstName,
        primaryContactLastName:
          institutionDetail.institution.primaryContactLastName,
        primaryContactPhone: institutionDetail.institution.primaryContactPhone,
        legalAuthorityEmail: institutionDetail.institution.legalAuthorityEmail,
        legalAuthorityFirstName:
          institutionDetail.institution.legalAuthorityFirstName,
        legalAuthorityLastName:
          institutionDetail.institution.legalAuthorityLastName,
        legalAuthorityPhone: institutionDetail.institution.legalAuthorityPhone,
        addressLine1: institutionDetail.institution.addressLine1,
        addressLine2: institutionDetail.institution.addressLine2,
        city: institutionDetail.institution.city,
        country: institutionDetail.institution.country,
        provinceState: institutionDetail.institution.provinceState,
        postalCode: institutionDetail.institution.postalCode,
        institutionType: institutionDetail.institution.institutionType,
      },
      account: {
        user: {
          guid: institutionDetail.account.user.guid,
          displayName: institutionDetail.account.user.displayName,
          firstname: institutionDetail.account.user.firstname,
          surname: institutionDetail.account.user.surname,
          email: institutionDetail.account.user.email,
        },
        institution: {
          guid: institutionDetail.account.institution.guid,
          legalName: institutionDetail.account.institution.legalName,
        },
      },
      isBCPrivate: isBCPrivate,
    };
  }

  @Patch("/sync")
  async sync(@UserToken() token: IInstitutionUserToken) {
    await this.institutionService.syncInstitution(token);
  }

  @IsInstitutionAdmin()
  @Get("/users")
  async allUsers(
    @UserToken() user: IInstitutionUserToken,
  ): Promise<InstitutionUserRespDto[]> {
    const institution = await this.institutionService.getInstituteByUserName(
      user.userName,
    );
    const allInstitutionUsers = await this.institutionService.allUsers(
      institution.id,
    );
    return allInstitutionUsers.map((institutionUser) => {
      const institutionUserResp: InstitutionUserRespDto = {
        id: institutionUser.id,
        authorizations: institutionUser.authorizations.map((auth) => ({
          id: auth.id,
          authType: {
            role: auth.authType?.role,
            type: auth.authType?.type,
          },
          location: {
            name: auth.location?.name,
          },
        })),
        user: {
          email: institutionUser.user.email,
          firstName: institutionUser.user.firstName,
          lastName: institutionUser.user.lastName,
          userName: institutionUser.user.userName,
          isActive: institutionUser.user.isActive,
        },
      };
      return institutionUserResp;
    });
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
    return searchInstitutions.map((eachinstitution: Institution) => ({
      id: eachinstitution.id,
      legalName: eachinstitution.legalOperatingName,
      operatingName: eachinstitution.operatingName,
      address: {
        addressLine1: eachinstitution.institutionAddress.addressLine1,
        addressLine2: eachinstitution.institutionAddress.addressLine2,
        city: eachinstitution.institutionAddress.city,
        provinceState: eachinstitution.institutionAddress.provinceState,
        country: eachinstitution.institutionAddress.country,
        postalCode: eachinstitution.institutionAddress.postalCode,
        phone: eachinstitution.institutionAddress.phone,
      },
    }));
  }
}
