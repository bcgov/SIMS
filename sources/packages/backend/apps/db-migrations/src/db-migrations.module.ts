import { Module } from "@nestjs/common";
import { DBMigrationsService } from "./db-migrations.service";

@Module({
  providers: [DBMigrationsService],
})
export class DBMigrationsModule {}
