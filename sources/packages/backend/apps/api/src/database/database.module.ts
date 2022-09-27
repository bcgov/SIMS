import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "../logger/logger.module";
import { ormConfig } from "./data-source";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...ormConfig,
      logging: ["error", "warn"],
    }),
    LoggerModule,
  ],
})
export class DatabaseModule {}
