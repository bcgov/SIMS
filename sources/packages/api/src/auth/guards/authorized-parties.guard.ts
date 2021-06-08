import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthorizedParties } from "../authorized-parties.enum";
import { AUTHORIZED_PARTY_KEY } from "../decorators/authorized-party.decorator";

@Injectable()
export class AuthorizedPartiesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const authorizedParties = this.reflector.getAllAndOverride<
      AuthorizedParties[]
    >(AUTHORIZED_PARTY_KEY, [context.getHandler(), context.getClass()]);
    if (!authorizedParties) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    return authorizedParties.some(
      (authorizedParty) => authorizedParty === user.authorizedParty,
    );
  }
}
