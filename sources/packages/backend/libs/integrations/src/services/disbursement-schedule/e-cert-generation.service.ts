import { Injectable } from "@nestjs/common";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "../../constants";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { EntityManager, Repository } from "typeorm";
import {
  ApplicationStatus,
  DisbursementSchedule,
  OfferingIntensity,
  DisbursementScheduleStatus,
  Application,
  StudentRestriction,
} from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";
import {
  EligibleECertDisbursement,
  StudentActiveRestriction,
  mapStudentActiveRestrictions,
} from "./disbursement-schedule.models";
import { ConfigService } from "@sims/utilities/config";

interface GroupedStudentActiveRestrictions {
  [studentId: number]: StudentActiveRestriction[];
}

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
    private readonly configService: ConfigService,
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
    // Applications with offerings end dates beyond the archive limit will no longer be disbursed.
    const offeringEndDateMinDate = addDays(
      -this.configService.applicationArchiveDays,
    );
    const eligibleApplications = await this.applicationRepo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "currentAssessment.id",
        "disbursementSchedule.id",
        "disbursementSchedule.disbursementDate",
        "disbursementSchedule.tuitionRemittanceRequestedAmount",
        "disbursementSchedule.coeStatus",
        "disbursementValue.id",
        "disbursementValue.valueType",
        "disbursementValue.valueCode",
        "disbursementValue.valueAmount",
        "disbursementValue.disbursedAmountSubtracted",
        "msfaaNumber.id",
        "msfaaNumber.dateSigned",
        "msfaaNumber.cancelledDate",
        "offering.id",
        "offering.offeringIntensity",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "student.id",
        "sinValidation.id",
        "sinValidation.isValidSIN",
        // The student active restrictions are initially loaded along side all the student data but they can
        // be potentially refreshed along the e-Cert calculations using the method getStudentActiveRestrictions.
        // In case the amount of data returned need to be changed please ensure that the method also get updated.
        "studentRestriction.id",
        "restriction.id",
        "restriction.restrictionCode",
        "restriction.actionType",
        "programYear.id",
        "programYear.maxLifetimeBCLoanAmount",
      ])
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin(
        "currentAssessment.disbursementSchedules",
        "disbursementSchedule",
      )
      .innerJoin("disbursementSchedule.disbursementValues", "disbursementValue")
      .innerJoin("disbursementSchedule.msfaaNumber", "msfaaNumber")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.student", "student")
      .innerJoin("student.sinValidation", "sinValidation")
      .leftJoin(
        "student.studentRestrictions",
        "studentRestriction",
        "studentRestriction.isActive = true",
      )
      .leftJoin("studentRestriction.restriction", "restriction")
      .where("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.Completed,
      })
      .andWhere(
        "disbursementSchedule.disbursementScheduleStatus = :disbursementScheduleStatus",
        { disbursementScheduleStatus: DisbursementScheduleStatus.Pending },
      )
      .andWhere("disbursementSchedule.disbursementDate <= :disbursementDate", {
        disbursementDate: disbursementMinDate,
      })
      .andWhere("offering.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .andWhere("offering.studyEndDate >= :offeringEndDateMinDate", {
        offeringEndDateMinDate,
      })
      .orderBy("disbursementSchedule.disbursementDate", "ASC")
      .addOrderBy("disbursementSchedule.createdAt", "ASC")
      .getMany();

    // Creates a unique array of active restrictions per student to be shared
    // across all disbursements.
    const groupedStudentRestrictions =
      this.getGroupedStudentRestrictions(eligibleApplications);
    // Convert the application records to be returned as disbursements to allow
    // easier processing along the calculation steps.
    const eligibleDisbursements =
      eligibleApplications.flatMap<EligibleECertDisbursement>((application) => {
        return application.currentAssessment.disbursementSchedules.map(
          (disbursement) => {
            return new EligibleECertDisbursement(
              application.student.id,
              !!application.student.sinValidation.isValidSIN,
              application.currentAssessment.id,
              application.id,
              disbursement,
              application.currentAssessment.offering,
              application.programYear.maxLifetimeBCLoanAmount,
              groupedStudentRestrictions[application.student.id],
            );
          },
        );
      });
    return eligibleDisbursements;
  }

  /**
   * Group student restriction for each student.
   * @param eligibleApplications applications with student restrictions.
   * @returns grouped student restrictions.
   */
  private getGroupedStudentRestrictions(
    eligibleApplications: Application[],
  ): GroupedStudentActiveRestrictions {
    return eligibleApplications.reduce(
      (group: GroupedStudentActiveRestrictions, application) => {
        const studentId = application.student.id;
        if (!group[studentId]) {
          // Populates a new student only once.
          group[studentId] = mapStudentActiveRestrictions(
            application.student.studentRestrictions,
          );
        }
        return group;
      },
      {},
    );
  }

  /**
   * Get active student restrictions to support the e-Cert calculations.
   * These data is also loaded in bulk by the method {@link getEligibleDisbursements}.
   * Case new data is retrieve here please ensure that the method will also be updated.
   * @param studentId student to have the active restrictions updated.
   * @param entityManager: EntityManager,
   * @returns student active restrictions.
   */
  async getStudentActiveRestrictions(
    studentId: number,
    entityManager: EntityManager,
  ): Promise<StudentActiveRestriction[]> {
    const studentRestrictions = await entityManager
      .getRepository(StudentRestriction)
      .find({
        select: {
          id: true,
          restriction: {
            id: true,
            restrictionCode: true,
            actionType: true,
          },
        },
        relations: {
          restriction: true,
        },
        where: {
          student: { id: studentId },
          isActive: true,
        },
      });
    return mapStudentActiveRestrictions(studentRestrictions);
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
        disbursementScheduleStatus: DisbursementScheduleStatus.ReadyToSend,
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
