import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "../logger/logger.module";
import { DatabaseService } from "./database.service";
import { ormConfig } from "./data-source";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...ormConfig,
      logging: ["error", "warn"],
    }),
    LoggerModule,
  ],
  providers: [DatabaseService],
})
export class DatabaseModule {}
