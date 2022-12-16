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
  const mockAddQueue = (): any => {
    return "fake queue";
  };
  return Object.values(QueueNames).map<Provider>((queue) => ({
    provide: `BullQueue_${queue}`,
    useValue: { add: mockAddQueue },
  }));
}
