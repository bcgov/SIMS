import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  BCeIDService,
  InstitutionService,
  InstitutionUserAuthService,
  UserService,
} from "../../services";
import {
  PaginationOptions,
  PaginatedResults,
  CustomNamedError,
} from "../../utilities";
import { InstitutionUser } from "../../database/entities";
import {
  CreateInstitutionUserAPIInDTO,
  InstitutionUserAPIOutDTO,
  UpdateInstitutionUserAPIInDTO,
  UserActiveStatusAPIInDTO,
} from "./models/institution-user.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { BCeIDAccountTypeCodes } from "../../services/bceid/bceid.models";
import { ApiProcessError } from "../../types";
import {
  BCEID_ACCOUNT_NOT_FOUND,
  INSTITUTION_MUST_HAVE_AN_ADMIN,
  INSTITUTION_USER_ALREADY_EXISTS,
  LEGAL_SIGNING_AUTHORITY_EXIST,
} from "../../constants";
import { InstitutionUserTypes } from "../../auth/user-types.enum";

/**
 * Service/Provider for Institutions controller to wrap the common methods.
 */
@Injectable()
export class InstitutionUserControllerService {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly bceIDService: BCeIDService,
    private readonly userService: UserService,
    private readonly institutionUserAuthService: InstitutionUserAuthService,
  ) {}

  /**
   * Get institution users with page, sort and search.
   * @param institutionId
   * @param paginationOptions
   * @returns Institution Users.
   */
  async getInstitutionUsers(
    institutionId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<InstitutionUserAPIOutDTO>> {
    const [institutionUsers, count] =
      await this.institutionService.getInstitutionUsers(
        institutionId,
        paginationOptions,
      );

    return {
      results: institutionUsers.map((eachInstitutionUser: InstitutionUser) => {
        return this.transformToInstitutionUserAPIOutDTO(eachInstitutionUser);
      }),
      count: count,
    };
  }

  /**
   * Util to transform institution users to DTO.
   * @param institutionUser institution user to be converted to the DTO.
   * @returns institution user DTO.
   */
  private transformToInstitutionUserAPIOutDTO(
    institutionUser: InstitutionUser,
  ): InstitutionUserAPIOutDTO {
    return {
      id: institutionUser.id,
      authorizations: institutionUser.authorizations.map((authorization) => ({
        id: authorization.id,
        authType: {
          role: authorization.authType?.role,
          type: authorization.authType?.type,
        },
        location: {
          name: authorization.location?.name,
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
  }

  /**
   * Create a user, associate with the institution, and assign the authorizations.
   * @param institutionId institution to have the user associated.
   * @param payload user and authorization information.
   * @returns created user id.
   */
  async createInstitutionUserWithAuth(
    institutionId: number,
    payload: CreateInstitutionUserAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const institution =
      await this.institutionService.getBasicInstitutionDetailById(
        institutionId,
      );

    if (!institution) {
      throw new NotFoundException("Institution not found.");
    }

    const accountType = institution.businessGuid
      ? BCeIDAccountTypeCodes.Business
      : BCeIDAccountTypeCodes.Individual;

    // Find user on BCeID Web Service
    const bceidUserAccount = await this.bceIDService.getAccountDetails(
      payload.bceidUserId,
      accountType,
    );
    if (!bceidUserAccount) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "User not found on BCeID.",
          BCEID_ACCOUNT_NOT_FOUND,
        ),
      );
    }
    // Check if the user being added to the institution belongs to the institution.
    // This check is only possible and needed for institutions that have a business guid associated wth.
    if (
      accountType === BCeIDAccountTypeCodes.Business &&
      institution.businessGuid.toLowerCase() !==
        bceidUserAccount.institution.guid.toLowerCase()
    ) {
      throw new UnprocessableEntityException(
        "User to be added not found under the institution.",
      );
    }

    try {
      // Create the user and the related records.
      const createdInstitutionUser =
        await this.institutionService.createInstitutionUser(
          institution.id,
          bceidUserAccount,
          payload,
        );
      return { id: createdInstitutionUser.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case INSTITUTION_USER_ALREADY_EXISTS:
          case LEGAL_SIGNING_AUTHORITY_EXIST:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
          default:
            throw error;
        }
      }
      throw error;
    }
  }

  /**
   * Update the user authorizations for the institution user.
   * @param userName unique user name to have the authorizations updated.
   * @param payload user and authorization information.
   * @param authorizedInstitutionId optional institution to check for user authorization.
   * @returns created user id.
   */
  async updateInstitutionUserWithAuth(
    userName: string,
    payload: UpdateInstitutionUserAPIInDTO,
    authorizedInstitutionId?: number,
  ): Promise<void> {
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(userName);

    if (!institutionUser) {
      throw new NotFoundException("User to be updated not found.");
    }

    if (institutionUser.user.isActive !== true) {
      throw new UnprocessableEntityException(
        "Not able to edit an inactive user.",
      );
    }

    // Checking if the user belongs to the institution.
    if (
      authorizedInstitutionId &&
      institutionUser.institution.id !== authorizedInstitutionId
    ) {
      throw new ForbiddenException(
        "User to be updated does not belong to the institution.",
      );
    }

    try {
      await this.institutionService.updateInstitutionUser(
        institutionUser.institution.id,
        institutionUser.id,
        payload.permissions,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case INSTITUTION_MUST_HAVE_AN_ADMIN:
          case LEGAL_SIGNING_AUTHORITY_EXIST:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
          default:
            throw error;
        }
      }
      throw error;
    }
  }

  /**
   * Get institution user by user name(guid).
   * @param userName user name (guid).
   * @param authorizedInstitutionId optional institution to check for user authorization.
   * @returns institution user details.
   */
  async getInstitutionUserByUserName(
    userName: string,
    authorizedInstitutionId?: number,
  ): Promise<InstitutionUserAPIOutDTO> {
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(userName);

    if (!institutionUser) {
      throw new NotFoundException("User not found.");
    }

    // Checking if the user belongs to the institution.
    if (
      authorizedInstitutionId &&
      institutionUser.institution.id !== authorizedInstitutionId
    ) {
      throw new ForbiddenException(
        "Details requested for user who does not belong to the institution.",
      );
    }
    return {
      id: institutionUser.id,
      user: {
        firstName: institutionUser.user.firstName,
        lastName: institutionUser.user.lastName,
        userName: institutionUser.user.userName,
        isActive: institutionUser.user.isActive,
        id: institutionUser.user.id,
        email: institutionUser.user.email,
      },
      authorizations: institutionUser.authorizations.map((authorization) => ({
        location: {
          name: authorization.location?.name,
          data: authorization.location?.data,
          id: authorization.location?.id,
        },
        authType: {
          type: authorization.authType.type,
          role: authorization.authType.role,
        },
      })),
    };
  }

  /**
   * Update the active status of the user.
   * @param userName unique name of the user to be updated.
   * @param payload information to enable or disable the user.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param authorizedInstitutionId when provided will validate if the
   * user belongs to the institution.
   */
  async updateUserStatus(
    userName: string,
    payload: UserActiveStatusAPIInDTO,
    auditUserId: number,
    authorizedInstitutionId?: number,
  ): Promise<void> {
    const institutionUser =
      await this.institutionService.getInstitutionUserByUserName(userName);

    if (!institutionUser) {
      throw new NotFoundException("Institution user to be updated not found.");
    }

    // Check if the user is associated with the provided institution.
    if (
      authorizedInstitutionId &&
      institutionUser.institution.id !== authorizedInstitutionId
    ) {
      throw new ForbiddenException(
        "User to be updated doesn't belong to institution of logged in user.",
      );
    }

    if (!payload.isActive) {
      // Check id the user is not trying to disable his own institution user.
      if (institutionUser.user.id === auditUserId) {
        throw new UnprocessableEntityException(
          "The user is not allowed to disable his own institution user.",
        );
      }

      // Case the user is being disabled check if it is the only admin for the institution.
      // Institutions must always have at least one admin user enabled.
      const admins = await this.institutionUserAuthService.getUsersByUserType(
        institutionUser.institution.id,
        InstitutionUserTypes.admin,
        true,
      );
      if (admins?.length === 1) {
        // If there is only one admin user, check if it is the one being disabled.
        const [admin] = admins;
        if (admin.institutionUser.id === institutionUser.id) {
          throw new UnprocessableEntityException(
            new ApiProcessError(
              "The user cannot be disabled because it is the only administrator present on the institution.",
              INSTITUTION_MUST_HAVE_AN_ADMIN,
            ),
          );
        }
      }
    }

    await this.userService.updateUserStatus(
      institutionUser.user.id,
      payload.isActive,
    );
  }
}
