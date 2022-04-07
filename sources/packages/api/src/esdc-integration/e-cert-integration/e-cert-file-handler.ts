import { InjectLogger } from "../../common";
import {
  DisbursementSchedule,
  OfferingIntensity,
} from "../../database/entities";
import { LoggerService } from "../../logger/logger.service";
import {
  DisbursementScheduleService,
  SequenceControlService,
} from "../../services";
import { getDayOfTheYear, getUTCNow } from "../../utilities";
import { EntityManager } from "typeorm";
import { ESDCFileHandler } from "../esdc-file-handler";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration/e-cert-full-time-integration.service";
import { ECertFullTimeRequestService } from "./e-cert-full-time-integration/e-cert-full-time-request.service";
import { ECertUploadResult } from "./e-cert-full-time-integration/models/e-cert-full-time-integration.model";

const ECERT_SENT_FILE_SEQUENCE_GROUP = "ECERT_SENT_FILE";

export class ECertFileHandler extends ESDCFileHandler {
  constructor(
    sequenceService: SequenceControlService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly ecertIntegrationService: ECertFullTimeIntegrationService,
    private readonly eCertFullTimeRequestService: ECertFullTimeRequestService,
  ) {
    super(sequenceService);
  }
  /**
   * Get all Full-Time/ Part-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async generateECert(
    offeringIntensity: OfferingIntensity,
    fileCode: string,
  ): Promise<ECertUploadResult> {
    this.logger.log(
      `Retrieving ${offeringIntensity} disbursements to generate the e-Cert file...`,
    );
    const disbursements =
      await this.disbursementScheduleService.getECertInformationToBeSent(
        offeringIntensity,
      );
    if (!disbursements.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }
    this.logger.log(
      `Found ${disbursements.length} ${offeringIntensity} disbursements schedules.`,
    );
    const disbursementRecords = disbursements.map((disbursement) => {
      return this.eCertFullTimeRequestService.createFTECertRecord(disbursement);
    });

    // Fetches the disbursements ids, for further update in the DB.
    const disbursementIds = disbursements.map(
      (disbursement) => disbursement.id,
    );

    //Create records and create the unique file sequence number
    let uploadResult: ECertUploadResult;
    const now = new Date();
    const dayOfTheYear = getDayOfTheYear(now);
    await this.sequenceService.consumeNextSequence(
      ECERT_SENT_FILE_SEQUENCE_GROUP,
      async (nextSequenceNumber: number, entityManager: EntityManager) => {
        try {
          this.logger.log(
            `Creating  ${offeringIntensity} e-Cert file content...`,
          );
          const fileContent = this.ecertIntegrationService.createRequestContent(
            disbursementRecords,
            nextSequenceNumber,
          );
          // Create the request filename with the file path for the e-Cert File.
          const fileInfo = await this.createRequestFileName(
            `${fileCode}${now.getFullYear()}${dayOfTheYear}`,
            nextSequenceNumber,
          );

          // Creates the repository based on the entity manager that
          // holds the transaction already created to manage the
          // sequence number.
          const disbursementScheduleRepo =
            entityManager.getRepository(DisbursementSchedule);
          this.disbursementScheduleService.updateRecordsInSentFile(
            disbursementIds,
            getUTCNow(),
            disbursementScheduleRepo,
          );

          this.logger.log(`Uploading ${offeringIntensity} content...`);
          await this.ecertIntegrationService.uploadContent(
            fileContent,
            fileInfo.filePath,
          );

          uploadResult = {
            generatedFile: fileInfo.filePath,
            uploadedRecords: disbursementRecords.length,
          };
        } catch (error) {
          this.logger.error(
            `Error while uploading content for ${offeringIntensity} e-Cert file: ${error}`,
          );
          throw error;
        }
      },
    );
    return uploadResult;
  }

  @InjectLogger()
  logger: LoggerService;
}
