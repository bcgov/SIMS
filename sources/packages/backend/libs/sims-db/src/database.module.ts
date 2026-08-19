import {
  Global,
  Logger,
  Module,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common";
import { InjectDataSource, TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
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
export class DatabaseModule implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Attaches an `error` listener to the underlying ioredis client used by
   * the TypeORM query result cache.
   */
  onModuleInit(): void {
    const queryResultCache = this.dataSource.queryResultCache as unknown as {
      client?: NodeJS.EventEmitter;
    };
    queryResultCache?.client?.on("error", (error: Error) => {
      this.logger.warn(`ORM cache Redis client error: ${error.message}`);
    });
  }

  /**
   * Logs the shutdown signal. The TypeORM DataSource closes itself
   * automatically during shutdown through its own hook registered by
   * `@nestjs/typeorm`'s `TypeOrmModule.forRoot`.
   * @param signal signal that triggered the shutdown.
   */
  onApplicationShutdown(signal?: string): void {
    this.logger.log(
      `Signal (${signal}) received: Closing TypeORM DataSource connections...`,
    );
  }
}
