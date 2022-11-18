import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { getQueueModules } from "./utilities/queue.util";

@Module({
  imports: [BullModule.registerQueueAsync(...getQueueModules())],
  exports: [BullModule.registerQueueAsync(...getQueueModules())],
})
export class QueueRegistryModule {}
