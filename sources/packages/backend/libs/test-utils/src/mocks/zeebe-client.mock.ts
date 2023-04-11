import { DynamicModule, Provider } from "@nestjs/common";
import { ZeebeModule } from "@sims/services";
import { ZBClient } from "zeebe-node";

/**
 * Creates a mocked {@link ZeebeModule} that proves a mocked {@link ZBClient}
 * and allow the assertions on method like createProcessInstance,
 * publishMessage, and cancelProcessInstance.
 * @returns mocked {@link ZeebeModule}.
 */
export function createZeebeModuleMock(): DynamicModule {
  const mockedZBClient = {} as ZBClient;
  mockedZBClient.createProcessInstance = jest.fn();
  mockedZBClient.publishMessage = jest.fn();
  mockedZBClient.cancelProcessInstance = jest.fn();
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
