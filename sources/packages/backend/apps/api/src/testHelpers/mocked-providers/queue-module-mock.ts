import { Global, Module, Provider } from "@nestjs/common";
import { Queues } from "@sims/services/queue";

@Global()
@Module({
  providers: getMockedQueueProviders(),
  exports: getMockedQueueProviders(),
})
export class MockedQueueModule {}

function getMockedQueueProviders(): Provider[] {
  return Queues.map<Provider>((queue) => ({
    provide: `BullQueue_${queue.name}`,
    useValue: {},
  }));
}
