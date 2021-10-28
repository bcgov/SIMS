import { Injectable } from "@nestjs/common";
import { InjectLogger } from "src/common";
import { MSFAANumber } from "src/database/entities";
import { LoggerService } from "src/logger/logger.service";
import { getUTCNow } from "src/utilities";
import { EntityManager } from "typeorm";
import { MSFAANumberService, SequenceControlService } from "../services";
import {
  MSFAARecord,
  MSFAAUploadResult,
} from "./models/msfaa-integration.model";
import { MSFAAIntegrationService } from "./msfaa-integration.service";

@Injectable()
export class MSFAAValidationService {
  constructor(
    private readonly msfaaNumberService: MSFAANumberService,
    private readonly msfaaService: MSFAAIntegrationService,
    private readonly sequenceService: SequenceControlService,
  ) {}

  /**
   * 1. Fetches the MSFAA number records which are not sent for validation.
   * 2.
   * @returns Processing result log.
   */
  async processMSFAAValidation(
    offeringIntensity: string,
  ): Promise<MSFAAUploadResult> {
    this.logger.log(
      `Retrieving pending ${offeringIntensity} MSFAA validation...`,
    );
    const pendingMSFAAValidations =
      await this.msfaaNumberService.getPendingMSFAAValidation(
        offeringIntensity,
      );
    if (!pendingMSFAAValidations.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }
    this.logger.log(
      `Found ${pendingMSFAAValidations.length} MSFAA number(s) for ${offeringIntensity} application that needs validation.`,
    );
    const msfaaRecords = pendingMSFAAValidations.map(
      (pendingMSFAAValidation) => {
        return this.createMSFAARecord(
          pendingMSFAAValidation,
          offeringIntensity,
        );
      },
    );
    const msfaaRecordIds = pendingMSFAAValidations.map(
      (pendingMSFAAValidation) => pendingMSFAAValidation.id,
    );

    //Create records and create file
    let uploadResult: MSFAAUploadResult;
    await this.sequenceService.consumeNextSequence(
      `MSFAA_${offeringIntensity}_SENT_FILE`,
      async (nextSequenceNumber: number, entityManager: EntityManager) => {
        try {
          this.logger.log("Creating income verification content...");
          const fileContent = this.msfaaService.createMSFAAValidationContent(
            msfaaRecords,
            nextSequenceNumber,
          );
          const fileInfo =
            this.msfaaService.createRequestFileName(offeringIntensity);
          this.logger.log("Uploading content...");
          uploadResult = await this.msfaaService.uploadContent(
            fileContent,
            fileInfo.filePath,
          );

          // Creates the repository based on the entity manager that
          // holds the transaction already created to manage the
          // sequence number.
          const msfaaNumberRepo = entityManager.getRepository(MSFAANumber);
          this.msfaaNumberService.updateSentFile(
            msfaaRecordIds,
            getUTCNow(),
            msfaaNumberRepo,
          );
        } catch (error) {
          this.logger.error(
            `Error while uploading content for ${offeringIntensity} MSFAA Validation: ${error}`,
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
   * to generate the record to be send to MSFAA validation.
   * @param pendingMSFAARecords referenced application
   * student, user and institutionlocation information.
   * @param offeringIntensity offeringintensity of the record.
   * @returns CRA record for the student.
   */
  private createMSFAARecord(
    pendingMSFAARecords: MSFAANumber,
    offeringIntensity: string,
  ): MSFAARecord {
    return {
      id: pendingMSFAARecords.id,
      msfaaNumber: pendingMSFAARecords.msfaaNumber,
      sin: pendingMSFAARecords.student.sin,
      institutionCode:
        pendingMSFAARecords.referenceApplication.offering.institutionLocation
          .institutionCode,
      birthDate: pendingMSFAARecords.student.birthdate,
      surname: pendingMSFAARecords.student.user.lastName,
      givenName: pendingMSFAARecords.student.user.firstName,
      gender: pendingMSFAARecords.student.gender,
      maritalStatus: "married",
      addressLine1:
        pendingMSFAARecords.student.contactInfo.addresses[0].addressLine1,
      addressLine2:
        pendingMSFAARecords.student.contactInfo.addresses[0].addressLine2,
      city: pendingMSFAARecords.student.contactInfo.addresses[0].city,
      province: pendingMSFAARecords.student.contactInfo.addresses[0].province,
      postalCode:
        pendingMSFAARecords.student.contactInfo.addresses[0].postalCode,
      country: pendingMSFAARecords.student.contactInfo.addresses[0].country,
      phone: pendingMSFAARecords.student.contactInfo.phone,
      email: pendingMSFAARecords.student.user.email,
      offeringIntensity: offeringIntensity,
    } as MSFAARecord;
  }

  @InjectLogger()
  logger: LoggerService;
}
