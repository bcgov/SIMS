import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { StudentService } from "../../services";
import { CHECK_SIN_VALIDATION_KEY } from "../decorators/check-sin-status.decorator";
import { IUserToken } from "../userToken.interface";
/**
 * This guard validates an API for Valid Sin if it is decorated with @CheckRestriction.
 */
@Injectable()
export class SinValidationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly studentService: StudentService,
  ) {}
  /**
   * Implementation of canActivate method in CanActivate.
   * With the user token, it checks for sin validation for the user.
   * @param context
   * @returns Promise<boolean>
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const checkSinValidation = this.reflector.getAllAndOverride<boolean>(
      CHECK_SIN_VALIDATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!checkSinValidation) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const userToken = user as IUserToken;
    return await this.studentService.getStudentSinStatus(userToken.userId);
  }
}
