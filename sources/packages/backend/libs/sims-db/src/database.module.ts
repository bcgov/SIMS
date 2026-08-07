import { Global, Logger, Module, OnApplicationShutdown } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DBEntities, ormConfig } from "./data-source";

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
  exports: [TypeOrmModule],
})
export class DatabaseModule implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

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
