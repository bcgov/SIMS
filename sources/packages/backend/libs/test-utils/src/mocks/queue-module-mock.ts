import { Global, Module, Provider } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import { Queue } from "bull";
import { createMock } from "@golevelup/ts-jest";
import { QueueService } from "@sims/services/queue";

const MOCKED_QUEUE_PROVIDERS = getMockedQueueProviders();

/**
 * Mock to entirely replace the queue module, avoiding including
 * the BullModule since it is not in the scope of the E2E tests.
 */
@Global()
@Module({
  providers: [...MOCKED_QUEUE_PROVIDERS, QueueService],
  exports: [...MOCKED_QUEUE_PROVIDERS, QueueService],
})
export class QueueModuleMock {}

/**
 * Create all expected queue providers mocks.
 * @returns queue providers mocks.
 */
function getMockedQueueProviders(): Provider[] {
  // The 'BullQueue_' suffix is needed to properly mock the expected
  // symbol used by the @InjectQueue decorator.
  return Object.values(QueueNames).map<Provider>((queue) => ({
    provide: getQueueProviderName(queue),
    useValue: createMock<Queue>({ name: queue }),
  }));
}

/**
 * Get the unique mock name for a queue that can be used to retrieve
 * the mocked object for later jest operations and checks.
 * @param queueName queue to create the name.
 * @returns queue mock name.
 */
export function getQueueProviderName(queueName: QueueNames): string {
  return `BullQueue_${queueName}`;
}
