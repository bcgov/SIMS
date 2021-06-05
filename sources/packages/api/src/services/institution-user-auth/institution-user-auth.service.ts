import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { InstitutionUserAuth } from "../../database/entities";
import {
  InstitutionUserAuthorizations,
  LocationAuthorizations,
} from "./institution-user-auth.models";
import {
  InstitutionUserRoles,
  InstitutionUserTypes,
} from "../../auth/user-types.enum";

@Injectable()
export class InstitutionUserAuthService extends RecordDataModelService<InstitutionUserAuth> {
  constructor(@Inject("Connection") connection: Connection) {
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
        "authType.user_type",
        "authType.user_role",
      ])
      .getRawMany();

    // Create the object to be returned.
    let authorizations: InstitutionUserAuthorizations;

    if (userAuthorizations.length) {
      // Check if the user is admin. Only one record should exist.
      const isAdmin = userAuthorizations.some(
        (auth) => auth.user_type === InstitutionUserTypes.admin,
      );

      if (isAdmin) {
        authorizations = new InstitutionUserAuthorizations(isAdmin);
      } else {
        // If not an admin, load the locations authorizations.
        const locationsAuthorizations = userAuthorizations.map((auth) => ({
          locationId: auth.institution_location_id as number,
          userType: auth.user_type as InstitutionUserTypes,
          userRole: auth.user_role as InstitutionUserRoles,
        }));

        authorizations = new InstitutionUserAuthorizations(
          false,
          locationsAuthorizations,
        );
      }
    }

    return authorizations;
  }
}
