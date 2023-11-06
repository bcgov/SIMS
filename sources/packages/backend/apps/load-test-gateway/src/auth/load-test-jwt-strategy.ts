import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { KeycloakConfig } from "@sims/auth/config";
import { LoadTestAuthorizedParties } from "./authorized-parties.enum";
import { LoadTestUserToken } from "./load-test-user-token";

/**
 * Inspect the header looking for the authentication header,
 * validates it using the public key.
 */
@Injectable()
export class LoadTestJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: KeycloakConfig.PEM_PublicKey,
      audience: "load-test-gateway",
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
    const userToken = payload as LoadTestUserToken;
    const allowedAuthorizedParties = [
      LoadTestAuthorizedParties.LoadTestGateway,
    ];
    // Check if authorized party from token is among allowed authorized parties.
    if (!allowedAuthorizedParties.includes(userToken.azp)) {
      throw new ForbiddenException(
        "Client is not authorized under the expected authorized party(azp).",
      );
    }
    return userToken;
  }
}
