import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModuleOptions } from "@nestjs/throttler";
import { ConfigService, ThrottleSettings } from "@sims/utilities/config";
import { AuthorizedParties } from "../authorized-parties.enum";
import { AUTHORIZED_PARTY_KEY } from "../decorators/authorized-party.decorator";

/**
 * Throttler guard for route-level client modules.
 *
 * The throttler runs before the authentication layer, so the decoded token is
 * not available at this point. To support independent rate limits per client
 * type the configuration is resolved from the controller's @AllowAuthorizedParty
 * decorator instead of the token.
 *
 * A single throttler is registered with `ttl` and `limit` resolved at runtime,
 * collapsing what would otherwise be multiple throttlers each performing their
 * own reflection check on every request. Controllers without the decorator fall
 * back to the default throttle policy.
 */
@Injectable()
export class ClientRouteThrottlerGuard extends ThrottlerGuard {
  /**
   * Creates throttler options with a single throttler whose limits are resolved
   * per request based on the controller's @AllowAuthorizedParty decorator.
   * @param config app configuration service.
   * @returns throttler module options.
   */
  static createThrottlerOptions(config: ConfigService): ThrottlerModuleOptions {
    const { throttleConfig } = config;
    const reflector = new Reflector();
    /**
     * Resolves the throttle configuration for the current request based on the
     * controller's authorized parties.
     *
     * Since the throttler runs before authentication, the actual authorized
     * party (azp) of the request is unknown. A client-specific limit can only be
     * applied with certainty when the controller declares a single authorized
     * party. Controllers that allow multiple authorized parties (or none) use the
     * default policy, which is intentionally permissive as it also covers shared,
     * high-traffic endpoints accessed by different client types.
     */
    const resolveThrottleConfig = (
      context: ExecutionContext,
    ): ThrottleSettings => {
      const authorizedParties = reflector.get<AuthorizedParties[]>(
        AUTHORIZED_PARTY_KEY,
        context.getClass(),
      );
      if (authorizedParties?.length > 1) {
        // Multiple authorized parties are allowed, so the controller is a shared,
        // high-traffic endpoint that uses the permissive default throttle policy.
        // Routes include: /dynamic-form-configuration/*, /dynamic-form/*, /system-lookup-configuration/*, /audit.
        return throttleConfig.default;
      }
      switch (authorizedParties?.at(0)) {
        case AuthorizedParties.aest:
          return throttleConfig.aest;
        case AuthorizedParties.institution:
          return throttleConfig.institutions;
        case AuthorizedParties.student:
          return throttleConfig.students;
        case AuthorizedParties.supportingUsers:
          return throttleConfig.supportingUsers;
        case AuthorizedParties.external:
          return throttleConfig.external;
        default:
          // No authorized party is declared, so the controller uses the default throttle policy.
          // routes include: /config
          return throttleConfig.default;
      }
    };
    return {
      throttlers: [
        {
          name: "default",
          ttl: (context: ExecutionContext) =>
            resolveThrottleConfig(context).time,
          limit: (context: ExecutionContext) =>
            resolveThrottleConfig(context).limit,
        },
      ],
    };
  }
}
