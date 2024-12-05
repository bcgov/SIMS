import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthorizedParties, IUserToken } from "..";
import { AUTHORIZED_PARTY_KEY } from "../decorators/authorized-party.decorator";
import { IdentityProviders } from "@sims/sims-db";
import { ConfigService } from "@sims/utilities/config";
import { ApiProcessError } from "../../types";
import { INVALID_BETA_USER } from "../../constants";
import { Audiences } from "../../auth/audiences.enum";

/**
 * Inspect the token to check if the correct authorized party
 * (azp token property) is present on the user token.
 */
@Injectable()
export class AuthorizedPartiesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const authorizedParties = this.reflector.getAllAndOverride<
      AuthorizedParties[]
    >(AUTHORIZED_PARTY_KEY, [context.getHandler(), context.getClass()]);
    if (!authorizedParties) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const userToken = user as IUserToken;

    const hasAuthorizedParty = authorizedParties.some(
      (authorizedParty) => authorizedParty === userToken.azp,
    );
    if (!hasAuthorizedParty) {
      throw new ForbiddenException(
        "Client is not authorized under the expected authorized party(azp).",
      );
    }
    if (
      userToken.azp === AuthorizedParties.external &&
      Array.isArray(userToken.aud) &&
      userToken.aud.includes(Audiences.SIMSApiExternal)
    ) {
      return true;
    }
    const isAllowedIDP = this.isAllowedIDP(
      userToken.azp,
      userToken.identityProvider,
    );
    if (!isAllowedIDP) {
      throw new ForbiddenException(
        "Client is not authorized under the expected identity provider(IDP).",
      );
    }

    return true;
  }

  /**
   * Determines if the client is authorized through the expected IDP.
   * @param authorizedParty authorized party type to be checked.
   * @param idp identity provider used for authentication on Keycloak.
   * @returns true if the identity provider is allowed, otherwise, false.
   */
  private isAllowedIDP(
    authorizedParty: AuthorizedParties,
    identityProvider: IdentityProviders,
  ): boolean {
    switch (authorizedParty) {
      case AuthorizedParties.student:
        if (
          identityProvider === IdentityProviders.BCeIDBoth &&
          this.configService.allowBetaUsersOnly
        ) {
          throw new UnauthorizedException(
            new ApiProcessError(
              "The student authentication provider is not allowed at this moment.",
              INVALID_BETA_USER,
            ),
          );
        }
        return [IdentityProviders.BCeIDBoth, IdentityProviders.BCSC].includes(
          identityProvider,
        );
      case AuthorizedParties.supportingUsers:
        return identityProvider === IdentityProviders.BCSC;
      case AuthorizedParties.institution:
        return identityProvider === IdentityProviders.BCeIDBoth;
      case AuthorizedParties.aest:
        return identityProvider === IdentityProviders.IDIR;
      default:
        return false;
    }
  }
}
