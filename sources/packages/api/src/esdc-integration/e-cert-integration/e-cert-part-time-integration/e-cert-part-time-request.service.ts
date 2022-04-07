import { Injectable } from "@nestjs/common";
import { InjectLogger } from "../../../common";
import { DisbursementSchedule } from "../../../database/entities";
import { LoggerService } from "../../../logger/logger.service";
import { getFieldOfStudyFromCIPCode } from "../../../utilities";
import {
  Award,
  ECertPTRecord,
} from "./models/e-cert-part-time-integration.model";

@Injectable()
export class ECertPartTimeRequestService {
  /**
   * Create the e-Cert record with the information needed to generate the
   * entire record to be sent to ESDC.
   * @param disbursement disbursement that contains all information to
   * generate the record.
   * @returns e-Cert record.
   */
  private createPTECertRecord(
    disbursement: DisbursementSchedule,
  ): ECertPTRecord {
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
    } as ECertPTRecord;
  }

  @InjectLogger()
  logger: LoggerService;
}
