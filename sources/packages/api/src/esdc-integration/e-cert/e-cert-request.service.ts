import { Injectable } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { DisbursementSchedule } from "../../database/entities";
import { LoggerService } from "../../logger/logger.service";
import { getUTCNow } from "../../utilities";
import { EntityManager } from "typeorm";
import {
  DisbursementScheduleService,
  SequenceControlService,
} from "../../services";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration.service";
import {
  ECertRecord,
  ECertUploadResult,
  GrantAward,
} from "./models/e-cert-integration.model";

const ECERT_SENT_FILE_SEQUENCE_GROUP = "ECERT_SENT_FILE";

@Injectable()
export class ECertRequestService {
  constructor(
    private readonly ecertIntegrationService: ECertFullTimeIntegrationService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly sequenceService: SequenceControlService,
  ) {}

  // TODO: Add return type.
  async generateECert(): Promise<any> {
    this.logger.log(`Retrieving disbursements to generate the e-Cert file...`);
    const disbursements =
      await this.disbursementScheduleService.getECertInformation();
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

    // Total hash of the Student's SIN, its used in the footer content.
    const totalSINHash = disbursementRecords
      .map((disbursement) => +disbursement.sin)
      .reduce((previousSin, currentSin) => previousSin + currentSin);

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
            totalSINHash,
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

  private createECertRecord(disbursement: DisbursementSchedule): ECertRecord {
    const now = new Date();
    const addressInfo =
      disbursement.application.student.contactInfo.addresses[0];
    // Sum all values for grants and loans
    // const studentTotalAmount = disbursement.disbursementValues
    //   .map(disbursement => disbursement.valueAmount)
    //   .reduce((previousAmount, currentAmount) => (previousAmount + currentAmount));

    const fieldOfStudy =
      +disbursement.application.offering.educationProgram.cipCode.substr(0, 2);

    const grantAwards = disbursement.disbursementValues.map(
      (disbursementValue) =>
        ({
          code: disbursementValue.valueCode,
          amount: disbursementValue.valueAmount,
        } as GrantAward),
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
      federalInstitutionCode:
        disbursement.application.offering.institutionLocation.institutionCode,
      weeksOfStudy: 1,
      fieldOfStudy,
      yearOfStudy: 9,
      totalYearsOfStudy: 5,
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
      maritalStatus: "married",
      studentNumber: disbursement.application.data.studentNumber,
      grantAwards,
    } as ECertRecord;
  }

  @InjectLogger()
  logger: LoggerService;
}
