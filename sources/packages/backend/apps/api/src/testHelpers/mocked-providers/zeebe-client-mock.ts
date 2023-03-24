import { DynamicModule, Provider } from "@nestjs/common";
import { ZeebeModule } from "@sims/services";
import { ZBClient } from "zeebe-node";

export function createMockedZeebeModule(): DynamicModule {
  const mockedZBClient = {} as ZBClient;
  mockedZBClient.publishMessage = jest.fn();
  const zeebeClientProvider: Provider = {
    provide: ZBClient,
    useValue: mockedZBClient,
  };
  return {
    global: true,
    module: ZeebeModule,
    providers: [zeebeClientProvider],
    exports: [zeebeClientProvider],
  };
}
