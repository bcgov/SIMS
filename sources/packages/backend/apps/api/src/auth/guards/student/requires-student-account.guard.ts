import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { StudentUserToken } from "../../userToken.interface";
import {
  REQUIRES_STUDENT_ACCOUNT_KEY,
  RequiresUserAccount,
} from "../../decorators";
import { ApiProcessError } from "../../../types";
import { MISSING_STUDENT_ACCOUNT } from "../../../constants";

/**
 * Specifies when a student account must be already created in order to access a route.
 */
@Injectable()
export class RequiresStudentAccountGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresStudentAccount = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_STUDENT_ACCOUNT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Checks if the decorator is present or it is false.
    if (!requiresStudentAccount) {
      return true;
    }

    // Check if the route does not require a user account.
    const requiresUserAccount = this.reflector.getAllAndOverride(
      RequiresUserAccount,
      [context.getHandler(), context.getClass()],
    );
    // If a route does not require a user account, no student account validation is required.
    if (requiresUserAccount === false) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userToken = user as StudentUserToken;

    if (!userToken?.studentId) {
      throw new UnauthorizedException(
        new ApiProcessError(
          "The user does not have a student account associated.",
          MISSING_STUDENT_ACCOUNT,
        ),
      );
    }

    return true;
  }
}
