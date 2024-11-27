import { Global, LoggerService, Module, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { QueueService } from "@sims/services/queue/queue.service";
import { InjectLogger } from "@sims/utilities/logger";
import { getQueueToken } from "@nestjs/bull";
import { Queue } from "bull";
import { register, collectDefaultMetrics, Counter } from "prom-client";
import { QueueModel } from "@sims/services/queue";

/**
 * Queues metrics events.
 */
enum QueuesMetricsEvents {
  Error = "error",
  Waiting = "waiting",
  Active = "active",
  Stalled = "stalled",
  Completed = "completed",
  Progress = "progress",
  Failed = "failed",
  Delayed = "delayed",
  Paused = "paused",
  Removed = "removed",
  Resumed = "resumed",
  Drained = "drained",
}

const DEFAULT_APP_LABEL = "queue-consumers";

@Global()
@Module({})
export class QueuesMetricsModule implements OnModuleInit {
  /**
   * Queue events counter.
   */
  private readonly eventCounter = new Counter({
    name: "queue_event_total_count",
    help: "Total number of the events for a queue If it is a global event, it will be emitted for every queue-consumer.",
    labelNames: ["queueName", "queueEvent", "queueType"] as const,
  });

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly queueService: QueueService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log("Associating queue events for metrics.");
    // Set global metrics settings.
    register.setDefaultLabels({ app: DEFAULT_APP_LABEL });
    collectDefaultMetrics({ labels: { app: DEFAULT_APP_LABEL } });
    // Set queues metrics settings.
    const queues = await this.queueService.queueConfigurationModel();
    queues.forEach((queue) => {
      if (!queue.isActive) {
        this.logger.log(
          `Queue '${queue.name}' is inactive and will not be exposing metrics.`,
        );
        return;
      }
      this.associateQueueMetrics(queue);
    });
  }

  private associateQueueMetrics(queue: QueueModel): void {
    const queueProvider = this.moduleRef.get<Queue>(getQueueToken(queue.name), {
      strict: false,
    });
    const queueName = queue.name;
    const queueType = queue.isScheduler ? "scheduler" : "consumer";
    Object.values(QueuesMetricsEvents).forEach(
      (queueEvent: QueuesMetricsEvents) => {
        this.logger.log(
          `Associating queue '${queueName}' event '${queueEvent}'.`,
        );
        queueProvider.on(queueEvent, () => {
          this.logger.log(`Queue '${queueName}' event '${queueEvent}'.`);
          this.eventCounter.inc({
            queueName,
            queueEvent,
            queueType,
          });
        });
      },
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
