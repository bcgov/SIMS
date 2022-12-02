import { InjectQueue, OnQueueActive, Process, Processor } from "@nestjs/bull";
import { IER12FileService } from "@sims/integrations/institution-integration/ier-integration";
import {
  IER_SCHEDULER_JOB_ID,
  QUEUE_RETRY_DEFAULT_CONFIG,
} from "@sims/services/constants";
import { QueueNames } from "@sims/services/queue";
import { PST_TIMEZONE } from "@sims/utilities";
import { ConfigService } from "@sims/utilities/config";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import Bull, { CronRepeatOptions, Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import {
  GeneratedDateQueueInDTO,
  IER12ResultQueueOutDTO,
} from "./models/ier.model";

@Processor(QueueNames.IERIntegration)
export class IERIntegrationScheduler extends BaseScheduler<GeneratedDateQueueInDTO> {
  protected cronOptions: Bull.JobOptions = undefined;

  constructor(
    @InjectQueue(QueueNames.IERIntegration)
    protected readonly schedulerQueue: Queue<GeneratedDateQueueInDTO>,
    private readonly ierRequest: IER12FileService,
    config: ConfigService,
  ) {
    super();
    // cron options.
    this.cronOptions = {
      ...QUEUE_RETRY_DEFAULT_CONFIG,
      jobId: IER_SCHEDULER_JOB_ID,
      repeat: {
        cron: config.queueSchedulerCrons.ierCron,
        tz: PST_TIMEZONE,
      } as CronRepeatOptions,
    };
  }

  /**
   * Add scheduler to the queue.
   */
  async initializeScheduler(): Promise<void> {
    await this.schedulerQueue.add(undefined, this.cronOptions);
  }

  /**
   * Identifies all the applications which are in assessment
   * for a particular institution and generate the request file.
   * @params job has generatedDate Date in which the assessment for
   * particular institution is generated.
   * @returns Processing result log.
   */
  @Process()
  async processIER12File(
    job: Job<GeneratedDateQueueInDTO | undefined>,
  ): Promise<IER12ResultQueueOutDTO[]> {
    this.logger.log("Executing IER 12 file generation ...");
    const uploadResult = await this.ierRequest.processIER12File(
      job.data.generatedDate,
    );
    this.logger.log("IER 12 file generation completed.");
    return uploadResult;
  }

  @OnQueueActive()
  onActive(job: Job<GeneratedDateQueueInDTO | undefined>) {
    this.logger.log(
      `Processing IER integration job ${job.id} of type ${job.name}.`,
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
