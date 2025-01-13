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
  getUserFullName,
} from "../../utilities";
import { CustomNamedError } from "@sims/utilities";
import { InstitutionUser } from "@sims/sims-db";
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
import { InstitutionUserTypes } from "../../auth";

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
   * @param institutionId id of the institution to retrieve users.
   * @param paginationOptions pagination options.
   * @returns Institution users.
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
      results: institutionUsers.map((institutionUser: InstitutionUser) =>
        this.transformToInstitutionUserAPIOutDTO(institutionUser),
      ),
      count: count,
    };
  }

  /**
   * Util method to transform institution users to DTO.
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
        id: institutionUser.id,
        email: institutionUser.user.email,
        firstName: institutionUser.user.firstName,
        lastName: institutionUser.user.lastName,
        userName: institutionUser.user.userName,
        isActive: institutionUser.user.isActive,
        userFullName: getUserFullName(institutionUser.user),
      },
    };
  }

  /**
   * Create a user, associate with the institution, and assign the authorizations.
   * @param institutionId institution to have the user associated.
   * @param payload user and authorization information.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param allowedAccountTypes types of BCeID accounts that can be created. For instance,
   * basic BCeID accounts are allowed to be created only by the Ministry users.
   * @returns created user id.
   */
  async createInstitutionUserWithAuth(
    institutionId: number,
    payload: CreateInstitutionUserAPIInDTO,
    auditUserId: number,
    ...allowedAccountTypes: BCeIDAccountTypeCodes[]
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

    if (!allowedAccountTypes.includes(accountType)) {
      throw new ForbiddenException(
        "The user is not allowed to create the requested BCeID account type.",
      );
    }

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
          auditUserId,
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
   * @param institutionUserId institution user id to have the permissions updated.
   * @param payload user and authorization information.
   * @param ensureHasAdmin if true, will ensure that at least one admin is present, otherwise
   * will allow that all institution admins are removed or disabled.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param authorizedInstitutionId optional institution to check for user authorization.
   * @returns created user id.
   */
  async updateInstitutionUserWithAuth(
    institutionUserId: number,
    payload: UpdateInstitutionUserAPIInDTO,
    ensureHasAdmin: boolean,
    auditUserId: number,
    authorizedInstitutionId?: number,
  ): Promise<void> {
    const institutionUser =
      await this.institutionService.getInstitutionUserById(institutionUserId);

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
        auditUserId,
        ensureHasAdmin,
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
   * Get institution user by institution user id.
   * @param institutionUserId institution user id to have the permissions updated.
   * @param authorizedInstitutionId optional institution to check for user authorization.
   * @returns institution user details.
   */
  async getInstitutionUserById(
    institutionUserId: number,
    authorizedInstitutionId?: number,
  ): Promise<InstitutionUserAPIOutDTO> {
    const institutionUser =
      await this.institutionService.getInstitutionUserById(institutionUserId);

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
        userFullName: getUserFullName(institutionUser.user),
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
   * @param institutionUserId institution user id to have the permissions updated.
   * @param payload information to enable or disable the user.
   * @param ensureHasAdmin if true, will ensure that at least one admin is present, otherwise
   * will allow that all institution admins are removed or disabled.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param authorizedInstitutionId when provided will validate if the
   * user belongs to the institution.
   */
  async updateUserStatus(
    institutionUserId: number,
    payload: UserActiveStatusAPIInDTO,
    ensureHasAdmin: boolean,
    auditUserId: number,
    authorizedInstitutionId?: number,
  ): Promise<void> {
    const institutionUser =
      await this.institutionService.getInstitutionUserById(institutionUserId);

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

      if (ensureHasAdmin) {
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
    }

    await this.userService.updateUserStatus(
      institutionUser.user.id,
      payload.isActive,
      auditUserId,
    );
  }
}
