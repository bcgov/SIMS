import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IInstitutionUserToken } from "../..";
import { INSTITUTION_IS_BC_PUBLIC_KEY } from "../../decorators";
import { InstitutionService } from "../../../services";

@Injectable()
export class InstitutionBCPublicGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly institutionService: InstitutionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const bcPublicInstitution = this.reflector.getAllAndOverride<boolean>(
      INSTITUTION_IS_BC_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!bcPublicInstitution) {
      return true;
    }

    const { user }: { user: IInstitutionUserToken } = context
      .switchToHttp()
      .getRequest();

    if (user?.isActive) {
      const { institutionType } =
        await this.institutionService.getInstitutionTypeById(
          user.authorizations.institutionId,
        );
      if (institutionType.isBCPublic) {
        return true;
      }
      // The institution is found to be not a BC Public institution.
      throw new ForbiddenException("The institution is not  BC Public.");
    }

    return false;
  }
}
