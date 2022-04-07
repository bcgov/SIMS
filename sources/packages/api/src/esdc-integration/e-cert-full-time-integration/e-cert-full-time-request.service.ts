import { Injectable } from "@nestjs/common";
import { InjectLogger } from "../../common";
import {
  DisbursementSchedule,
  OfferingIntensity,
} from "../../database/entities";
import { LoggerService } from "../../logger/logger.service";
import {
  getFieldOfStudyFromCIPCode,
  getUTCNow,
  getDayOfTheYear,
} from "../../utilities";
import { EntityManager } from "typeorm";
import {
  ConfigService,
  DisbursementScheduleService,
  SequenceControlService,
} from "../../services";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration.service";
import {
  Award,
  ECertFTRecord,
  ECertUploadResult,
} from "./models/e-cert-full-time-integration.model";
import { ESDCFileHandler } from "../esdc-file-handler";

const ECERT_SENT_FILE_SEQUENCE_GROUP = "ECERT_SENT_FILE";

@Injectable()
export class ECertFullTimeRequestService extends ESDCFileHandler {
  constructor(
    config: ConfigService,
    sequenceService: SequenceControlService,
    private readonly ecertIntegrationService: ECertFullTimeIntegrationService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
  ) {
    super(config, sequenceService);
  }

  /**
   * Get all Full-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async generateFTECert(): Promise<ECertUploadResult> {
    this.logger.log(
      "Retrieving Full-Time disbursements to generate the e-Cert file...",
    );
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
    this.logger.log(
      `Found ${disbursements.length} Full-Time disbursements schedules.`,
    );
    const disbursementRecords = disbursements.map((disbursement) => {
      return this.createFTECertRecord(disbursement);
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
          this.logger.log("Creating  Full-Time e-Cert file content...");
          const fileContent = this.ecertIntegrationService.createRequestContent(
            disbursementRecords,
            nextSequenceNumber,
          );
          // Create the request filename with the file path for the e-Cert File.
          const fileInfo = await this.createRequestFileName(
            `PBC.EDU.ECERTS.D${now.getFullYear()}${dayOfTheYear}`,
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

          this.logger.log("Uploading Full-Time content...");
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
            `Error while uploading content for Full-Time e-Cert file: ${error}`,
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
  private createFTECertRecord(
    disbursement: DisbursementSchedule,
  ): ECertFTRecord {
    const now = new Date();
    const application = disbursement.studentAssessment.application;
    const [addressInfo] = application.student.contactInfo.addresses;
    const fieldOfStudy = getFieldOfStudyFromCIPCode(
      application.currentAssessment.offering.educationProgram.cipCode,
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
      sin: application.student.sin,
      applicationNumber: application.applicationNumber,
      documentNumber: disbursement.documentNumber,
      disbursementDate: disbursement.disbursementDate,
      documentProducedDate: now,
      negotiatedExpiryDate: disbursement.negotiatedExpiryDate,
      schoolAmount:
        application.currentAssessment.offering.tuitionRemittanceRequestedAmount,
      educationalStartDate:
        application.currentAssessment.offering.studyStartDate,
      educationalEndDate: application.currentAssessment.offering.studyEndDate,
      federalInstitutionCode: application.location.institutionCode,
      weeksOfStudy: application.currentAssessment.assessmentData.weeks,
      fieldOfStudy,
      yearOfStudy: application.currentAssessment.offering.yearOfStudy,
      completionYears:
        application.currentAssessment.offering.educationProgram.completionYears,
      enrollmentConfirmationDate: disbursement.coeUpdatedAt,
      dateOfBirth: application.student.birthDate,
      lastName: application.student.user.lastName,
      firstName: application.student.user.firstName,
      addressLine1: addressInfo.addressLine1,
      addressLine2: addressInfo.addressLine2,
      city: addressInfo.city,
      country: addressInfo.country,
      email: application.student.user.email,
      gender: application.student.gender,
      maritalStatus: application.relationshipStatus,
      studentNumber: application.studentNumber,
      awards,
    } as ECertFTRecord;
  }

  @InjectLogger()
  logger: LoggerService;
}
