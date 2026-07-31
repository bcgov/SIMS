import { Global, Logger, Module, OnApplicationShutdown } from "@nestjs/common";
import { InjectDataSource, TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
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

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(
      `Signal (${signal}) received: Closing TypeORM DataSource connection...`,
    );

    if (this.dataSource.isInitialized) {
      try {
        // TypeORM root module auto-closes connections, but calling destroy()
        // explicitly ensures it happens cleanly before module disposal finishes.
        await this.dataSource.destroy();
        this.logger.log("TypeORM connection pool successfully closed.");
      } catch (error) {
        this.logger.error("Error during TypeORM connection teardown:", error);
      }
    } else {
      this.logger.log("TypeORM DataSource was already disconnected.");
    }
  }
}
