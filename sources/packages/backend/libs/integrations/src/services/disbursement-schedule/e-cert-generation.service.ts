import { Injectable } from "@nestjs/common";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "../../constants";
import { addDays, round } from "@sims/utilities";
import { EntityManager } from "typeorm";
import {
  AwardValueWithRelatedSchedule,
  ConfirmationOfEnrollmentService,
  DisbursementOverawardService,
  DisbursementScheduleSharedService,
  MaxTuitionRemittanceTypes,
  RestrictionCode,
  SFASApplicationService,
  StudentRestrictionSharedService,
  SystemUsersService,
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
  Application,
  StudentRestriction,
  Restriction,
} from "@sims/sims-db";
import { ECertDisbursementSchedule } from "./e-cert-generation.models";
import { AwardOverawardBalance } from "@sims/services/disbursement-overaward/disbursement-overaward.models";
import {
  BC_FUNDING_TYPES,
  BC_TOTAL_GRANT_AWARD_CODE,
  LOAN_TYPES,
} from "@sims/services/constants";
// todo: ann double check all import in the modules
// todo: ann run queue and workers locally to test everything
/**
 * While performing a possible huge amount of updates,
 * breaks the execution in chunks.
 */
const DISBURSEMENT_SCHEDULES_UPDATE_CHUNK_SIZE = 1000;

/**
 * Manages all the preparation of the disbursements data needed to
 * generate the e-Cert. Check and execute possible overawards deductions
 * and calculate the awards effective values to be used to generate the e-Cert.
 * All methods are prepared to be executed on a single transaction.
 */
@Injectable()
export class ECertGenerationService {
  constructor(
    private readonly studentRestrictionSharedService: StudentRestrictionSharedService,
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly systemUsersService: SystemUsersService,
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
    private readonly sfasApplicationService: SFASApplicationService,
    private readonly disbursementScheduleSharedService: DisbursementScheduleSharedService,
  ) {}

  /**
   * Get the information needed for the e-Cert generation, execute all
   * calculations needed and return the records ready to generate the e-Cert file.
   * @param offeringIntensity disbursement offering intensity.
   * @param entityManager used to execute the commands in the same transaction.
   * @returns records ready to generate the e-Cert file.
   */
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
    await this.calculateEffectiveValue(disbursements, entityManager);
    // Step 3 - Calculate tuition remittance effective amount.
    this.calculateTuitionRemittanceEffectiveAmount(disbursements);
    // Step 4 - Calculate BC total grants after all others calculations are done.
    //!This step relies on the effective value calculation (step 2).
    await this.createBCTotalGrants(disbursements);
    // Step 5 - Mark all disbursements as 'sent'.
    const now = new Date();
    disbursements.forEach((disbursement) => {
      disbursement.disbursementScheduleStatus = DisbursementScheduleStatus.Sent;
      disbursement.dateSent = now;
    });
    // Step 6 - Save all changes for the disbursements schedules and awards.
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
   * - Student had the SIN validated by the CRA;
   * - Student has a valid signed MSFAA and not cancelled;
   * - No restrictions in the student account that prevents the disbursement;
   * - Application status must be 'Completed';
   * - Confirmation of enrollment(COE) must be 'Completed'.
   * - Disbursement schedule on pending status.
   * @param offeringIntensity disbursement offering intensity.
   * @param entityManager used to execute the commands in the same transaction.
   * @returns records that must be part of the e-Cert.
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

    // TODO: review this query to have it simplified and converted to Typeorm object syntax instead of string based.
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
      .addSelect(
        `CASE
            WHEN EXISTS(${this.studentRestrictionSharedService
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
      .addSelect(
        (subQuery) =>
          subQuery
            .select("restriction.id")
            .from(StudentRestriction, "studentRestrictions")
            .innerJoin("studentRestrictions.restriction", "restriction")
            .innerJoin("studentRestrictions.student", "restrictionStudent")
            .where("studentRestrictions.isActive = true")
            .andWhere("restrictionStudent.id = student.id")
            .andWhere("restriction.actionType && :restrictionActionType")
            .orderBy("studentRestrictions.id", "DESC")
            .limit(1),

        "restrictionId",
      )
      .innerJoin("disbursement.studentAssessment", "studentAssessment")
      .innerJoin("disbursement.msfaaNumber", "msfaaNumber")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.currentAssessment", "currentAssessment") // * This is to fetch the current assessment of the application, even though we have multiple reassessments
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("application.student", "student") // ! The student alias here is also used in sub query 'getExistsBlockRestrictionQuery'.
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("disbursement.disbursementValues", "disbursementValue")
      .where("disbursement.dateSent is null")
      .andWhere("disbursement.disbursementDate <= :disbursementMinDate", {
        disbursementMinDate,
      })
      .andWhere("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.Completed,
      })
      .andWhere("msfaaNumber.dateSigned IS NOT NULL")
      .andWhere("msfaaNumber.cancelledDate IS NULL")
      .andWhere("sinValidation.isValidSIN = true")
      .andWhere("offering.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .andWhere(
        `NOT EXISTS(${this.studentRestrictionSharedService
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
    return mapFromRawAndEntities<ECertDisbursementSchedule>(
      queryResult,
      "stopFullTimeBCFunding",
      "restrictionId",
    );
  }

  /**
   * Get the overawards balance consolidated per student and per loan award to
   * apply, if needed, the overawards deductions.
   * @param disbursements all disbursements that are part of one e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   */
  private async applyOverawardsDeductions(
    disbursements: ECertDisbursementSchedule[],
    entityManager: EntityManager,
  ): Promise<void> {
    const studentsIds = disbursements.map(
      (disbursement) => disbursement.studentAssessment.application.student.id,
    );
    // Get all the overawards balances for the students that are part of the disbursements.
    const overawardsBalance =
      await this.disbursementOverawardService.getOverawardBalance(
        studentsIds,
        entityManager,
      );
    // Apply the overawards for every student that has some balance.
    for (const studentId in overawardsBalance) {
      // Filter the disbursements for the student.
      const studentSchedules = disbursements.filter(
        (disbursement) =>
          disbursement.studentAssessment.application.student.id === +studentId,
      );
      await this.applyOverawardsDeductionsForECertGeneration(
        +studentId,
        studentSchedules,
        overawardsBalance[studentId],
        entityManager,
      );
    }
  }

  /**
   * Calculate the effective value for every award. The result of this calculation
   * will be the value used to generate the e-Cert.
   * @param disbursements all disbursements that are part of one e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   */
  private async calculateEffectiveValue(
    disbursements: ECertDisbursementSchedule[],
    entityManager: EntityManager,
  ): Promise<void> {
    for (const disbursement of disbursements) {
      for (const disbursementValue of disbursement.disbursementValues) {
        if (this.shouldStopFullTimeBCFunding(disbursement, disbursementValue)) {
          disbursementValue.restrictionAmountSubtracted =
            disbursementValue.valueAmount -
            (disbursementValue.disbursedAmountSubtracted ?? 0) -
            (disbursementValue.overawardAmountSubtracted ?? 0);
          disbursementValue.effectiveAmount = 0;
          disbursementValue.restrictionSubtracted = {
            id: disbursement.restrictionId,
          } as Restriction;
        } else {
          const effectiveValue =
            disbursementValue.valueAmount -
            (disbursementValue.disbursedAmountSubtracted ?? 0) -
            (disbursementValue.overawardAmountSubtracted ?? 0);
          disbursementValue.effectiveAmount = round(effectiveValue);

          const application = disbursement.studentAssessment.application;
          await this.checkLifeTimeMaximumAndGetStudentRestriction(
            disbursementValue,
            application,
            entityManager,
          );
        }
      }
    }
  }

  /**
   * Check if the student hits the life time maximum for the BCSL Award.
   * If it hits the life time maximum, then the award is reduced so the
   * student hits the maximum value exactly.
   * @param disbursementValue disbursement value.
   * @param application application related to the disbursement.
   * @param entityManager used to execute the commands in the same transaction.
   */
  private async checkLifeTimeMaximumAndGetStudentRestriction(
    disbursementValue: DisbursementValue,
    application: Application,
    entityManager: EntityManager,
  ): Promise<void> {
    if (disbursementValue.valueType === DisbursementValueType.BCLoan) {
      const student = application.student;
      const maxLifetimeBCLoanAmount =
        application.programYear.maxLifetimeBCLoanAmount;
      const auditUser = await this.systemUsersService.systemUser();

      const totalLifeTimeAmount =
        (await this.sfasApplicationService.totalLegacyBCSLAmount(
          student.sinValidation.sin,
          student.birthDate,
          student.user.lastName,
        )) +
        (await this.disbursementScheduleSharedService.totalDisbursedBCSLAmount(
          student.id,
        )) +
        disbursementValue.effectiveAmount;

      if (totalLifeTimeAmount >= maxLifetimeBCLoanAmount) {
        // Amount subtracted when lifetime maximum is reached.
        const amountSubtracted = totalLifeTimeAmount - maxLifetimeBCLoanAmount;
        // Ideally disbursementValue.effectiveAmount should be greater or equal to amountSubtracted.
        // The flow will not reach here if the ministry ignore the restriction for the previous
        // disbursement/application and money went out to the student, even though they reach the maximum.
        const newEffectiveAmount =
          disbursementValue.effectiveAmount - amountSubtracted;
        // Create BCLM restriction when lifetime maximum is hit.
        const bclmRestriction =
          await this.studentRestrictionSharedService.createRestrictionToSave(
            student.id,
            RestrictionCode.BCLM,
            auditUser.id,
            application.id,
          );

        if (bclmRestriction) {
          await entityManager
            .getRepository(StudentRestriction)
            .save(bclmRestriction);
        }

        disbursementValue.effectiveAmount = round(newEffectiveAmount);
        disbursementValue.restrictionAmountSubtracted = amountSubtracted;
        disbursementValue.restrictionSubtracted = bclmRestriction.restriction;
      }
    }
  }

  /**
   * Calculate the total BC grants for each disbursement since they
   * can be affected by the calculations for the values already paid for the student
   * or by overaward deductions and calculate and record BC total grants that was used to
   * subtracted due to a {@link RestrictionActionType.StopFullTimeBCFunding} restriction.
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
      const bcTotalGrantValueAmount = disbursementSchedule.disbursementValues
        // Filter all BC grants.
        .filter(
          (disbursementValue) =>
            disbursementValue.valueType === DisbursementValueType.BCGrant,
        )
        // Sum all BC grants.
        .reduce((previousValue, currentValue) => {
          return previousValue + currentValue.effectiveAmount;
        }, 0);
      // Calculate total BC grants subtracted due to restriction.
      const bcTotalGrantAmountSubtracted =
        disbursementSchedule.disbursementValues
          // Filter all BC grants.
          .filter(
            (disbursementValue) =>
              disbursementValue.valueType === DisbursementValueType.BCGrant &&
              disbursementValue.restrictionAmountSubtracted !== null,
          )
          // Sum all BC grants subtracted due to restriction.
          .reduce((previousValue, currentValue) => {
            return previousValue + currentValue.restrictionAmountSubtracted;
          }, 0);
      bcTotalGrant.valueAmount = bcTotalGrantValueAmount;
      bcTotalGrant.effectiveAmount = bcTotalGrantValueAmount;
      bcTotalGrant.restrictionAmountSubtracted =
        bcTotalGrantAmountSubtracted ?? null;
    }
  }

  /**
   * For a single student, check if there is an overaward balance, updates the awards
   * with the deductions, if needed, and adjust the student overaward balance if a
   * deduction happen.
   * @param studentId student to be verified.
   * @param studentSchedules student disbursements that are part of one e-Cert.
   * @param studentsOverawardBalance overaward balance for the student.
   * @param entityManager used to execute the commands in the same transaction.
   */
  private async applyOverawardsDeductionsForECertGeneration(
    studentId: number,
    studentSchedules: ECertDisbursementSchedule[],
    studentOverawardBalance: AwardOverawardBalance,
    entityManager: EntityManager,
  ): Promise<void> {
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
        !this.shouldStopFullTimeBCFunding(
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
      const overawardBalance = studentOverawardBalance[valueCode] ?? 0;
      if (!overawardBalance) {
        // There are no overawards to be subtracted for this award.
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
            overawardValue: loan.awardValue.overawardAmountSubtracted * -1,
            originType: DisbursementOverawardOriginType.AwardDeducted,
            creator: auditUser,
          } as DisbursementOveraward);
        }
      }
    }
  }

  /**
   * Determine when a BC Full-time funding should not be disbursed.
   * In this case the e-Cert can still be generated with th federal funding.
   * @param schedule disbursement to be checked.
   * @param disbursementValue award to be checked.
   * @returns true if the funding should not be disbursed, otherwise, false.
   */
  private shouldStopFullTimeBCFunding(
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

  /**
   * Get the list of the awards from all disbursements with the associated
   * schedule. Useful to generate the overaward balance deduction record.
   * @param disbursementSchedules schedules to have the awards listed.
   * @param valueTypes types to be part of the final awards list.
   * @returns awards filtered by the types requested with the associated
   * disbursement schedule.
   */
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
   * Try to deduct an overaward balance owed by the student due to some previous overaward in some
   * previous application.
   * @param awards specific loan award being adjusted (e.g CSLF, BCSL). This will contain one or
   * two entries, always from the same award, from where the student debit will be deducted.
   * The debit will try to be settle as much as possible with the first award. If it is not enough
   * if will check for the second award (second disbursement), when present.
   * The awards lists will be always from the same loan award code. For instance, the list list
   * will contain one or two awards of type CSLF.
   * @param overawardBalance total overaward balance be deducted.
   */
  private subtractOverawardBalance(
    awards: DisbursementValue[],
    overawardBalance: number,
  ): void {
    let currentBalance = overawardBalance;
    for (const award of awards) {
      // Award amount that is available to be taken for the overaward balance adjustment.
      const availableAwardValueAmount =
        award.valueAmount - (award.disbursedAmountSubtracted ?? 0);
      if (availableAwardValueAmount >= currentBalance) {
        // Current disbursement value is enough to pay the debit.
        // For instance:
        // - Award: $1000
        // - Overaward balance: $750
        // Then
        // - Award: $1000
        // - overawardAmountSubtracted: $750
        // - currentBalance: $0
        award.overawardAmountSubtracted = currentBalance;
        // Cancel because there is nothing else to be deducted.
        return;
      } else {
        // Current disbursement is not enough to pay the debit.
        // Updates total overawardBalance.
        // For instance:
        // - Award: $500
        // - Overaward balance: $750
        // Then
        // - Award: $500
        // - overawardAmountSubtracted: $500
        // - currentBalance: $250
        // If there is one more disbursement with the same award, the $250
        // overaward balance will be taken from there, if possible executing the
        // second iteration of this for loop.
        currentBalance -= availableAwardValueAmount;
        award.overawardAmountSubtracted = availableAwardValueAmount;
      }
    }
  }

  /**
   * Calculate tuition remittance effective amount.
   * @param disbursements all disbursements that are part of one e-Cert.
   */
  private calculateTuitionRemittanceEffectiveAmount(
    disbursements: ECertDisbursementSchedule[],
  ) {
    for (const disbursement of disbursements) {
      disbursement.tuitionRemittanceEffectiveAmount =
        this.confirmationOfEnrollmentService.getMaxTuitionRemittance(
          disbursement.disbursementValues,
          disbursement.studentAssessment.application.currentAssessment.offering,
          MaxTuitionRemittanceTypes.Effective,
        );
    }
  }
}
