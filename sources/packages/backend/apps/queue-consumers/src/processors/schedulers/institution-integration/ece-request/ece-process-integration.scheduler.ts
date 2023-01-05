import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { ECEFileService } from "@sims/integrations/institution-integration/ece-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import {
  GeneratedDateQueueInDTO,
  ECEProcessResultQueueOutDTO,
} from "./models/ece.model";

@Processor(QueueNames.ECEProcessIntegration)
export class ECEProcessIntegrationScheduler extends BaseScheduler<GeneratedDateQueueInDTO> {
  constructor(
    @InjectQueue(QueueNames.ECEProcessIntegration)
    schedulerQueue: Queue<GeneratedDateQueueInDTO>,
    private readonly eceFileService: ECEFileService,
    queueService: QueueService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Identifies all the applications that have an eligible COE request waiting
   * for a particular institution and generate the request file.
   * @params job has generatedDate Date in which the assessment for
   * particular institution is generated.
   * @returns Processing result log.
   */
  @Process()
  async processECERequest(
    job: Job<GeneratedDateQueueInDTO | undefined>,
  ): Promise<ECEProcessResultQueueOutDTO[]> {
    this.logger.log(
      `Processing ECE request integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Executing ECE request file generation ...");
    const uploadResult = await this.eceFileService.processECEFile(
      job.data.generatedDate,
    );
    this.logger.log("ECE request file generation completed.");
    await this.cleanSchedulerQueueHistory();
    return uploadResult;
  }

  @InjectLogger()
  logger: LoggerService;
}
