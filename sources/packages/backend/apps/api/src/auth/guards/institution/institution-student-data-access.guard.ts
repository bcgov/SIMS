import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IInstitutionUserToken } from "../..";
import {
  HasStudentDataAccessParam,
  INSTITUTION_HAS_STUDENT_DATA_ACCESS_KEY,
} from "../../decorators";
import { InstitutionService } from "../../../services";

@Injectable()
export class InstitutionStudentDataAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly institutionService: InstitutionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const institutionStudentDataAccessParam =
      this.reflector.getAllAndOverride<HasStudentDataAccessParam>(
        INSTITUTION_HAS_STUDENT_DATA_ACCESS_KEY,
        [context.getHandler(), context.getClass()],
      );
    if (!institutionStudentDataAccessParam) {
      return true;
    }

    const {
      user,
      params,
    }: {
      user: IInstitutionUserToken;
      params: Record<string, string>;
    } = context.switchToHttp().getRequest();
    if (user?.isActive) {
      let applicationId = undefined;
      const studentId =
        +params[institutionStudentDataAccessParam.studentIdParamName];
      if (!studentId) {
        // Student id not found in the url.
        throw new BadRequestException("Student id not found in the url.");
      }
      if (institutionStudentDataAccessParam.applicationIdParamName) {
        applicationId =
          +params[institutionStudentDataAccessParam.applicationIdParamName];
        if (!applicationId) {
          // Application id not found in the url.
          throw new BadRequestException("Application id not found in the url.");
        }
      }

      const hasStudentDataAccess =
        await this.institutionService.hasStudentDataAccess(
          user.authorizations.institutionId,
          studentId,
          { applicationId },
        );

      if (hasStudentDataAccess) {
        return true;
      }
      // The institution does not have access to student data.
      throw new ForbiddenException(
        "The institution is not allowed access to the student data of the given student.",
      );
    }

    return false;
  }
}
