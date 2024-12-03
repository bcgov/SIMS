import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";
import { DynamicModule, Provider } from "@nestjs/common";
import { ZeebeModule } from "@sims/services";

/**
 * Creates a mocked {@link ZeebeModule} that uses a mocked {@link ZBClient}
 * and allow the assertions on method like createProcessInstance,
 * publishMessage, and cancelProcessInstance.
 * @returns mocked {@link ZeebeModule}.
 */
export function createZeebeModuleMock(): DynamicModule {
  const mockedZBClient = {} as ZeebeGrpcClient;
  resetZeebeModuleMock(mockedZBClient);
  const zeebeClientProvider: Provider = {
    provide: ZeebeGrpcClient,
    useValue: mockedZBClient,
  };
  return {
    global: true,
    module: ZeebeModule,
    providers: [zeebeClientProvider],
    exports: [zeebeClientProvider],
  };
}

/**
 * Resets the mocked {@link ZeebeGrpcClient} for its initial mocked values.
 * @param mockedZBClient mocked client to be reset.
 */
export function resetZeebeModuleMock(mockedZBClient: ZeebeGrpcClient): void {
  mockedZBClient.createProcessInstance = jest.fn();
  mockedZBClient.publishMessage = jest.fn();
  mockedZBClient.cancelProcessInstance = jest.fn();
}
