import { Inject, Module, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { BULL_BOARD_INSTANCE, BullBoardInstance } from "@bull-board/nestjs";
import { QueueService } from "@sims/services/queue/queue.service";
import { getQueueToken as getQueueTokenLegacy } from "@nestjs/bull";
import { Queue as QueueLegacy } from "bull";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { LoggerService } from "@sims/utilities/logger";
import { BULL_MQ_MIGRATED_QUEUE_NAMES } from "@sims/utilities";
import { QueueModel } from "@sims/services/queue";
import { Queue } from "bullmq";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { getQueueToken } from "@nestjs/bullmq";

// TODO: After bull mq migration, remove this legacy queue module.
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
    this.addLegacyQueuesToBoard(queues);
    this.addQueuesToBoard(queues);
  }

  private addLegacyQueuesToBoard(queues: QueueModel[]): void {
    queues
      .filter((queue) => !BULL_MQ_MIGRATED_QUEUE_NAMES.includes(queue.name))
      .forEach((queue) => {
        console.log(`Processing queue: ${queue.name}`);
        if (!queue.isActive && queue.isScheduler) {
          this.logger.log(`Queue service '${queue.name}' is inactive.`);
          return;
        }
        const queueProvider = this.moduleRef.get<QueueLegacy>(
          getQueueTokenLegacy(queue.name),
          {
            strict: false,
          },
        );
        const queueAdapter = new BullAdapter(queueProvider, {
          readOnlyMode: queue.dashboardReadonly,
        });
        this.board.addQueue(queueAdapter);
      });
  }

  /**
   * Add the queues to bull dashboard.
   * @param queues queues to be added to the bull dashboard.
   */
  private addQueuesToBoard(queues: QueueModel[]): void {
    queues
      .filter((queue) => BULL_MQ_MIGRATED_QUEUE_NAMES.includes(queue.name))
      .forEach((queue) => {
        console.log(`Processing queue: ${queue.name}`);
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
        const queueAdapter = new BullMQAdapter(queueProvider, {
          readOnlyMode: queue.dashboardReadonly,
        });
        this.board.addQueue(queueAdapter);
      });
  }
}
