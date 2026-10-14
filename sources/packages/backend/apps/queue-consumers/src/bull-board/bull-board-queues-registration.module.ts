import { Inject, Module, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { BULL_BOARD_INSTANCE, BullBoardInstance } from "@bull-board/nestjs";
import { QueueService } from "@sims/services/queue/queue.service";
import { getQueueToken } from "@nestjs/bull";
import { getQueueToken as getQueueTokenBullMQ } from "@nestjs/bull";
import { Queue } from "bull";
import { Queue as BullMQQueue } from "bullmq";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { LoggerService } from "@sims/utilities/logger";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

@Module({})
export class BullBoardQueuesRegistrationModule implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly queueService: QueueService,
    @Inject(BULL_BOARD_INSTANCE)
    private readonly board: BullBoardInstance,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Adds all queues to the bull board during application initialization
   * checking if the queue is active and if it is a scheduler.
   */
  async onModuleInit(): Promise<void> {
    const queues = await this.queueService.queueConfigurationModel();
    queues.forEach((queue) => {
      if (!queue.isActive && queue.isScheduler) {
        this.logger.log(`Queue service '${queue.name}' is inactive.`);
        return;
      }
      const queueProvider = this.moduleRef.get<Queue>(
        getQueueToken(queue.name),
        {
          strict: false,
        },
      );
      const queueAdapter = new BullAdapter(queueProvider, {
        readOnlyMode: queue.dashboardReadonly,
      });
      this.board.addQueue(queueAdapter);
    });
    const queueProvider = this.moduleRef.get<BullMQQueue>(
      getQueueTokenBullMQ("start-application"),
      {
        strict: false,
      },
    );
    const queueAdapter = new BullMQAdapter(queueProvider, {
      readOnlyMode: false,
    });
    this.board.addQueue(queueAdapter);
  }
}
