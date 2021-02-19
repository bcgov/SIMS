import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DatabaseService } from "./database.service";
const config = require("../../ormconfig");

const finalConfig: any = { ...config, schema: process.env.DB_SCHEMA || "sims" };
@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...finalConfig,
      logging: ["error", "warn", "info"],
    }),
  ],
  //providers: [DatabaseService],
})
export class DatabaseModule {}
