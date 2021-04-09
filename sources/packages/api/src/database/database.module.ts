import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "../logger/logger.module";
import { DatabaseService } from "./database.service";

const config = require("../../ormconfig"); // eslint-disable-line

const finalConfig: any = { ...config, schema: process.env.DB_SCHEMA || "sims" };
@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...finalConfig,
      migrations: [], // No Migrations required for general connection
      logging: ["error", "warn"],
    }),
    LoggerModule,
  ],
  providers: [DatabaseService],
})
export class DatabaseModule {}
