import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { StudentRestrictionService } from "../../services";
import { CHECK_RESTRICTIONS_KEY } from "../decorators/check-restrictions.decorator";
import { IUserToken } from "../userToken.interface";
/**
 * This guard validates an API for restrictions if it is decorated with @CheckRestriction.
 */
@Injectable()
export class RestrictionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {}
  /**
   * Implementation of canActivate method in CanActivate.
   * With the user token, it checks for any restriction for the user.
   * @param context
   * @returns Promise<boolean>
   */
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
    const studentRestrictionStatus =
      await this.studentRestrictionService.getStudentRestrictionsByUserId(
        userToken.userId,
      );
    return !studentRestrictionStatus.hasRestriction;
  }
}
