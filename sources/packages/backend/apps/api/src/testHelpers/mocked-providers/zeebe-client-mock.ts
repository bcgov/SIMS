import { DynamicModule, Provider } from "@nestjs/common";
import { ZeebeModule } from "@sims/services";
import { ZBClient } from "zeebe-node";

export function createMockedZeebeModule(): DynamicModule {
  const zeebeClientProvider: Provider = {
    provide: ZBClient,
    useValue: {},
  };
  return {
    global: true,
    module: ZeebeModule,
    providers: [zeebeClientProvider],
    exports: [zeebeClientProvider],
  };
}
