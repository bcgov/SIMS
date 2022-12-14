import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { IER12FileService } from "@sims/integrations/institution-integration/ier12-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import {
  GeneratedDateQueueInDTO,
  IER12ResultQueueOutDTO,
} from "./models/ier.model";

@Processor(QueueNames.IER12Integration)
export class IER12IntegrationScheduler extends BaseScheduler<GeneratedDateQueueInDTO> {
  constructor(
    @InjectQueue(QueueNames.IER12Integration)
    protected readonly schedulerQueue: Queue<GeneratedDateQueueInDTO>,
    private readonly ierRequest: IER12FileService,
    protected readonly queueService: QueueService,
  ) {
    super(schedulerQueue, queueService);
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
    this.logger.log(
      `Processing IER integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Executing IER 12 file generation ...");
    const uploadResult = await this.ierRequest.processIER12File(
      job.data.generatedDate,
    );
    this.logger.log("IER 12 file generation completed.");
    await this.cleanSchedulerQueueHistory();
    return uploadResult;
  }

  @InjectLogger()
  logger: LoggerService;
}
