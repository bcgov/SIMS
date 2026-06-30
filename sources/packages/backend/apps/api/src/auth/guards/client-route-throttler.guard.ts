import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerRequest,
  ThrottlerStorage,
} from "@nestjs/throttler";
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
 * The throttle policy is resolved once per request in `handleRequest` based on
 * the controller's decorator, collapsing what would otherwise be multiple
 * throttlers each performing their own reflection check on every request.
 * Controllers without the decorator fall back to the default throttle policy.
 */
@Injectable()
export class ClientRouteThrottlerGuard extends ThrottlerGuard {
  /**
   * Caches the resolved configuration per controller class. The policy depends
   * only on the controller's static decorator, so it is computed once and
   * reused across all requests, avoiding repeated reflection.
   */
  private readonly configByController = new Map<object, ThrottleSettings>();

  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
    private readonly appConfig: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  /**
   * Creates throttler options with a single default throttler. The effective
   * `ttl` and `limit` for each request are resolved per controller in
   * `handleRequest`; the values defined here act as the baseline default policy.
   * @param config app configuration service.
   * @returns throttler module options.
   */
  static createThrottlerOptions(config: ConfigService): ThrottlerModuleOptions {
    const { throttleConfig } = config;
    return {
      throttlers: [
        {
          name: "default",
          ttl: throttleConfig.default.time,
          limit: throttleConfig.default.limit,
        },
      ],
    };
  }

  /**
   * Resolves the throttle configuration for the current request's controller and
   * applies it before delegating to the base throttling logic. Resolving the
   * policy here ensures it is computed only once per request.
   * @param requestProps base throttler request properties.
   * @returns whether the request is allowed.
   */
  protected handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { time, limit } = this.resolveThrottleConfig(requestProps.context);
    return super.handleRequest({
      ...requestProps,
      ttl: time,
      limit,
      blockDuration: time,
    });
  }

  /**
   * Resolves the throttle configuration for the request's controller, caching
   * the result per controller class to avoid repeated reflection.
   * @param context execution context of the current request.
   * @returns the throttle settings to apply.
   */
  private resolveThrottleConfig(context: ExecutionContext): ThrottleSettings {
    const controller = context.getClass();
    const cachedConfig = this.configByController.get(controller);
    if (cachedConfig) {
      return cachedConfig;
    }
    const authorizedParties = this.reflector.get<AuthorizedParties[]>(
      AUTHORIZED_PARTY_KEY,
      controller,
    );
    const resolvedConfig = this.resolvePolicy(authorizedParties);
    this.configByController.set(controller, resolvedConfig);
    return resolvedConfig;
  }

  /**
   * Resolves the throttle configuration for a controller based on its
   * authorized parties.
   *
   * Since the throttler runs before authentication, the actual authorized
   * party (azp) of the request is unknown. A client-specific limit can only be
   * applied with certainty when the controller declares a single authorized
   * party. Controllers that allow multiple authorized parties (or none) use the
   * default policy, which is intentionally permissive as it also covers shared,
   * high-traffic endpoints accessed by different client types.
   * @param authorizedParties authorized parties declared by the controller.
   * @returns the throttle settings to apply.
   */
  private resolvePolicy(
    authorizedParties: AuthorizedParties[],
  ): ThrottleSettings {
    const { throttleConfig } = this.appConfig;
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
        // Routes include: /config.
        return throttleConfig.default;
    }
  }
}
