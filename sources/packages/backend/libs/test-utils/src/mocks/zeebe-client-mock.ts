import { DynamicModule, Provider } from "@nestjs/common";
import { ZeebeModule } from "@sims/services";
import { ZBClient } from "zeebe-node";

export function createMockedZeebeModule(): DynamicModule {
  const mockedZBClient = {} as ZBClient;
  mockedZBClient.createProcessInstance = jest.fn();
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

export function getMockedZeebeMethods(mockedZBClient: ZBClient): {
  createProcessInstance: jest.Mock;
  publishMessage: jest.Mock;
} {
  const createProcessInstance =
    mockedZBClient.createProcessInstance as jest.Mock;
  const publishMessage = mockedZBClient.publishMessage as jest.Mock;
  return { createProcessInstance, publishMessage };
}

export function resetMockedZeebeModule(mockedZBClient: ZBClient): void {
  const { createProcessInstance, publishMessage } =
    getMockedZeebeMethods(mockedZBClient);
  createProcessInstance.mockReset();
  publishMessage.mockReset();
}
