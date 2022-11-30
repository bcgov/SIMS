import { InjectQueue, OnQueueActive, Process, Processor } from "@nestjs/bull";
import { OnApplicationBootstrap } from "@nestjs/common";
import { IER12FileService } from "@sims/integrations/institution-integration/ier-integration";
import {
  IER_SCHEDULER_JOB_ID,
  QUEUE_RETRY_DEFAULT_CONFIG,
} from "@sims/services/constants";
import { QueueNames } from "@sims/services/queue";
import { PST_TIMEZONE } from "@sims/utilities";
import { ConfigService } from "@sims/utilities/config";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import Bull, { Job, Queue } from "bull";
import {
  GeneratedDateQueueIInDTO,
  IER12ResultQueueOutDTO,
} from "./models/ier.model";

@Processor(QueueNames.StartIERIntegration)
export class IERIntegrationScheduler implements OnApplicationBootstrap {
  private ierCronOptions: Bull.JobOptions = undefined;
  constructor(
    @InjectQueue(QueueNames.StartIERIntegration)
    private readonly startIERSchedulerQueue: Queue<GeneratedDateQueueIInDTO>,
    private readonly ierRequest: IER12FileService,
    config: ConfigService,
  ) {
    this.ierCronOptions = {
      ...QUEUE_RETRY_DEFAULT_CONFIG,
      jobId: IER_SCHEDULER_JOB_ID,
      repeat: {
        cron: config.queueSchedulerCrons.ierCron,
        tz: PST_TIMEZONE,
      },
    };
  }

  async onApplicationBootstrap() {
    // todo: ann do we lifecycle hooks.
    // todo: ann find how to pass parameter.
    await this.startIERSchedulerQueue.add(undefined, this.ierCronOptions);
    // TO REMOVE THE JOB
    // await this.startIERSchedulerQueue.removeRepeatable(
    //   this.ierCronOptions.repeat,
    // );
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
    job: Job<GeneratedDateQueueIInDTO | undefined>,
  ): Promise<IER12ResultQueueOutDTO[]> {
    this.logger.log("Executing IER 12 file generation ...");
    const uploadResult = await this.ierRequest.processIER12File(
      job.data.generatedDate,
    );
    this.logger.log("IER 12 file generation completed.");
    return uploadResult;
  }
  // todo: ann if its a universal event? ann test the student appliacion
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
