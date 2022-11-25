import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DBEntities } from "@sims/sims-db";
import { SystemUsersService } from "./system-users.service";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(DBEntities)],
  providers: [SystemUsersService],
  exports: [SystemUsersService],
})
export class SystemUserModule {}
