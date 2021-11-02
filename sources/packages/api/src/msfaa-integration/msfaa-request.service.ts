import { Injectable } from "@nestjs/common";
import { InjectLogger } from "../common";
import { MSFAANumber } from "../database/entities";
import { LoggerService } from "../logger/logger.service";
import { getUTCNow } from "../utilities";
import { EntityManager } from "typeorm";
import { MSFAANumberService, SequenceControlService } from "../services";
import {
  MSFAARecord,
  MSFAAUploadResult,
} from "./models/msfaa-integration.model";
import { MSFAAIntegrationService } from "./msfaa-integration.service";
import { OfferingIntensity } from "../database/entities/offering-intensity.type";

@Injectable()
export class MSFAARequestService {
  constructor(
    private readonly msfaaNumberService: MSFAANumberService,
    private readonly msfaaService: MSFAAIntegrationService,
    private readonly sequenceService: SequenceControlService,
  ) {}

  /**
   * 1. Fetches the MSFAA records which are not sent for request.
   * 2. Create Unique sequence for the request sent file.
   * 3. Create the Request content for the MSFAA file by populating the
   *      header, footer and trailer content.
   * 4. Create the request filename with the file path for the MSFAA Request
   *      sent File.
   * 5. Upload the content to the zoneB SFTP server.
   * 6. Update the MSFAA records, that are sent in the request sent file.
   * @returns Processing MSFAA request result.
   */
  async processMSFAARequest(
    offeringIntensity: OfferingIntensity,
  ): Promise<MSFAAUploadResult> {
    this.logger.log(`Retrieving pending ${offeringIntensity} MSFAA request...`);
    const pendingMSFAARequests =
      await this.msfaaNumberService.getPendingMSFAARequest(offeringIntensity);
    if (!pendingMSFAARequests.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }
    this.logger.log(
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
        accumulator + parseInt(pendingMSFAARequest.student.sin),
      0,
    );

    //Create records and create the unique file sequence number
    let uploadResult: MSFAAUploadResult;
    await this.sequenceService.consumeNextSequence(
      `MSFAA_${offeringIntensity}_SENT_FILE`,
      async (nextSequenceNumber: number, entityManager: EntityManager) => {
        try {
          this.logger.log("Creating MSFAA request content...");
          // Create the Request content for the MSFAA file by populating the
          // header, footer and trailer content.
          const fileContent = this.msfaaService.createMSFAARequestContent(
            msfaaRecords,
            nextSequenceNumber,
            totalSINHash,
          );
          // Create the request filename with the file path for the MSFAA Request
          // sent File.
          const fileInfo = await this.msfaaService.createRequestFileName(
            offeringIntensity,
            entityManager,
          );
          this.logger.log("Uploading content...");
          uploadResult = await this.msfaaService.uploadContent(
            fileContent,
            fileInfo.filePath,
          );

          // Creates the repository based on the entity manager that
          // holds the transaction already created to manage the
          // sequence number.
          const msfaaNumberRepo = entityManager.getRepository(MSFAANumber);
          this.msfaaNumberService.updateRecordsInSentFile(
            msfaaRecordIds,
            getUTCNow(),
            msfaaNumberRepo,
          );
        } catch (error) {
          this.logger.error(
            `Error while uploading content for ${offeringIntensity} MSFAA Request: ${error}`,
          );
          throw error;
        }
      },
    );
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
    const addressInfo = pendingMSFAARecords.student.contactInfo.addresses[0];
    return {
      id: pendingMSFAARecords.id,
      msfaaNumber: pendingMSFAARecords.msfaaNumber,
      sin: pendingMSFAARecords.student.sin,
      institutionCode:
        pendingMSFAARecords.referenceApplication.offering.institutionLocation
          .institutionCode,
      birthDate: pendingMSFAARecords.student.birthDate,
      surname: pendingMSFAARecords.student.user.lastName,
      givenName: pendingMSFAARecords.student.user.firstName,
      gender: pendingMSFAARecords.student.gender,
      //TODO needed to make it dynamic, in the future stories
      maritalStatus: "married",
      addressLine1: addressInfo.addressLine1,
      addressLine2: addressInfo.addressLine2,
      city: addressInfo.city,
      province: addressInfo.province,
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
