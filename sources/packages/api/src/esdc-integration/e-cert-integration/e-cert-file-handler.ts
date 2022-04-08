import { InjectLogger } from "../../common";
import {
  DisbursementSchedule,
  OfferingIntensity,
} from "../../database/entities";
import { LoggerService } from "../../logger/logger.service";
import {
  ConfigService,
  DisbursementScheduleService,
  SequenceControlService,
} from "../../services";
import {
  ECERT_FULL_TIME_FILE_CODE,
  ECERT_PART_TIME_FILE_CODE,
  getDayOfTheYear,
  getFieldOfStudyFromCIPCode,
} from "../../utilities";
import { EntityManager } from "typeorm";
import { ESDCFileHandler } from "../esdc-file-handler";
import { ECertUploadResult } from "./e-cert-full-time-integration/models/e-cert-full-time-integration.model";
import { Injectable } from "@nestjs/common";
import { Award, ECertRecord } from "./e-cert-integration-model";
import { ECertIntegrationService } from "./e-cert-integration.service";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration/e-cert-full-time-integration.service";
import { ECertPartTimeIntegrationService } from "./e-cert-part-time-integration/e-cert-part-time-integration.service";
import { ECertResponseRecord } from "./e-cert-full-time-integration/e-cert-files/e-cert-response-record";

const ECERT_FULL_TIME_SENT_FILE_SEQUENCE_GROUP = "ECERT_FT_SENT_FILE";
const ECERT_PART_TIME_SENT_FILE_SEQUENCE_GROUP = "ECERT_PT_SENT_FILE";
@Injectable()
export class ECertFileHandler extends ESDCFileHandler {
  constructor(
    configService: ConfigService,
    private readonly sequenceService: SequenceControlService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly eCertFullTimeIntegrationService: ECertFullTimeIntegrationService,
    private readonly eCertPartTimeIntegrationService: ECertPartTimeIntegrationService,
  ) {
    super(configService);
  }

  /**
   * Method to call the Full-time disbursements available to be sent to ESDC.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async generateFullTimeECert(): Promise<ECertUploadResult> {
    return this.generateECert(
      this.eCertFullTimeIntegrationService,
      OfferingIntensity.fullTime,
      ECERT_FULL_TIME_FILE_CODE,
      ECERT_FULL_TIME_SENT_FILE_SEQUENCE_GROUP,
    );
  }

  /**
   * Method to call the Part-time disbursements available to be sent to ESDC.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async generatePartTimeECert(): Promise<ECertUploadResult> {
    return this.generateECert(
      this.eCertPartTimeIntegrationService,
      OfferingIntensity.partTime,
      ECERT_PART_TIME_FILE_CODE,
      ECERT_PART_TIME_SENT_FILE_SEQUENCE_GROUP,
    );
  }

  /**
   * Get all Full-Time/ Part-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @param eCertIntegrationService
   * @param offeringIntensity disbursement offering intensity.
   * @param fileCode File code applicable for Part-Time or Full-Time.
   * @param sequenceGroup Sequence group application for Part-Time or Full-Time.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async generateECert(
    eCertIntegrationService: ECertIntegrationService<
      ECertResponseRecord[] | void
    >,
    offeringIntensity: OfferingIntensity,
    fileCode: string,
    sequenceGroup: string,
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
      return this.createECertRecord(disbursement);
    });

    // Fetches the disbursements ids, for further update in the DB.
    const disbursementIds = disbursements.map(
      (disbursement) => disbursement.id,
    );

    //Create records and create the unique file sequence number.
    let uploadResult: ECertUploadResult;
    const now = new Date();
    const dayOfTheYear = getDayOfTheYear(now);
    await this.sequenceService.consumeNextSequence(
      sequenceGroup,
      async (nextSequenceNumber: number, entityManager: EntityManager) => {
        try {
          this.logger.log(
            `Creating  ${offeringIntensity} e-Cert file content...`,
          );
          const fileContent = eCertIntegrationService.createRequestContent(
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
          await this.disbursementScheduleService.updateRecordsInSentFile(
            disbursementIds,
            now,
            disbursementScheduleRepo,
          );

          this.logger.log(`Uploading ${offeringIntensity} content...`);
          await eCertIntegrationService.uploadContent(
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

  /**
   * Create the e-Cert record with the information needed to generate the
   * entire record to be sent to ESDC.
   * @param disbursement disbursement that contains all information to
   * generate the record.
   * @returns e-Cert record.
   */
  private createECertRecord(disbursement: DisbursementSchedule): ECertRecord {
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
      courseLoad: 50, // TODO change this value when we are updating the workflow course load.
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
    } as ECertRecord;
  }

  @InjectLogger()
  logger: LoggerService;
}
