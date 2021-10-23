import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserService } from "src/services";
import { CHECK_RESTRICTIONS_KEY } from "../decorators/check-restrictions.decorator";
import { IUserToken } from "../userToken.interface";

@Injectable()
export class RestrictionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject("UserService") private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const checkRestrictions = this.reflector.getAllAndOverride<boolean>(
      CHECK_RESTRICTIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!checkRestrictions) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const userToken = user as IUserToken;

    const loggedInUser = await this.userService.getUser(userToken.userName);
    console.log(loggedInUser);
    if (loggedInUser) {
      return true;
    }

    return false;
  }
}
