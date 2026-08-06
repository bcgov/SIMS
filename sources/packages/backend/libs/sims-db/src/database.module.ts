import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DBEntities, ormConfig } from "./data-source";
import { ORMCacheManager } from "./orm-cache-manager";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...ormConfig,
      logging: ["error", "warn"],
      entities: DBEntities,
    }),
    TypeOrmModule.forFeature(DBEntities),
  ],
  providers: [ORMCacheManager],
  exports: [TypeOrmModule, ORMCacheManager],
})
export class DatabaseModule {}
