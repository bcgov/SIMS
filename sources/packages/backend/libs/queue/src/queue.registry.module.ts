import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { getQueueModules } from "./utilities/queue.util";

/**
 * Module which registers to all the available queues when imported.
 */
@Module({
  imports: [BullModule.registerQueue(...getQueueModules())],
  exports: [BullModule],
})
export class QueueRegistryModule {}
