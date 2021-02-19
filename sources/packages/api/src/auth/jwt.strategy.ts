import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { AuthHelper } from "./auth-helper";
import { IUserToken } from "./userToken.interface";

/**
 * Inspect the header looking for the authentication header,
 * validates it using the public key from SSO and prepare
 * the "request.user" object that will be available for
 * controllers.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: AuthHelper.realmConfig.public_key,
    });
  }

  async validate(payload: any) {
    let userToken = payload as IUserToken;
    // For now we are adding all the roles from the different clients into one single array.
    // In the future we can decide how to proper handle roles, but the only issue to have
    // then flatten for now is if we create a role with the same name in 2 different
    // clients on Keycloak. For now we just have the Student client and in the future
    // it would be pretty easy to adpat this method as needed to expose the roles
    // also as needed to be validate using a decorator/annotation.
    userToken.roles = [];
    Object.keys(payload.resource_access).forEach((value) => {
      if (Array.isArray(payload.resource_access[value].roles)) {
        payload.resource_access[value].roles.forEach((roleValue: string) => {
          userToken.roles.push(roleValue);
        });
      }
    });

    return userToken;
  }
}
