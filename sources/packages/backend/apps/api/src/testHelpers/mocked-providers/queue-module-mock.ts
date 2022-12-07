import { Global, Module, Provider } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";

@Global()
@Module({
  providers: getMockedQueueProviders(),
  exports: getMockedQueueProviders(),
})
export class MockedQueueModule {}

function getMockedQueueProviders(): Provider[] {
  return Object.values(QueueNames).map<Provider>((queue) => ({
    provide: `BullQueue_${queue}`,
    useValue: {},
  }));
}
