import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { KeycloakConfig } from "@sims/auth/config";

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
   * Once the token is verified, further validation based on
   * payload can be done here.
   * @param payload token payload.
   * @returns validated payload.
   */
  async validate(payload: unknown) {
    return payload;
  }
}
