import { Global, Module } from "@nestjs/common";
import { SystemUsersService } from ".";

@Global()
@Module({
  providers: [SystemUsersService],
  exports: [SystemUsersService],
})
export class SystemUserModule {}
