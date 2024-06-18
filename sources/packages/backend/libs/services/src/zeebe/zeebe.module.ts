import { Module, DynamicModule, Provider } from "@nestjs/common";
import { Camunda8 } from "@camunda8/sdk";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";

/**
 * Zeebe module to allow the Zeebe client
 * to be shared and injected globally.
 */
@Module({})
export class ZeebeModule {
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
}
