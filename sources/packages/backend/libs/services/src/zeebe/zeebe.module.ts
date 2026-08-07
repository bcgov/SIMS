import {
  DynamicModule,
  Logger,
  Module,
  OnApplicationShutdown,
  Provider,
} from "@nestjs/common";
import { Camunda8 } from "@camunda8/sdk";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";

/**
 * Zeebe module to allow the Zeebe client
 * to be shared and injected globally.
 */
@Module({})
export class ZeebeModule implements OnApplicationShutdown {
  private readonly logger = new Logger(ZeebeModule.name);

  constructor(private readonly zeebeClient: ZeebeGrpcClient) {}

  static forRoot(): DynamicModule {
    const camunda8 = new Camunda8();
    const zeebeClientProvider: Provider = {
      provide: ZeebeGrpcClient,
      useValue: camunda8.getZeebeGrpcApiClient(),
    };
    return {
      global: true,
      module: ZeebeModule,
      providers: [zeebeClientProvider],
      exports: [zeebeClientProvider],
    };
  }

  /**
   * Closes the shared Zeebe client connection while the application is
   * gracefully shutting down. Unlike TypeORM's DataSource or Bull's queues,
   * the Zeebe client is not auto-managed by NestJS, so it must be closed
   * explicitly. `close()` already drains every worker created from this
   * client before closing the underlying gRPC channel, so no additional
   * per-worker draining logic is required. The close call is idempotent,
   * so it is safe even when a transport strategy (e.g. the workers app)
   * has already closed the same client.
   * @param signal signal that triggered the shutdown.
   */
  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(
      `Signal (${signal}) received: Closing Zeebe client connection...`,
    );
    try {
      await this.zeebeClient.close();
      this.logger.log("Zeebe client connection closed.");
    } catch (error: unknown) {
      this.logger.error("Error during Zeebe client teardown:", error);
    }
  }
}
