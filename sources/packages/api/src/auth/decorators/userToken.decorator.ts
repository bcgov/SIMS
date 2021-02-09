import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IUserToken } from "../userToken.interface";

export const UserToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as IUserToken;
  },
);
