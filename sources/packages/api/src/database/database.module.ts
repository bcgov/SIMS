import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { LoggerModule } from "../logger/logger.module";
import { DatabaseService } from "./database.service";
const config = require("../../ormconfig");

const finalConfig: any = { ...config, schema: process.env.DB_SCHEMA || "sims" };
@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...finalConfig,
      logging: ["error", "warn", "info"],
    }),
    LoggerModule,
  ],
  providers: [DatabaseService],
})
export class DatabaseModule {}
