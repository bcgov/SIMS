import { Injectable } from "@nestjs/common";
import { InjectLogger } from "../../common";
import {
  DisbursementSchedule,
  OfferingIntensity,
} from "../../database/entities";
import { LoggerService } from "../../logger/logger.service";
import { getFieldOfStudyFromCIPCode, getUTCNow } from "../../utilities";
import { EntityManager } from "typeorm";
import {
  DisbursementScheduleService,
  SequenceControlService,
} from "../../services";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration.service";
import {
  Award,
  ECertRecord,
  ECertUploadResult,
} from "./models/e-cert-full-time-integration.model";

const ECERT_SENT_FILE_SEQUENCE_GROUP = "ECERT_SENT_FILE";

@Injectable()
export class ECertFullTimeRequestService {
  constructor(
    private readonly ecertIntegrationService: ECertFullTimeIntegrationService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly sequenceService: SequenceControlService,
  ) {}

  /**
   * Get all full time disbursements available to be sent to ESDC.
   * Considerer any record that is scheduled in upcoming days or in the past.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async generateECert(): Promise<ECertUploadResult> {
    this.logger.log(`Retrieving disbursements to generate the e-Cert file...`);
    const disbursements =
      await this.disbursementScheduleService.getECertInformationToBeSent(
        OfferingIntensity.fullTime,
      );
    if (!disbursements.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }
    this.logger.log(`Found ${disbursements.length} disbursements schedules.`);
    const disbursementRecords = disbursements.map((disbursement) => {
      return this.createECertRecord(disbursement);
    });

    // Fetches the disbursements ids, for further update in the DB.
    const disbursementIds = disbursements.map(
      (disbursement) => disbursement.id,
    );

    //Create records and create the unique file sequence number
    let uploadResult: ECertUploadResult;
    await this.sequenceService.consumeNextSequence(
      ECERT_SENT_FILE_SEQUENCE_GROUP,
      async (nextSequenceNumber: number, entityManager: EntityManager) => {
        try {
          this.logger.log("Creating e-Cert file content...");
          const fileContent = this.ecertIntegrationService.createRequestContent(
            disbursementRecords,
            nextSequenceNumber,
          );
          // Create the request filename with the file path for the e-Cert File.
          const fileInfo =
            await this.ecertIntegrationService.createRequestFileName(
              entityManager,
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

          this.logger.log("Uploading content...");
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
            `Error while uploading content for e-Cert file: ${error}`,
          );
          throw error;
        }
      },
    );
    return uploadResult;
  }

  /**
   * Create the e-Cert record with the information needed to generate the
   * entire record to be sent to ESDC.
   * @param disbursement disbursement that contains all information to
   * generate the record.
   * @returns e-Cert record.
   */
  private createECertRecord(disbursement: DisbursementSchedule): ECertRecord {
    const now = new Date();
    const addressInfo =
      disbursement.application.student.contactInfo.addresses[0];
    const fieldOfStudy = getFieldOfStudyFromCIPCode(
      disbursement.application.offering.educationProgram.cipCode,
    );
    const awards = disbursement.disbursementValues.map(
      (disbursementValue) =>
        ({
          valueType: disbursementValue.valueType,
          valueCode: disbursementValue.valueCode,
          valueAmount: disbursementValue.valueAmount,
        } as Award),
    );

    return {
      sin: disbursement.application.student.sin,
      applicationNumber: disbursement.application.applicationNumber,
      documentNumber: disbursement.documentNumber,
      disbursementDate: disbursement.disbursementDate,
      documentProducedDate: now,
      negotiatedExpiryDate: disbursement.negotiatedExpiryDate,
      schoolAmount:
        disbursement.application.offering.tuitionRemittanceRequestedAmount,
      educationalStartDate: disbursement.application.offering.studyStartDate,
      educationalEndDate: disbursement.application.offering.studyEndDate,
      federalInstitutionCode: disbursement.application.location.institutionCode,
      weeksOfStudy: disbursement.application.assessment.weeks,
      fieldOfStudy,
      yearOfStudy: disbursement.application.offering.yearOfStudy,
      completionYears:
        disbursement.application.offering.educationProgram.completionYears,
      // TODO: not available (to be defined/added).
      enrollmentConfirmationDate: now,
      dateOfBirth: disbursement.application.student.birthDate,
      lastName: disbursement.application.student.user.lastName,
      firstName: disbursement.application.student.user.firstName,
      addressLine1: addressInfo.addressLine1,
      addressLine2: addressInfo.addressLine2,
      city: addressInfo.city,
      country: addressInfo.country,
      email: disbursement.application.student.user.email,
      gender: disbursement.application.student.gender,
      maritalStatus: disbursement.application.relationshipStatus,
      // TODO: student number to be saved alongside the application (to be defined).
      studentNumber:
        disbursement.application.data?.studentNumber.toString() || "",
      awards,
    } as ECertRecord;
  }

  @InjectLogger()
  logger: LoggerService;
}
