import { Global, Module, Provider } from "@nestjs/common";
import { DatabaseModule } from "@sims/sims-db";
import { QueueNames } from "@sims/utilities";
import { Queue } from "bull";
import { createMock } from "@golevelup/ts-jest";
import { QueueService } from "@sims/services/queue";

export const MOCKED_QUEUE_PROVIDERS = getMockedQueueProviders();

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [...MOCKED_QUEUE_PROVIDERS, QueueService],
  exports: [...MOCKED_QUEUE_PROVIDERS, QueueService],
})
export class QueueModuleMock {}

function getMockedQueueProviders(): Provider[] {
  return Object.values(QueueNames).map<Provider>((queue) => ({
    provide: `BullQueue_${queue}`,
    useValue: createMock<Queue>({ name: queue }),
  }));
}
