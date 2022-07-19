import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "../logger/logger.module";
import { DatabaseService } from "./database.service";
import { ormConfig } from "../database/config/ormconfig";

const finalConfig: any = {
  ...ormConfig,
  schema: process.env.DB_SCHEMA || "sims",
};
@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...finalConfig,
      logging: ["error", "warn"],
    }),
    LoggerModule,
  ],
  providers: [DatabaseService],
})
export class DatabaseModule {}
