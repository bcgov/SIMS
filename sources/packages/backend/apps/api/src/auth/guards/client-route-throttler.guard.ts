import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  ThrottlerGuard,
  ThrottlerModuleOptions,
} from "@nestjs/throttler";
import { ConfigService } from "@sims/utilities/config";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../authorized-parties.enum";
import { AUTHORIZED_PARTY_KEY } from "../decorators/authorized-party.decorator";

/**
 * Throttler guard configuration for route-level client modules.
 *
 * It allows each client module to have independent throttle values while
 * preserving a default throttle policy for non-client routes.
 */
@Injectable()
export class ClientRouteThrottlerGuard extends ThrottlerGuard {
  /**
   * Creates throttler options to allow independent limits per client route.
   * @param config app configuration service.
   * @returns throttler module options.
   */
  static createThrottlerOptions(config: ConfigService): ThrottlerModuleOptions {
    const { throttleConfig } = config;
    return {
      throttlers: [
        {
          // Routes affected: controllers decorated with @AllowAuthorizedParty(AuthorizedParties.aest).
          name: "aest",
          ttl: throttleConfig.aest.time,
          limit: throttleConfig.aest.limit,
          skipIf: (context: ExecutionContext): boolean =>
            ClientTypeBaseRoute.AEST !== this.getControllerClientRoute(context),
        },
        {
          // Routes affected: controllers decorated with @AllowAuthorizedParty(AuthorizedParties.institution).
          name: "institutions",
          ttl: throttleConfig.institutions.time,
          limit: throttleConfig.institutions.limit,
          skipIf: (context: ExecutionContext): boolean =>
            ClientTypeBaseRoute.Institution !== this.getControllerClientRoute(context),
        },
        {
          // Routes affected: controllers decorated with @AllowAuthorizedParty(AuthorizedParties.student).
          name: "students",
          ttl: throttleConfig.students.time,
          limit: throttleConfig.students.limit,
          skipIf: (context: ExecutionContext): boolean =>
            ClientTypeBaseRoute.Student !== this.getControllerClientRoute(context),
        },
        {
          // Routes affected: controllers decorated with @AllowAuthorizedParty(AuthorizedParties.supportingUsers).
          name: "supportingUsers",
          ttl: throttleConfig.supportingUsers.time,
          limit: throttleConfig.supportingUsers.limit,
          skipIf: (context: ExecutionContext): boolean =>
            ClientTypeBaseRoute.SupportingUser !== this.getControllerClientRoute(context),
        },
        {
          // Routes affected: controllers decorated with @AllowAuthorizedParty(AuthorizedParties.external).
          name: "external",
          ttl: throttleConfig.external.time,
          limit: throttleConfig.external.limit,
          skipIf: (context: ExecutionContext): boolean =>
            ClientTypeBaseRoute.External !== this.getControllerClientRoute(context),
        },
        {
          // Routes affected: all controllers without @AllowAuthorizedParty decorator (for example, /api/config, /api/audit, /api/dynamic-form/*, and /api/system-lookup-configuration/*).
          name: "default",
          ttl: throttleConfig.default.time,
          limit: throttleConfig.default.limit,
          skipIf: (context: ExecutionContext): boolean =>
            this.getControllerClientRoute(context) !== undefined,
        },
      ],
    };
  }

  /**
   * Gets the client route assigned to the controller handling the request
   * based on the @AllowAuthorizedParty decorator metadata.
   * @param context request execution context.
   * @returns client route or undefined when controller has no @AllowAuthorizedParty decorator.
   */
  private static getControllerClientRoute(
    context: ExecutionContext,
  ): ClientTypeBaseRoute | undefined {
    const controller = context.getClass();
    const reflector = new Reflector();
    const authorizedParties = reflector.get<AuthorizedParties[]>(
      AUTHORIZED_PARTY_KEY,
      controller,
    );

    if (!authorizedParties?.length) {
      return undefined;
    }

    // Map AuthorizedParties to ClientTypeBaseRoute.
    // The first party is used if multiple are specified.
    return this.mapAuthorizedPartyToClientRoute(authorizedParties[0]);
  }

  /**
   * Maps an AuthorizedParty to its corresponding ClientTypeBaseRoute.
   * @param authorizedParty The authorized party value from @AllowAuthorizedParty decorator.
   * @returns The corresponding client route or undefined for unknown parties.
   */
  private static mapAuthorizedPartyToClientRoute(
    authorizedParty: AuthorizedParties,
  ): ClientTypeBaseRoute | undefined {
    switch (authorizedParty) {
      case AuthorizedParties.aest:
        return ClientTypeBaseRoute.AEST;
      case AuthorizedParties.institution:
        return ClientTypeBaseRoute.Institution;
      case AuthorizedParties.student:
        return ClientTypeBaseRoute.Student;
      case AuthorizedParties.supportingUsers:
        return ClientTypeBaseRoute.SupportingUser;
      case AuthorizedParties.external:
        return ClientTypeBaseRoute.External;
      default:
        return undefined;
    }
  }
}