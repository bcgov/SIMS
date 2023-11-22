import { Injectable } from "@nestjs/common";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "../../../constants";
import { addDays } from "@sims/utilities";
import { EntityManager, Repository } from "typeorm";
import {
  ApplicationStatus,
  DisbursementSchedule,
  OfferingIntensity,
  DisbursementScheduleStatus,
} from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class ECertGenerationService {
  constructor(
    @InjectRepository(DisbursementSchedule)
    private readonly disbursementSchedule: Repository<DisbursementSchedule>,
  ) {}

  /**
   * Get all records that must be part of the e-Cert files and that were not sent yet.
   * Criteria to be a valid disbursement to be sent.
   * - Not sent yet;
   * - Disbursement date in the past or in the near future (defined by DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS);
   * - Student had the SIN validated by the CRA;
   * - Student has a valid signed MSFAA and not cancelled;
   * - No restrictions in the student account that prevents the disbursement;
   * - Application status must be 'Completed';
   * - Confirmation of enrollment(COE) must be 'Completed'.
   * - Disbursement schedule on pending status.
   * @param offeringIntensity disbursement offering intensity.
   * @returns records that must be part of the e-Cert.
   */
  async getEligibleRecords(
    offeringIntensity: OfferingIntensity,
  ): Promise<DisbursementSchedule[]> {
    // Define the minimum date to send a disbursement.
    const disbursementMinDate = addDays(
      DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS,
    );

    const result = this.disbursementSchedule
      .createQueryBuilder("disbursement")
      .select([
        "disbursement.id",
        "disbursement.documentNumber",
        "disbursement.negotiatedExpiryDate",
        "disbursement.disbursementDate",
        "disbursement.tuitionRemittanceRequestedAmount",
        "disbursement.coeUpdatedAt",
        "application.id",
        "application.applicationNumber",
        "application.data",
        "application.relationshipStatus",
        "application.studentNumber",
        "currentAssessment.id",
        "currentAssessment.assessmentData",
        "offering.id",
        "offering.courseLoad",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.yearOfStudy",
        "offering.offeringIntensity",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "educationProgram.id",
        "educationProgram.fieldOfStudyCode",
        "educationProgram.completionYears",
        "user.firstName",
        "user.lastName",
        "user.email",
        "sinValidation.id",
        "sinValidation.sin",
        "student.id",
        "student.birthDate",
        "student.gender",
        "student.contactInfo",
        "student.studentPDVerified",
        "institutionLocation.id",
        "institutionLocation.institutionCode",
        "disbursementValue.id",
        "disbursementValue.valueType",
        "disbursementValue.valueCode",
        "disbursementValue.valueAmount",
        "disbursementValue.disbursedAmountSubtracted",
        "studentAssessment.id",
        "programYear.maxLifetimeBCLoanAmount",
      ])
      .innerJoin("disbursement.studentAssessment", "studentAssessment")
      .innerJoin("disbursement.msfaaNumber", "msfaaNumber")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.programYear", "programYear")
      // TODO: review below assumption.
      // * This is to fetch the current assessment of the application, even though we have multiple reassessments
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("disbursement.disbursementValues", "disbursementValue")
      .where("disbursement.disbursementDate <= :disbursementMinDate", {
        disbursementMinDate,
      })
      .andWhere("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.Completed,
      })
      .andWhere("offering.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .andWhere(
        "disbursement.disbursementScheduleStatus = :disbursementScheduleStatus",
        {
          disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
        },
      )
      .orderBy("disbursement.disbursementDate")
      .getMany();
    return result;
  }
}
