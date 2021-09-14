import { Controller, Get } from "@nestjs/common";
import { UserToken } from "../../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../../auth/userToken.interface";
import { Public } from "../../../auth/decorators/public.decorator";
import { Roles, Groups } from "../../../auth/decorators";
import { Role } from "../../../auth/roles.enum";
import { UserGroups } from "../../../auth/user-groups.enum";

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
  // eslint-disable-next-line @typescript-eslint/no-empty-function
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
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async authenticatedRouteByRole(): Promise<void> {}

  /**
   * Only authenticated users with specific role will have access to this endpoint.
   * In this case, no rule will be provided and therefore no rule will be a valid one.
   * @param userToken
   */
  @Roles()
  @Get("/authenticated-route-by-non-existing-role")
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async authenticatedRouteByNonExistingRole(): Promise<void> {}

  /**
   * Only authenticated users with specific group will have access to this endpoint.
   * @param userToken
   */
  @Groups(UserGroups.aestUser)
  @Get("/authenticated-route-by-group")
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async authenticatedRouteByGroup(): Promise<void> {}

  /**
   * Only authenticated users with specific role will have access to this endpoint.
   * In this case, no rule will be provided and therefore no rule will be a valid one.
   * @param userToken
   */
  @Groups()
  @Get("/authenticated-route-by-non-existing-group")
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async authenticatedRouteByNonExistingGroup(): Promise<void> {}
}
