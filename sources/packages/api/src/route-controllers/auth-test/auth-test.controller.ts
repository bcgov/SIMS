import { Controller, Get } from "@nestjs/common";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { Public } from "../../auth/decorators/public.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { Role } from "../../auth/roles.enum";

/**
 * Controller dedicated to test the functionalities around the authentication layer.
 * It is intended to be exposed in the API to accept HTTP requests only during e2e
 * tests and it will not be available on DEV, TEST, PROD, or others.
 * It also could be used as a start pointing reference to see how the authentication
 * layer works in different ways.
 */
@Controller("auth-test")
export class AuthTestController {
  /**
   * Public access with no token validation at all.
   */
  @Public()
  @Get("/public-route")
  async publicRoute(): Promise<void> {}

  /**
   * Only authenticated users will have access to this endpoint
   * due to the JwtAuthGuard global guard in place (see src/auth/auth.module.ts).
   * Any endpoint that is not explicit decorated with the Public
   * decorator will be considered as an endpoint that needs at least a valid token.
   * @param userToken
   * @returns UserToken.
   */
  @Get("/global-authenticated-route")
  async authenticatedRoute(
    @UserToken() userToken: IUserToken,
  ): Promise<IUserToken> {
    return userToken;
  }

  /**
   * Only authenticated users with specific role will have access to this endpoint.
   * @param userToken
   */
  @Roles(Role.Student)
  @Get("/authenticated-route-by-role")
  async authenticatedRouteByRole(): Promise<void> {}

  /**
   * Only authenticated users with specific role will have access to this endpoint.
   * In this case a rule that doen't exists will be used to proved test the case that
   * the user has an role that will not give him access to the endpoint.
   * @param userToken
   */
  @Roles(Role.DummyRole)
  @Get("/authenticated-route-by-non-existing-role")
  async authenticatedRouteByNonExistingRole(): Promise<void> {}
}
