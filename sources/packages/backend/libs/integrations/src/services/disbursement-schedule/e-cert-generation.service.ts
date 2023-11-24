import { Injectable } from "@nestjs/common";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "../../constants";
import { addDays } from "@sims/utilities";
import { EntityManager, Repository } from "typeorm";
import {
  ApplicationStatus,
  DisbursementSchedule,
  OfferingIntensity,
  DisbursementScheduleStatus,
} from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Manages all the preparation of the disbursements data needed to
 * generate the e-Cert. Check and execute possible overawards deductions
 * and calculate the awards effective values to be used to generate the e-Cert.
 * All methods are prepared to be executed on a single transaction.
 */
@Injectable()
export class ECertGenerationService {
  constructor(
    @InjectRepository(DisbursementSchedule)
    private readonly disbursementScheduleRepo: Repository<DisbursementSchedule>,
  ) {}

  async getEligibleRecords(
    offeringIntensity: OfferingIntensity,
  ): Promise<DisbursementSchedule[]> {
    // Define the minimum date to send a disbursement.
    const disbursementMinDate = addDays(
      DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS,
    );

    const result = this.disbursementScheduleRepo
      .createQueryBuilder("disbursement")
      .select([
        "disbursement.id",
        "disbursement.disbursementDate",
        "disbursement.tuitionRemittanceRequestedAmount",
        "disbursement.coeStatus",
        "application.id",
        "currentAssessment.id",
        "offering.id",
        "offering.offeringIntensity",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "educationProgram.id",
        "sinValidation.id",
        "sinValidation.isValidSIN",
        "student.id",
        "disbursementValue.id",
        "disbursementValue.valueType",
        "disbursementValue.valueCode",
        "disbursementValue.valueAmount",
        "disbursementValue.disbursedAmountSubtracted",
        "studentAssessment.id",
        "programYear.maxLifetimeBCLoanAmount",
        "studentRestriction.id",
        "restriction.id",
        "restriction.actionType",
        "msfaaNumber.id",
        "msfaaNumber.dateSigned",
        "msfaaNumber.cancelledDate",
      ])
      .innerJoin("disbursement.studentAssessment", "studentAssessment")
      .leftJoin("disbursement.msfaaNumber", "msfaaNumber")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.currentAssessment", "currentAssessment") // This is to fetch the current assessment of the application, even though we have multiple reassessments
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .leftJoin(
        "student.studentRestrictions",
        "studentRestriction",
        "studentRestriction.isActive = true",
      )
      .leftJoin("studentRestriction.restriction", "restriction")
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

  /**
   * Get all records that must be part of the e-Cert files and that were not sent yet.
   * @param offeringIntensity disbursement offering intensity.
   * @param entityManager used to execute the commands in the same transaction.
   * @returns records that must be part of the e-Cert.
   */
  async getReadyToSendDisbursements(
    offeringIntensity: OfferingIntensity,
    entityManager: EntityManager,
  ): Promise<DisbursementSchedule[]> {
    return entityManager
      .getRepository(DisbursementSchedule)
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
        "studentAssessment.id",
      ])
      .innerJoin("disbursement.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("disbursement.disbursementValues", "disbursementValue")
      .where("offering.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .andWhere(
        "disbursement.disbursementScheduleStatus = :disbursementScheduleStatus",
        {
          disbursementScheduleStatus: DisbursementScheduleStatus.ReadToSend,
        },
      )
      .orderBy("disbursement.disbursementDate")
      .addOrderBy("disbursement.createdAt")
      .getMany();
  }
}
