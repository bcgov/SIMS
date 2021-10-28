import { Injectable } from "@nestjs/common";
import { InjectLogger } from "src/common";
import { CRAUploadResult } from "src/cra-integration/cra-integration.models";
import { CRAIntegrationService } from "src/cra-integration/cra-integration.service";
import { MSFAANumber, OfferingIntensity } from "src/database/entities";
import { LoggerService } from "src/logger/logger.service";
import { MSFAAFileResultDto } from "src/route-controllers/msfaa-integration/models/msfaa-file-result.dto";
import { getUTCNow } from "src/utilities";
import { EntityManager } from "typeorm";
import { ConfigService, MSFAANumberService, SequenceControlService } from "..";
import { MSFAARecord } from "./models/msfaa-integration.model";

@Injectable()
export class MSFAAValidationService {
  constructor(
    private readonly msfaaNumberService: MSFAANumberService,
    private readonly craService: CRAIntegrationService,
    private readonly sequenceService: SequenceControlService,
  ) {}

  /**
   * 1. Fetches the MSFAA number records which are not sent for validation.
   * 2.
   * @returns Processing result log.
   */
  async processMSFAAValidation(
    offeringIntensity: string,
  ): Promise<MSFAAFileResultDto> {
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
        const msfaaRecord = this.createMSFAARecord(
          pendingMSFAAValidation,
          offeringIntensity,
        );
        return msfaaRecord;
      },
    );
    const msfaaRecordIds = msfaaRecords.map((msfaaRecord) => msfaaRecord.id);

    //Create records and create file
    let uploadResult: CRAUploadResult;
    await this.sequenceService.consumeNextSequence(
      `MSFAA_${offeringIntensity}_SENT_FILE`,
      async (nextSequenceNumber: number, entityManager: EntityManager) => {
        try {
          this.logger.log("Creating income verification content...");
          const fileContent = this.createMSFAAValidationContent(
            msfaaRecords,
            nextSequenceNumber,
          );
          const fileInfo =
            this.craService.createRequestFileName(nextSequenceNumber);
          this.logger.log("Uploading content...");
          uploadResult = await this.craService.uploadContent(
            fileContent,
            fileInfo.filePath,
          );

          // Creates the repository based on the entity manager that
          // holds the transaction already created to manage the
          // sequence number.
          const incomeVerificationRepo = entityManager.getRepository(
            CRAIncomeVerification,
          );
          this.incomeVerificationService.updateSentFile(
            msfaaRecordIds,
            getUTCNow(),
            fileInfo.fileName,
            incomeVerificationRepo,
          );
        } catch (error) {
          this.logger.error(
            `Error while uploading content for income verification: ${error}`,
          );
          throw error;
        }
      },
    );
    return {
      generatedFile: `present: ${msfaaRecords.length}`,
      uploadedRecords: 0,
    };
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
  private async createMSFAARecord(
    pendingMSFAARecords: MSFAANumber,
    offeringIntensity: string,
  ): Promise<MSFAARecord> {
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
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
