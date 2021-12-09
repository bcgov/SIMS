import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { KeycloakConfig } from "./keycloakConfig";
import { IInstitutionUserToken, IUserToken } from "./userToken.interface";
import { InstitutionUserAuthService, UserService } from "../services";
import { AuthorizedParties } from "./authorized-parties.enum";

/**
 * Inspect the header looking for the authentication header,
 * validates it using the public key from SSO and prepare
 * the "request.user" object that will be available for
 * controllers.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly institutionUserAuthService: InstitutionUserAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: KeycloakConfig.PEM_PublicKey,
    });
  }

  async validate(payload: any) {
    const userToken = payload as IUserToken;
    userToken.authorizedParty = payload.azp;
    // For now we are adding all the roles from the different clients into one single array.
    // In the future we can decide how to proper handle roles, but the only issue to have
    // then flatten for now is if we create a role with the same name in 2 different
    // clients on Keycloak. For now we just have the Student client and in the future
    // it would be pretty easy to adapt this method as needed to expose the roles
    // also as needed to be validate using a decorator/annotation.
    userToken.roles = [];
    if (payload.resource_access) {
      Object.keys(payload.resource_access).forEach((value) => {
        payload.resource_access[value].roles.forEach((roleValue: string) => {
          userToken.roles.push(roleValue);
        });
      });
    }

    // Check if it is expected that a user exists on DB for the
    // specific authorized party (only Students and Institution for now).
    if (
      [
        AuthorizedParties.institution,
        AuthorizedParties.student,
        AuthorizedParties.aest,
      ].includes(userToken.authorizedParty)
    ) {
      // Get DB user information to be added to the token.
      console.log("DB user called");
      const dbUser = await this.userService.getUserLoginInfo(
        userToken.userName,
      );

      // Check if the user exists on DB.
      // When Students and Institutions users logins for the first time
      // there will no records until the Institution Profile or
      // Student Profile be finalized.
      if (dbUser) {
        userToken.userId = dbUser.id;
        userToken.isActive = dbUser.isActive;
      }

      // If the token represents an institution, loads additional information
      // from the database that is needed for authorization.
      if (userToken.authorizedParty === AuthorizedParties.institution) {
        const institutionUserToken = userToken as IInstitutionUserToken;
        institutionUserToken.authorizations =
          await this.institutionUserAuthService.getAuthorizationsByUserName(
            userToken.userName,
          );
        return institutionUserToken;
      }
    }

    return userToken;
  }
}
