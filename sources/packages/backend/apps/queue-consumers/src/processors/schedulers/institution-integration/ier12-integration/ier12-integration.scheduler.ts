import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { IER12ProcessingService } from "@sims/integrations/institution-integration/ier12-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { QueueProcessSummaryResult } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { GeneratedDateQueueInDTO } from "./models/ier.model";

@Processor(QueueNames.IER12Integration)
export class IER12IntegrationScheduler extends BaseScheduler<GeneratedDateQueueInDTO> {
  constructor(
    @InjectQueue(QueueNames.IER12Integration)
    schedulerQueue: Queue<GeneratedDateQueueInDTO>,
    private readonly ierRequest: IER12ProcessingService,
    queueService: QueueService,
  ) {
    super(schedulerQueue, queueService);
  }

  processQueue(job: Job<GeneratedDateQueueInDTO>): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  async process(
    _job: Job<GeneratedDateQueueInDTO>,
    _processSummary: ProcessSummary,
  ): Promise<string | string[]> {
    throw new Error("Method not implemented.");
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
  ): Promise<QueueProcessSummaryResult[]> {
    this.logger.log(
      `Processing IER integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Executing IER 12 file generation ...");
    const uploadResults = await this.ierRequest.processIER12File(
      job.data.generatedDate,
    );
    this.logger.log("IER 12 file generation completed.");

    return uploadResults.map(
      (uploadResult) =>
        ({
          summary: [
            `The uploaded file: ${uploadResult.generatedFile}`,
            `The number of records: ${uploadResult.uploadedRecords}`,
          ],
        } as QueueProcessSummaryResult),
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
