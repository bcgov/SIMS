import { Injectable } from "@nestjs/common";
import { MSFAANumber, OfferingIntensity } from "@sims/sims-db";
import {
  LoggerService,
  InjectLogger,
  ProcessSummary,
} from "@sims/utilities/logger";
import { getISODateOnlyString } from "@sims/utilities";
import { DataSource } from "typeorm";
import { SequenceControlService } from "@sims/services";
import {
  MSFAARecord,
  MSFAARequestFileLine,
  MSFAAUploadResult,
} from "./models/msfaa-integration.model";
import { MSFAAIntegrationService } from "./msfaa.integration.service";
import { ESDCFileHandler } from "../esdc-file-handler";
import { ConfigService } from "@sims/utilities/config";
import { MSFAANumberService } from "@sims/integrations/services";
import { CreateRequestFileNameResult } from "@sims/integrations/esdc-integration/models/esdc-integration.model";
import { MSFAA_SEQUENCE_GAP } from "@sims/services/constants";

@Injectable()
export class MSFAARequestProcessingService extends ESDCFileHandler {
  constructor(
    private readonly dataSource: DataSource,
    configService: ConfigService,
    private readonly sequenceService: SequenceControlService,
    private readonly msfaaNumberService: MSFAANumberService,
    private readonly msfaaService: MSFAAIntegrationService,
  ) {
    super(configService);
  }

  /**
   * 1. Fetches the MSFAA records which are not sent for request.
   * 2. Create Unique sequence for the request sent file.
   * 3. Create the Request content for the MSFAA file by populating the header, footer and trailer content.
   * 4. Create the request filename with the file path for the MSFAA Request sent File.
   * 5. Upload the content to the zoneB SFTP server.
   * 6. Update the MSFAA records, that are sent in the request sent file.
   * @param fileCode file code applicable for Part-Time or Full-Time.
   * @param offeringIntensity offering intensity.
   * @param processSummary process summary for logging.
   * @returns processing MSFAA request result.
   */
  async processMSFAARequest(
    fileCode: string,
    offeringIntensity: OfferingIntensity,
    processSummary: ProcessSummary,
  ): Promise<MSFAAUploadResult> {
    processSummary.info(
      `Retrieving pending ${offeringIntensity} MSFAA request.`,
    );
    const pendingMSFAARequests =
      await this.msfaaNumberService.getPendingMSFAARequest(offeringIntensity);
    processSummary.info(
      `Found ${pendingMSFAARequests.length} MSFAA number(s) for ${offeringIntensity} application that needs request.`,
    );
    const msfaaRecords = pendingMSFAARequests.map((pendingMSFAARequest) => {
      return this.createMSFAARecord(pendingMSFAARequest, offeringIntensity);
    });

    //Fetches the MSFAANumber ids, for further update in the db.
    const msfaaRecordIds = pendingMSFAARequests.map(
      (pendingMSFAARequest) => pendingMSFAARequest.id,
    );

    //Total hash of the Student's SIN, its used in the footer content.
    const totalSINHash = pendingMSFAARequests.reduce(
      (accumulator, pendingMSFAARequest) =>
        accumulator + parseInt(pendingMSFAARequest.student.sinValidation.sin),
      0,
    );

    //Create records and create the unique file sequence number
    let uploadResult: MSFAAUploadResult;
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      // MSFAA records process date.
      const processDate = new Date();
      // Sequence names for the MSFAA request file.
      const lifeTimeSequenceName = `MSFAA_${offeringIntensity}_SENT_FILE`;
      const dailyFileNameSequenceName = `${lifeTimeSequenceName}_${getISODateOnlyString(
        processDate,
      )}`;
      // File content and file name information.
      let fileContent: MSFAARequestFileLine[] = [];
      let fileInfo: CreateRequestFileNameResult;
      try {
        // Create MSFAA file with life time sequence.
        await this.sequenceService.consumeNextSequenceWithExistingEntityManager(
          lifeTimeSequenceName,
          transactionalEntityManager,
          async (nextSequenceNumber: number) => {
            processSummary.info("Creating MSFAA request content.");
            // For 0-record files, msfaaRecords and totalSINHash will be empty/0.
            fileContent = this.msfaaService.createMSFAARequestContent(
              msfaaRecords,
              nextSequenceNumber,
              totalSINHash,
              processDate,
            );
          },
        );
        // Create MSFAA file name with daily file name sequence.
        await this.sequenceService.consumeNextSequenceWithExistingEntityManager(
          dailyFileNameSequenceName,
          transactionalEntityManager,
          async (nextSequenceNumber: number) => {
            if (offeringIntensity === OfferingIntensity.fullTime) {
              // Applying MSFAA sequence gap only for Full-time MSFAA files to avoid conflict with legacy MSFAA files.
              // This is not applicable for Part-time MSFAA files as there is no legacy MSFAA files for Part-time.
              processSummary.info(
                `Applying MSFAA sequence gap to the sequence number. Current sequence gap ${MSFAA_SEQUENCE_GAP}.`,
              );
              nextSequenceNumber += MSFAA_SEQUENCE_GAP;
            }
            // Create the request filename with the file path for the MSFAA Request
            // sent File.
            fileInfo = this.createRequestFileName(fileCode, nextSequenceNumber);
            processSummary.info("Uploading content.");
          },
        );

        await this.msfaaService.uploadContent(fileContent, fileInfo.filePath);
        processSummary.info("Content uploaded.");
        uploadResult = {
          generatedFile: fileInfo.filePath,
          uploadedRecords: fileContent.length - 2, // Do not consider header and footer.
        };

        // Creates the repository based on the entity manager that
        // holds the transaction already created to manage the
        // sequence number.
        const msfaaNumberRepo =
          transactionalEntityManager.getRepository(MSFAANumber);
        await this.msfaaNumberService.updateRecordsInSentFile(
          msfaaRecordIds,
          processDate,
          msfaaNumberRepo,
        );
      } catch (error: unknown) {
        const errorMessage = `Error while uploading content for ${offeringIntensity} MSFAA request.`;
        this.logger.error(errorMessage, error);
        throw new Error(errorMessage, { cause: error });
      }
    });
    return uploadResult;
  }

  /**
   * Use the information on the MSFAA, referenced application
   * student, user and institutionlocation objects are used
   * to generate the record to be send to MSFAA request.
   * @param pendingMSFAARecords referenced application
   * student, user and institutionlocation information.
   * @param offeringIntensity offeringintensity of the record.
   * @returns MSFAA record for the student.
   */
  private createMSFAARecord(
    pendingMSFAARecords: MSFAANumber,
    offeringIntensity: string,
  ): MSFAARecord {
    const addressInfo = pendingMSFAARecords.student.contactInfo.address;
    return {
      id: pendingMSFAARecords.id,
      msfaaNumber: pendingMSFAARecords.msfaaNumber,
      sin: pendingMSFAARecords.student.sinValidation.sin,
      institutionCode:
        pendingMSFAARecords.referenceApplication.currentAssessment.offering
          .institutionLocation.institutionCode,
      birthDate: new Date(pendingMSFAARecords.student.birthDate),
      surname: pendingMSFAARecords.student.user.lastName,
      givenName: pendingMSFAARecords.student.user.firstName,
      gender: pendingMSFAARecords.student.gender,
      maritalStatus:
        pendingMSFAARecords.referenceApplication.relationshipStatus,
      addressLine1: addressInfo.addressLine1,
      addressLine2: addressInfo.addressLine2,
      city: addressInfo.city,
      provinceState: addressInfo.provinceState,
      postalCode: addressInfo.postalCode,
      country: addressInfo.country,
      phone: pendingMSFAARecords.student.contactInfo.phone,
      email: pendingMSFAARecords.student.user.email,
      offeringIntensity: offeringIntensity,
    } as MSFAARecord;
  }

  @InjectLogger()
  logger: LoggerService;
}
