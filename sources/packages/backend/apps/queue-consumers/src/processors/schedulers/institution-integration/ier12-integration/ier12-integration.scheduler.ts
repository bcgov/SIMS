import { InjectQueue, Processor } from "@nestjs/bull";
import { IER12ProcessingService } from "@sims/integrations/institution-integration/ier12-integration";
import { QueueService } from "@sims/services/queue";
import { addDays, getISODateOnlyString, QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { IER12IntegrationQueueInDTO } from "./models/ier.model";
import { INSTITUTION_LOCATION_CODE_MAX_LENGTH } from "@sims/sims-db/entities/institution.model";

@Processor(QueueNames.IER12Integration)
export class IER12IntegrationScheduler extends BaseScheduler<IER12IntegrationQueueInDTO> {
  constructor(
    @InjectQueue(QueueNames.IER12Integration)
    schedulerQueue: Queue<IER12IntegrationQueueInDTO>,
    private readonly ierRequest: IER12ProcessingService,
    queueService: QueueService,
    logger: LoggerService,
  ) {
    super(schedulerQueue, queueService, logger);
  }

  /**
   * Identifies all the applications which are in assessment
   * for a particular institution and generate the request file.
   * @param job The job containing the data for processing including modifiedSince and institutionCode.
   * @param processSummary process summary for logging.
   * @returns processing result log.
   */
  protected async process(
    job: Job<IER12IntegrationQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string[] | string> {
    if (
      !this.validateJobData(
        processSummary,
        job.data.modifiedSince,
        job.data.institutionCode,
      )
    ) {
      return "Invalid job data.";
    }
    const uploadResults = await this.ierRequest.processIER12File(
      processSummary,
      job.data.modifiedSince,
      job.data.institutionCode,
    );
    if (!uploadResults.length) {
      return "No IER12 files were generated.";
    }
    return uploadResults.map(
      (uploadResult) =>
        `Uploaded file ${uploadResult.generatedFile}, with ${uploadResult.uploadedRecords} record(s).`,
    );
  }

  /**
   * Validate the job data for IER 12 processing.
   * @param processSummary process summary for logging.
   * @param modifiedSince Inclusive date since the application or student data was modified.
   * @param institutionCode Institution code to limit applications to a specific institution.
   * @returns boolean indicating whether the job data is valid or not.
   */
  private validateJobData(
    processSummary: ProcessSummary,
    modifiedSince?: string,
    institutionCode?: string,
  ): boolean {
    if (modifiedSince !== undefined) {
      const modifiedSinceDate = new Date(modifiedSince);
      // Date must be in ISO format (YYYY-MM-DD).
      if (Number.isNaN(modifiedSinceDate.getTime())) {
        processSummary.info(
          "Job data modifiedSince must be a valid ISO date (YYYY-MM-DD).",
        );
        return false;
      }
      // Modified since cannot be more than one year in the past.
      const oneYearAgo = addDays(-365, getISODateOnlyString(new Date()));
      if (modifiedSinceDate < oneYearAgo) {
        processSummary.info(
          "Job data modifiedSince cannot be more than one year in the past.",
        );
        return false;
      }
    }
    // Institution code, if provided, must be exactly 4 characters.
    if (
      institutionCode !== undefined &&
      institutionCode.length !== INSTITUTION_LOCATION_CODE_MAX_LENGTH
    ) {
      processSummary.info(
        `Job data institutionCode must be exactly ${INSTITUTION_LOCATION_CODE_MAX_LENGTH} characters.`,
      );
      return false;
    }
    return true;
  }
}
