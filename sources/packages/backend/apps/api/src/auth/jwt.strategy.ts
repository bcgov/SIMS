import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { KeycloakConfig } from "./keycloakConfig";
import {
  IInstitutionUserToken,
  StudentUserToken,
  IUserToken,
} from "./userToken.interface";
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
      audience: "sims-api",
    });
  }

  async validate(payload: any) {
    const userToken = payload as IUserToken;
    userToken.authorizedParty = payload.azp;

    // Check if it is expected that a user exists on DB for the specific authorized parties.
    const authorizedParties = [
      AuthorizedParties.institution,
      AuthorizedParties.student,
      AuthorizedParties.aest,
      AuthorizedParties.formsFlowBPM,
    ];
    if (!authorizedParties.includes(userToken.authorizedParty)) {
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
    }

    // If the token represents a student, associate the student specific data
    // and return the student token specific object.
    if (userToken.authorizedParty === AuthorizedParties.student) {
      const studentUserToken = userToken as StudentUserToken;
      studentUserToken.studentId = dbUser?.studentId;
      return studentUserToken;
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

    // Ensures that there is a service account user created for forms-flow-bpm.
    if (userToken.authorizedParty === AuthorizedParties.formsFlowBPM) {
      // If the user does not exists on DB, create one.
      if (!dbUser) {
        const newServiceAccountUser =
          await this.userService.createServiceAccountUser(userToken.userName);
        userToken.userId = newServiceAccountUser.id;
      }
    }

    return userToken;
  }
}
