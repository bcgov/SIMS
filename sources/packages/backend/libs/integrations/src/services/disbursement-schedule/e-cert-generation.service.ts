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

  /**
   * Get eligible disbursements that must have calculations executed prior
   * to be part of an e-Cert. The data returned will contain the disbursement
   * entity model to be updated and all supporting information needed to
   * execute all calculations steps.
   * @param offeringIntensity offering intensity to retrieve the disbursements.
   * @returns eligible disbursements to be potentially added to an e-Cert.
   */
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
    return entityManager.getRepository(DisbursementSchedule).find({
      select: {
        id: true,
        documentNumber: true,
        negotiatedExpiryDate: true,
        disbursementDate: true,
        coeUpdatedAt: true,
        tuitionRemittanceEffectiveAmount: true,
        studentAssessment: {
          id: true,
          assessmentData: true as unknown,
          application: {
            id: true,
            applicationNumber: true,
            data: true as unknown,
            relationshipStatus: true,
            studentNumber: true,
            student: {
              id: true,
              birthDate: true,
              gender: true,
              contactInfo: true as unknown,
              studentPDVerified: true,
              user: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
              sinValidation: {
                id: true,
                sin: true,
              },
            },
          },
          offering: {
            id: true,
            courseLoad: true,
            studyStartDate: true,
            studyEndDate: true,
            yearOfStudy: true,
            educationProgram: {
              id: true,
              fieldOfStudyCode: true,
              completionYears: true,
            },
            institutionLocation: {
              id: true,
              institutionCode: true,
            },
          },
        },
        disbursementValues: {
          id: true,
          valueType: true,
          valueCode: true,
          valueAmount: true,
          effectiveAmount: true,
        },
      },
      relations: {
        studentAssessment: {
          application: {
            student: { user: true, sinValidation: true },
          },
          offering: {
            educationProgram: true,
            institutionLocation: true,
          },
        },
        disbursementValues: true,
      },
      where: {
        disbursementScheduleStatus: DisbursementScheduleStatus.ReadToSend,
        studentAssessment: {
          offering: {
            offeringIntensity,
          },
        },
      },
      order: {
        disbursementDate: "ASC",
        createdAt: "ASC",
      },
    });
  }
}
