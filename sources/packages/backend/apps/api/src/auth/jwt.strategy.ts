import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import {
  IInstitutionUserToken,
  StudentUserToken,
  IUserToken,
  evaluateSpecificIdentityProvider,
} from ".";
import { InstitutionUserAuthService, UserService } from "../services";
import { AuthorizedParties } from "./authorized-parties.enum";
import { KeycloakConfig } from "@sims/auth/config";
import { ConfigService } from "@sims/utilities/config";
import { INVALID_BETA_USER } from "../constants";
import { ApiProcessError } from "../types";

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
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: KeycloakConfig.PEM_PublicKey,
      audience: "sims-api",
    });
  }

  /**
   * Execute post token validation operations. Once the token is considered valid, as per the
   * validations defined on the class constructor, this method will be invoked.
   * @param payload validated token.
   * @returns the original token information with additional properties depending on the
   * client used for the authentication.
   */
  async validate(payload: unknown) {
    const userToken = payload as IUserToken;
    // Check if it is expected that a user exists on DB for the specific authorized parties.
    const authorizedParties = [
      AuthorizedParties.institution,
      AuthorizedParties.student,
      AuthorizedParties.aest,
    ];
    if (!authorizedParties.includes(userToken.azp)) {
      // If not present in the list just return the received token without any further processing.
      return userToken;
    }
    // Get DB user information to be added to the token.
    const dbUser = await this.userService.getUserLoginInfo(userToken.userName);
    // Check if the user exists on DB.
    // When Students and Institutions users logins for the first time
    // there will no records until the Institution Profile or
    // Student Profile be finalized.
    if (dbUser) {
      userToken.userId = dbUser.id;
      userToken.isActive = dbUser.isActive;
      userToken.identitySpecificProvider =
        evaluateSpecificIdentityProvider(userToken);
      if (!dbUser.identityProviderType) {
        await this.userService.updateIdentityProvider(
          dbUser.id,
          userToken.identitySpecificProvider,
        );
      }
    }

    // If the token represents a student, associate the student specific data
    // and return the student token specific object.
    if (userToken.azp === AuthorizedParties.student) {
      //Beta user check.
      if (this.configService.allowBetaUsersOnly) {
        const isBetaUserAuthorized =
          await this.userService.isBetaUserAuthorized(
            userToken.givenNames,
            userToken.lastName,
          );
        if (!isBetaUserAuthorized) {
          throw new UnauthorizedException(
            new ApiProcessError(
              "The student is not registered as a beta user.",
              INVALID_BETA_USER,
            ),
          );
        }
      }

      const studentUserToken = userToken as StudentUserToken;
      studentUserToken.studentId = dbUser?.studentId;
      return studentUserToken;
    }
    // If the token represents an institution, loads additional information
    // from the database that is needed for authorization.
    if (userToken.azp === AuthorizedParties.institution) {
      const institutionUserToken = userToken as IInstitutionUserToken;
      institutionUserToken.authorizations =
        await this.institutionUserAuthService.getAuthorizationsByUserName(
          userToken.userName,
        );
      return institutionUserToken;
    }
    return userToken;
  }
}
