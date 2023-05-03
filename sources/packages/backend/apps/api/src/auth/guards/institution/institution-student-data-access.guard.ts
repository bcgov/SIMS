import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IInstitutionUserToken } from "../..";
import { INSTITUTION_HAS_STUDENT_DATA_ACCESS_KEY } from "../../decorators";
import { InstitutionService } from "../../../services";

@Injectable()
export class InstitutionStudentDataAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly institutionService: InstitutionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const institutionStudentDataAccessParam =
      this.reflector.getAllAndOverride<string>(
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
      const studentId = +params[institutionStudentDataAccessParam];
      const hasStudentDataAccess =
        await this.institutionService.hasStudentDataAccess(
          user.authorizations.institutionId,
          studentId,
        );
      if (hasStudentDataAccess) {
        return true;
      }
      // The institution does not have access to student data.
      throw new ForbiddenException(
        "The institution is not allowed access the student data of given student.",
      );
    }

    return false;
  }
}
