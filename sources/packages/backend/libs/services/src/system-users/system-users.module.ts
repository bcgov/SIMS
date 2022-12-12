import { Global, Module } from "@nestjs/common";
import { DatabaseModule } from "@sims/sims-db";
import { SystemUsersService } from ".";

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [SystemUsersService],
  exports: [SystemUsersService],
})
export class SystemUserModule {}
