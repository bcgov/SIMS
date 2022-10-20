import { Module, DynamicModule, Provider } from "@nestjs/common";
import { ZBClient } from "zeebe-node";

/**
 * Zeebe module to allow the Zeebe client
 * to be shared and injected globally.
 */
@Module({})
export class ZeebeModule {
  static forRoot(): DynamicModule {
    const zeebeClientProvider: Provider = {
      provide: ZBClient,
      useValue: new ZBClient(),
    };
    return {
      global: true,
      module: ZeebeModule,
      providers: [zeebeClientProvider],
      exports: [zeebeClientProvider],
    };
  }
}
