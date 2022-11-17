import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DBEntities, ormConfig } from "./data-source";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...ormConfig,
      logging: ["error", "warn"],
      entities: DBEntities,
    }),
  ],
})
export class DatabaseModule {}
