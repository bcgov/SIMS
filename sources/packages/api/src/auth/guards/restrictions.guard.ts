import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { StudentRestrictionService } from "src/services";
import { CHECK_RESTRICTIONS_KEY } from "../decorators/check-restrictions.decorator";
import { IUserToken } from "../userToken.interface";
import { RestrictionParser } from "src/utilities";

@Injectable()
export class RestrictionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject("StudentRestrictionService")
    private readonly studentRestrictionService: StudentRestrictionService,
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

    const studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsByUserName(
        userToken.userName,
      );
    const parser: RestrictionParser = new RestrictionParser(
      studentRestrictions,
    );
    return !parser.hasRestriction();
  }
}
