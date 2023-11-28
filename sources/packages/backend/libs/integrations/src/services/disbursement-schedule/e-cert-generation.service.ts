import { Injectable } from "@nestjs/common";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "../../constants";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { EntityManager, IsNull, LessThanOrEqual, Repository } from "typeorm";
import {
  ApplicationStatus,
  DisbursementSchedule,
  OfferingIntensity,
  DisbursementScheduleStatus,
  Application,
} from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";
import { EligibleECertDisbursement } from "./disbursement-schedule.models";

/**
 * Manages all the preparation of the disbursements data needed to
 * generate the e-Cert. Check and execute possible overawards deductions
 * and calculate the awards effective values to be used to generate the e-Cert.
 * All methods are prepared to be executed on a single transaction.
 */
@Injectable()
export class ECertGenerationService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  async getEligibleDisbursements(
    offeringIntensity: OfferingIntensity,
  ): Promise<EligibleECertDisbursement[]> {
    // Define the minimum date to send a disbursement.
    const disbursementMinDate = getISODateOnlyString(
      addDays(DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS),
    );
    const eligibleApplications = await this.applicationRepo.find({
      select: {
        id: true,
        currentAssessment: {
          id: true,
          disbursementSchedules: {
            id: true,
            disbursementDate: true,
            tuitionRemittanceRequestedAmount: true,
            coeStatus: true,
            disbursementValues: {
              id: true,
              valueType: true,
              valueCode: true,
              valueAmount: true,
              disbursedAmountSubtracted: true,
            },
            msfaaNumber: {
              id: true,
              dateSigned: true,
              cancelledDate: true,
            },
          },
          offering: {
            id: true,
            offeringIntensity: true,
            actualTuitionCosts: true,
            programRelatedCosts: true,
          },
        },
        student: {
          id: true,
          sinValidation: {
            id: true,
            isValidSIN: true,
          },
          studentRestrictions: {
            id: true,
            restriction: {
              id: true,
              actionType: true,
            },
          },
        },
        programYear: {
          id: true,
          maxLifetimeBCLoanAmount: true,
        },
      },
      relations: {
        currentAssessment: {
          disbursementSchedules: {
            disbursementValues: true,
            msfaaNumber: true,
          },
          offering: true,
        },
        student: {
          sinValidation: true,
          studentRestrictions: { restriction: true },
        },
        programYear: true,
      },
      where: {
        applicationStatus: ApplicationStatus.Completed,
        currentAssessment: {
          disbursementSchedules: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            disbursementDate: LessThanOrEqual(disbursementMinDate),
          },
          offering: {
            offeringIntensity,
          },
        },
        student: {
          studentRestrictions: [{ isActive: IsNull() }, { isActive: true }],
        },
      },
      order: {
        currentAssessment: {
          disbursementSchedules: {
            disbursementDate: "ASC",
            createdAt: "ASC",
          },
        },
      },
    });

    // Convert the application records to be returned as disbursements to allow
    // easier processing along the calculation steps.
    const eligibleDisbursements =
      eligibleApplications.flatMap<EligibleECertDisbursement>((application) => {
        return application.currentAssessment.disbursementSchedules.map(
          (disbursement) => {
            return {
              studentId: application.student.id,
              assessmentId: application.currentAssessment.id,
              applicationId: application.id,
              // Convert the nested restriction in StudentRestriction to a simple object.
              activeRestrictions: application.student.studentRestrictions.map(
                (studentRestriction) => {
                  return {
                    id: studentRestriction.restriction.id,
                    actions: studentRestriction.restriction.actionType,
                  };
                },
              ),
              hasValidSIN: application.student.sinValidation.isValidSIN,
              disbursement,
              offering: application.currentAssessment.offering,
              maxLifetimeBCLoanAmount:
                application.programYear.maxLifetimeBCLoanAmount,
            };
          },
        );
      });
    return eligibleDisbursements;
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
