import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { InstitutionUserAuth } from "../../database/entities";
import { InstitutionUserAuthorizations } from "./institution-user-auth.models";
import {
  InstitutionUserRoles,
  InstitutionUserTypes,
} from "../../auth/user-types.enum";
import { InstitutionLocationService } from "../institution-location/institution-location.service";

@Injectable()
export class InstitutionUserAuthService extends RecordDataModelService<InstitutionUserAuth> {
  constructor(
    connection: Connection,
    private readonly locationService: InstitutionLocationService,
  ) {
    super(connection.getRepository(InstitutionUserAuth));
  }

  async getAuthorizationsByUserName(
    userName: string,
  ): Promise<InstitutionUserAuthorizations> {
    const userAuthorizations = await this.repo
      .createQueryBuilder("userAuth")
      .leftJoin("userAuth.institutionUser", "institutionUser")
      .leftJoin("institutionUser.user", "user")
      .leftJoin("userAuth.authType", "authType")
      .where("user.user_name = :userName", { userName })
      .select([
        "userAuth.institution_location_id",
        "institutionUser.institution_id",
        "authType.user_type",
        "authType.user_role",
      ])
      .getRawMany();

    if (userAuthorizations.length) {
      // Load all the authorizations (admin and locations).
      const authorizations = userAuthorizations.map((auth) => ({
        locationId: auth.institution_location_id as number,
        userType: auth.user_type as InstitutionUserTypes,
        userRole: auth.user_role as InstitutionUserRoles,
      }));
      const institutionId = userAuthorizations[0].institution_id;

      const userInstitutionAuthorizations = new InstitutionUserAuthorizations(
        institutionId,
        authorizations,
      );
      if (userInstitutionAuthorizations.isAdmin()) {
        userInstitutionAuthorizations.adminLocationsIds =
          await this.locationService.getInstitutionLocationsIds(institutionId);
      }

      return userInstitutionAuthorizations;
    }

    return new InstitutionUserAuthorizations();
  }

  /**
   * The users associated with an institution by its user type (e.g. admin, user).
   * @param institutionId institution to be searched.
   * @param userType user type to be searched.
   * @param isActive optionally filter by the user active status.
   * @returns users that belongs to the institution and are the type specified by
   * the userType parameter.
   */
  async getUsersByUserType(
    institutionId: number,
    userType: InstitutionUserTypes,
    isActive?: boolean,
  ): Promise<InstitutionUserAuth[]> {
    const getUsersQuery = this.repo
      .createQueryBuilder("institutionUserAuth")
      .select([
        "institutionUserAuth.id",
        "institutionUser.id",
        "institution.id",
        "authType.id",
      ])
      .innerJoin("institutionUserAuth.institutionUser", "institutionUser")
      .innerJoin("institutionUser.user", "user")
      .innerJoin("institutionUser.institution", "institution")
      .innerJoin("institutionUserAuth.authType", "authType")
      .where("institution.id = :institutionId", { institutionId })
      .andWhere("authType.type = :userType", { userType });
    if (isActive) {
      getUsersQuery.andWhere("user.isActive = :isActive", { isActive });
    }
    return getUsersQuery.getMany();
  }

  /**
   * The users associated with an institution by its user role (e.g. legal-signing-authority).
   * @param institutionId institution to be searched.
   * @param userRole user role to be searched.
   * @returns users that belongs to the institution and are the type specified by
   * the userRole parameter.
   */
  async getUsersByUserRole(
    institutionId: number,
    userRole: InstitutionUserRoles,
  ): Promise<InstitutionUserAuth[]> {
    return this.repo
      .createQueryBuilder("userAuth")
      .select(["userAuth.id", "user.id", "user.userName", "institutionUser.id"])
      .innerJoin("userAuth.institutionUser", "institutionUser")
      .innerJoin("institutionUser.user", "user")
      .innerJoin("userAuth.authType", "authType")
      .innerJoin("institutionUser.institution", "institution")
      .where("institution.id = :institutionId", { institutionId })
      .andWhere("authType.role = :userRole", { userRole })
      .getMany();
  }

  /**
   * Get the legal signing authority assigned to an Institution.
   * Only one user is supposed to have the role assigned.
   * @param institutionId institution to be searched.
   * @returns institution user authority, if present.
   */
  async getLegalSigningAuthority(
    institutionId: number,
  ): Promise<InstitutionUserAuth> {
    const userRoles = await this.getUsersByUserRole(
      institutionId,
      InstitutionUserRoles.legalSigningAuthority,
    );
    const [legalSigningAuthority] = userRoles;
    return legalSigningAuthority;
  }
}
