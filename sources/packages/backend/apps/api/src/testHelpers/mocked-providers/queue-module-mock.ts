import { Global, Module, Provider } from "@nestjs/common";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";

@Global()
@Module({
  providers: [...getMockedQueueProviders(), QueueService],
  exports: [...getMockedQueueProviders(), QueueService],
})
export class MockedQueueModule {}

function getMockedQueueProviders(): Provider[] {
  return Object.values(QueueNames).map<Provider>((queue) => ({
    provide: `BullQueue_${queue}`,
    useValue: {},
  }));
}
