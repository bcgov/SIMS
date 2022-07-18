import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { DataSource } from "typeorm";
import { InstitutionUserAuth } from "../../database/entities";
import { InstitutionUserAuthorizations } from "./institution-user-auth.models";
import {
  InstitutionUserRoles,
  InstitutionUserTypes,
} from "../../auth/user-types.enum";
import { InstitutionLocationService } from "..";

@Injectable()
export class InstitutionUserAuthService extends RecordDataModelService<InstitutionUserAuth> {
  constructor(
    dataSource: DataSource,
    private readonly locationService: InstitutionLocationService,
  ) {
    super(dataSource.getRepository(InstitutionUserAuth));
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
}
