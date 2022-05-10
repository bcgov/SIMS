import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { StudentUserToken } from "../userToken.interface";
import { REQUIRES_STUDENT_ACCOUNT_KEY } from "../decorators";

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

    const { user } = context.switchToHttp().getRequest();
    const userToken = user as StudentUserToken;
    return !!userToken?.studentId;
  }
}
