import { Injectable } from "@nestjs/common";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "../../constants";
import { addDays } from "@sims/utilities";
import { EntityManager } from "typeorm";
import {
  AwardValueWithRelatedSchedule,
  DisbursementOverawardService,
  StudentRestrictionSharedService,
} from "@sims/services";
import {
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  OfferingIntensity,
  RestrictionActionType,
  mapFromRawAndEntities,
  DisbursementScheduleStatus,
  DisbursementValue,
  DisbursementOveraward,
  DisbursementValueType,
  Student,
  DisbursementOverawardOriginType,
} from "@sims/sims-db";
import { ECertDisbursementSchedule } from "./e-cert-generation.models";
import { StudentOverawardBalance } from "@sims/services/disbursement-overaward/disbursement-overaward.models";
import {
  BC_FUNDING_TYPES,
  BC_TOTAL_GRANT_AWARD_CODE,
  LOAN_TYPES,
} from "@sims/services/constants";
import { SystemUsersService } from "@sims/services/system-users";

/**
 * While performing a possible huge amount of updates,
 * breaks the execution in chunks.
 */
const DISBURSEMENT_SCHEDULES_UPDATE_CHUNK_SIZE = 1000;

@Injectable()
export class ECertGenerationService {
  constructor(
    private readonly studentRestrictionService: StudentRestrictionSharedService,
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  async prepareDisbursementsForECertGeneration(
    offeringIntensity: OfferingIntensity,
    entityManager: EntityManager,
  ): Promise<ECertDisbursementSchedule[]> {
    const disbursements = await this.getECertInformationToBeSent(
      offeringIntensity,
      entityManager,
    );
    if (!disbursements?.length) {
      return [];
    }

    // The below steps must be execute in order and they will be causing
    // changes on the disbursements objects and its children (awards) till
    // all changes are finally saved at once in the end of the processing.

    // Step 1 - Check student balance and execute the possible deductions from the awards.
    await this.applyOverawardsDeductions(disbursements, entityManager);
    // Step 2 - Execute the calculation to define the final value to be used for the e-Cert.
    this.calculateEffectiveValue(disbursements);
    // Step 3 - Calculate BC total grants after all others calculations are done.
    //!This step relies on the effective value calculation (step 2).
    await this.createBCTotalGrants(disbursements);
    // Step 4 - Mark all disbursements as 'sent'.
    const now = new Date();
    disbursements.forEach((disbursement) => {
      disbursement.disbursementScheduleStatus = DisbursementScheduleStatus.Sent;
      disbursement.dateSent = now;
    });
    // Step 5 - Save all changes for the disbursements schedules and awards.
    await entityManager
      .getRepository(DisbursementSchedule)
      .save(disbursements, {
        chunk: DISBURSEMENT_SCHEDULES_UPDATE_CHUNK_SIZE,
      });
    return disbursements;
  }

  /**
   * Get all records that must be part of the e-Cert files and that were not sent yet.
   * Criteria to be a valid disbursement to be sent.
   * - Not sent yet;
   * - Disbursement date in the past or in the near future (defined by DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS);
   * - Student had the SIN number validated by the CRA;
   * - Student has a valid signed MSFAA;
   * - No restrictions in the student account that prevents the disbursement;
   * - Application status must be 'Completed';
   * - Confirmation of enrollment(COE) must be 'Completed'.
   * - Disbursement schedule on pending status.
   */
  private async getECertInformationToBeSent(
    offeringIntensity: OfferingIntensity,
    entityManager: EntityManager,
  ): Promise<ECertDisbursementSchedule[]> {
    const possibleRestrictionActions: RestrictionActionType[] =
      offeringIntensity === OfferingIntensity.fullTime
        ? [RestrictionActionType.StopFullTimeDisbursement]
        : [RestrictionActionType.StopPartTimeDisbursement];
    const stopFullTimeBCFunding: RestrictionActionType[] = [
      RestrictionActionType.StopFullTimeBCFunding,
    ];

    // Define the minimum date to send a disbursement.
    const disbursementMinDate = addDays(
      DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS,
    );

    const queryResult = await entityManager
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
        "institutionLocation.id",
        "institutionLocation.institutionCode",
        "disbursementValue.id",
        "disbursementValue.valueType",
        "disbursementValue.valueCode",
        "disbursementValue.valueAmount",
        "disbursementValue.disbursedAmountSubtracted",
        "studentAssessment.id",
      ])
      .addSelect(
        `CASE
            WHEN EXISTS(${this.studentRestrictionService
              .getExistsBlockRestrictionQuery(
                false,
                false,
                "restrictionActionType",
              )
              .getSql()}) THEN true
            ELSE false
        END`,
        "stopFullTimeBCFunding",
      )
      .innerJoin("disbursement.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.currentAssessment", "currentAssessment") // * This is to fetch the current assessment of the application, even though we have multiple reassessments
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("application.student", "student") // ! The student alias here is also used in sub query 'getExistsBlockRestrictionQuery'.
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("application.msfaaNumber", "msfaaNumber")
      .innerJoin("disbursement.disbursementValues", "disbursementValue")
      .where("disbursement.dateSent is null")
      .andWhere("disbursement.disbursementDate <= :disbursementMinDate", {
        disbursementMinDate,
      })
      .andWhere("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.completed,
      })
      .andWhere("msfaaNumber.dateSigned is not null")
      .andWhere("sinValidation.isValidSIN = true")
      .andWhere("offering.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .andWhere(
        `NOT EXISTS(${this.studentRestrictionService
          .getExistsBlockRestrictionQuery()
          .getSql()})`,
      )
      .andWhere(
        "disbursement.disbursementScheduleStatus = :disbursementScheduleStatus",
        {
          disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
        },
      )
      .andWhere("disbursement.coeStatus = :coeStatus", {
        coeStatus: COEStatus.completed,
      })
      .setParameter("restrictionActionType", stopFullTimeBCFunding)
      // 'restrictionActions' parameter used inside sub-query.
      .setParameter("restrictionActions", possibleRestrictionActions)
      // Necessary, for instance, for the overawards processing.
      .orderBy("disbursement.disbursementDate")
      .getRawAndEntities();
    // TODO: ensure stopFullTimeBCFunding is false for Part time.
    return mapFromRawAndEntities<ECertDisbursementSchedule>(
      queryResult,
      "stopFullTimeBCFunding",
    );
  }

  private async applyOverawardsDeductions(
    disbursements: ECertDisbursementSchedule[],
    entityManager: EntityManager,
  ) {
    const studentsIds = disbursements.map((student) => student.id);
    // Get all the overawards balances for the students that are part of the disbursements.
    const overawardsBalance =
      await this.disbursementOverawardService.getOverawardBalance(
        studentsIds,
        entityManager,
      );

    // Apply the overawards for every student, if needed.
    for (const studentId of studentsIds) {
      await this.applyOverawardsDeductionsForECertGeneration(
        studentId,
        disbursements,
        overawardsBalance,
        entityManager,
      );
    }
  }

  private calculateEffectiveValue(disbursements: ECertDisbursementSchedule[]) {
    for (const disbursement of disbursements) {
      for (const disbursementValue of disbursement.disbursementValues) {
        if (this.shouldStopFunding(disbursement, disbursementValue)) {
          disbursementValue.effectiveAmount = "0";
        } else {
          const effectiveValue =
            +disbursementValue.valueAmount -
            +(disbursementValue.disbursedAmountSubtracted ?? 0) -
            +(disbursementValue.overawardAmountSubtracted ?? 0);
          disbursementValue.effectiveAmount = effectiveValue.toString();
        }
      }
    }
  }

  /**
   * Calculate the total BC grants for each disbursement since they
   * can be affected by the calculations for the values already paid for the student
   * or by overaward deductions.
   * @param disbursementSchedules disbursements to have the BC grants calculated.
   */
  private async createBCTotalGrants(
    disbursementSchedules: ECertDisbursementSchedule[],
  ): Promise<void> {
    const auditUser = await this.systemUsersService.systemUser();
    for (const disbursementSchedule of disbursementSchedules) {
      // For each schedule calculate the total BC grants.
      let bcTotalGrant = disbursementSchedule.disbursementValues.find(
        (disbursementValue) =>
          disbursementValue.valueType === DisbursementValueType.BCTotalGrant,
      );
      if (!bcTotalGrant) {
        // If the 'BC Total Grant' is not present, add it.
        bcTotalGrant = new DisbursementValue();
        bcTotalGrant.creator = auditUser;
        bcTotalGrant.valueCode = BC_TOTAL_GRANT_AWARD_CODE;
        bcTotalGrant.valueType = DisbursementValueType.BCTotalGrant;
        disbursementSchedule.disbursementValues.push(bcTotalGrant);
      }
      bcTotalGrant.valueAmount = disbursementSchedule.disbursementValues
        // Filter all BC grants.
        .filter(
          (disbursementValue) =>
            disbursementValue.valueType === DisbursementValueType.BCGrant,
        )
        // Sum all BC grants.
        .reduce((previousValue, currentValue) => {
          return previousValue + +currentValue.effectiveAmount;
        }, 0)
        .toString();
      bcTotalGrant.effectiveAmount = bcTotalGrant.valueAmount;
    }
  }

  private async applyOverawardsDeductionsForECertGeneration(
    studentId: number,
    allDisbursementSchedules: ECertDisbursementSchedule[],
    studentsOverawardBalance: StudentOverawardBalance,
    entityManager: EntityManager,
  ): Promise<void> {
    if (!studentsOverawardBalance[studentId]) {
      // No overaward balance is present for the student.
      return;
    }
    // Filter the disbursements for the student.
    const studentSchedules = allDisbursementSchedules.filter(
      (disbursement) =>
        disbursement.studentAssessment.application.student.id === studentId,
    );
    // List of loan awards with the associated disbursement schedule.
    // Filter possible awards that will not be disbursed due to a restriction.
    // If the award will not be disbursed the overaward should not be deducted
    // because the student will not be receiving any money for the award, in this
    // case the BC Loan (BCSL).
    const loanAwards = this.getAwardsByTypeWithRelatedSchedule(
      studentSchedules,
      LOAN_TYPES,
    ).filter(
      (loanAward) =>
        !this.shouldStopFunding(
          loanAward.relatedSchedule,
          loanAward.awardValue,
        ),
    );

    // Unique codes to allow the overawards deduction to happen in a sequential way.
    const distinctValueCodes = [
      ...new Set(loanAwards.map((loan) => loan.awardValue.valueCode)),
    ];
    for (const valueCode of distinctValueCodes) {
      // Checks if the loan is present in multiple disbursements.
      // Find all the values in all the schedules.
      const loans = loanAwards.filter(
        (loanAward) => loanAward.awardValue.valueCode === valueCode,
      );
      // Total overaward balance for the student for this particular award.
      const overawardBalance =
        studentsOverawardBalance[studentId][valueCode] ?? 0;
      if (!overawardBalance) {
        // There are overawards to be subtracted for this award.
        continue;
      }
      // Subtract the debit from the current awards in the current assessment.
      this.subtractOverawardBalance(
        loans.map((loan) => loan.awardValue),
        overawardBalance,
      );
      // Prepare to update the overaward balance with any deduction
      // that was applied to any award on the method subtractOverawardBalance.
      const disbursementOverawardRepo = entityManager.getRepository(
        DisbursementOveraward,
      );
      const auditUser = await this.systemUsersService.systemUser();
      for (const loan of loans) {
        if (loan.awardValue.overawardAmountSubtracted) {
          // An overaward was subtracted from an award and the same must be
          // deducted from the student balance.
          await disbursementOverawardRepo.insert({
            student: { id: studentId } as Student,
            studentAssessment: loan.relatedSchedule.studentAssessment,
            disbursementSchedule: loan.relatedSchedule as DisbursementSchedule,
            disbursementValueCode: valueCode,
            overawardValue: (
              +loan.awardValue.overawardAmountSubtracted * -1
            ).toString(),
            originType: DisbursementOverawardOriginType.AwardValueAdjusted,
            creator: auditUser,
          } as DisbursementOveraward);
        }
      }
    }
  }

  private shouldStopFunding(
    schedule: ECertDisbursementSchedule,
    disbursementValue: DisbursementValue,
  ): boolean {
    return (
      schedule.stopFullTimeBCFunding &&
      schedule.studentAssessment.application.currentAssessment.offering
        .offeringIntensity === OfferingIntensity.fullTime &&
      BC_FUNDING_TYPES.includes(disbursementValue.valueType)
    );
  }

  private getAwardsByTypeWithRelatedSchedule(
    disbursementSchedules: ECertDisbursementSchedule[],
    valueTypes: DisbursementValueType[],
  ): AwardValueWithRelatedSchedule[] {
    const result: AwardValueWithRelatedSchedule[] = [];
    for (const relatedSchedule of disbursementSchedules) {
      for (const awardValue of relatedSchedule.disbursementValues) {
        if (valueTypes.includes(awardValue.valueType)) {
          result.push({ relatedSchedule, awardValue });
        }
      }
    }
    return result;
  }

  /**
   * Try to settle a student debit from one of the two situations below:
   * 1. Money already received by the student for the same application that is being reassessed.
   * 2. Money owed by the student due to some previous overaward in some previous application.
   * In both cases, the reassessment will result in some amount of money that the student must
   * receive, witch will receive deductions based on the two scenarios above.
   * @param awards specific award being adjusted (e.g CSLF, BGPD, BCSL). This will contain one or
   * two entries, always from the same award, from where the student debit will be deducted.
   * The debit will try to be settle as much as possible with the first entry. If it is not enough
   * if will check for the second entry, when present, if it is not enough, the remaining value will
   * be returned to let the caller of the method aware that part of the debit was not payed.
   * @param totalStudentDebit total student debit to be deducted.
   * @param subtractOrigin indicates if the debit comes from values already payed for the application
   * being processed (PreviousDisbursement) or if it is from some existing overaward prior to this
   * application (Overaward)
   * @returns the remaining student debit in case the awards were not enough to pay it.
   */
  private subtractOverawardBalance(
    awards: DisbursementValue[],
    overawardBalance: number,
  ) {
    let currentBalance = overawardBalance;
    for (const award of awards) {
      // Award amount that is available to be taken for the overaward balance adjustment.
      const availableAwardValueAmount =
        +award.valueAmount - +award.disbursedAmountSubtracted;
      if (availableAwardValueAmount >= currentBalance) {
        // Current disbursement value is enough to pay the debit.
        // For instance:
        // - Award: $1000
        // - Student Debit: $750
        // Then
        // - New award: $250 ($1000 - $750)
        // - Student debit: $0
        award.overawardAmountSubtracted = currentBalance.toString();
        currentBalance = 0;
        // Cancel because there is nothing else to be subtracted.
        return;
      } else {
        // Current disbursement is not enough to pay the debit.
        // Updates total student debit.
        // For instance:
        // - Award: $500
        // - Student Debit: $750
        // Then
        // - New award: $0
        // - Student debit: $250
        // If there is one more disbursement with the same award, the $250
        // student debit will be taken from there, if possible executing the
        // second iteration of this for loop.
        currentBalance -= availableAwardValueAmount;
        award.overawardAmountSubtracted = availableAwardValueAmount.toString();
      }
    }
  }
}
