import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, IsNull } from "typeorm";
import {
  RecordDataModelService,
  DisbursementSchedule,
  DisbursementValue,
  StudentAssessment,
  AssessmentTriggerType,
  ApplicationStatus,
  DisbursementValueType,
  DisbursementScheduleStatus,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  Student,
  Application,
  configureIdleTransactionSessionTimeout,
} from "@sims/sims-db";
import {
  DisbursementSaveModel,
  DisbursementScheduleValue,
} from "./disbursement-schedule.models";
import { CustomNamedError, MIN_CANADA_LOAN_OVERAWARD } from "@sims/utilities";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  DISBURSEMENT_SCHEDULES_ALREADY_CREATED,
} from "../../constants";
import { SystemUsersService } from "@sims/services/system-users";

// Timeout to handle the worst-case scenario where the commit/rollback
// was not executed due to a possible catastrophic failure.
const TRANSACTION_IDLE_TIMEOUT_SECONDS = 600;

const LOAN_TYPES = [
  DisbursementValueType.CanadaLoan,
  DisbursementValueType.BCLoan,
];

const GRANTS_TYPES = [
  DisbursementValueType.CanadaGrant,
  DisbursementValueType.BCGrant,
];

/**
 * Service layer for Student Application disbursement schedules.
 * Assumptions and concepts:
 * - sims.disbursement_overawards can also be referred as overaward balance table or overaward history table.
 * - One assessment/reassessment will have one or two dates to be disbursed, a.k.a. disbursement schedule.
 * - Awards are the loans/grants associated with one disbursement schedule (e.g. CSLF, CSPT, BCSL).
 * - The same award can be present in one or two schedules. If it is present in only one it does not mean that it will be in the first one.
 * - A student debt can be a value already received by the student for the same application (application itself and its versions, for instance, overwritten ones).
 *     - Values already paid(sent/disbursed): sum of all the awards already disbursed for that application number grouped by its code value (e.g. CSLF, CSPT, BCSL).
 *     - During a reassessment, the new award calculated will be deducted from all the values already paid for that particular application.
 *     - If there is a student debt, the priority is to deduct the value as much as possible from the sooner disbursement schedule. This means that,
 *       in case there are two disbursements for the same award, the process will try to deduct as much as possible from the first disbursement.
 *     - All values once paid(sent/disbursed) for any application associated with an application number (independent of the status) must be considered as paid.
 * - Upon reassessment, awards in pending state will be set to cancelled.
 * - Upon reassessment, if the previous assessment of the same application caused an overaward, this overaward will be soft deleted from the overaward balance table.
 * - All process are executed in a DB transaction to ensure the schedule values and overaward values are adjusted at the same time.
 * - A DB lock is acquired at the start of the process to avoid two processes to be executed in parallel. Once the first one is executed
 * the second one will be able to detect that the fist one already processed the disbursements.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super(dataSource.getRepository(DisbursementSchedule));
  }

  /**
   * Create the disbursements for an assessment.
   * @param assessmentId application id to associate the disbursements.
   * @param disbursements array of disbursements and values to be created.
   * @returns created disbursements.
   */
  async createDisbursementSchedules(
    assessmentId: number,
    disbursements: DisbursementSaveModel[],
  ): Promise<DisbursementSchedule[]> {
    const auditUser = await this.systemUsersService.systemUser();
    return this.dataSource.transaction(async (transactionEntityManager) => {
      await configureIdleTransactionSessionTimeout(
        transactionEntityManager.queryRunner,
        TRANSACTION_IDLE_TIMEOUT_SECONDS,
      );
      // Gets the assessment and lock the record. Only the record will be locked and
      // it will be locked only to perform updates.
      const assessment = await this.getStudentAssessment(
        assessmentId,
        transactionEntityManager,
      );
      // Rollback overawards from the current application (any version of current application).
      await this.rollbackOverawards(assessmentId, transactionEntityManager);
      // Get already sent (disbursed) values to know the amount that the student already received.
      const currentDisbursements = await this.getDisbursementsForOverawards(
        assessment.application.student.id,
        assessment.application.applicationNumber,
        DisbursementScheduleStatus.Sent,
        transactionEntityManager,
      );
      // Sum total disbursed values per award type (Federal or Provincial).
      // !Must be execute before the new disbursement values are added.
      const totalAlreadyDisbursedValues =
        this.sumDisbursedValuesPerValueCode(currentDisbursements);
      // Save the disbursements to DB.
      const disbursementSchedules: DisbursementSchedule[] = [];
      for (const disbursement of disbursements) {
        const newDisbursement = new DisbursementSchedule();
        newDisbursement.creator = auditUser;
        newDisbursement.disbursementDate = disbursement.disbursementDate;
        newDisbursement.negotiatedExpiryDate =
          disbursement.negotiatedExpiryDate;
        newDisbursement.disbursementValues = disbursement.disbursements.map(
          (disbursementValue) => {
            const newValue = new DisbursementValue();
            newValue.valueType = disbursementValue.valueType;
            newValue.valueCode = disbursementValue.valueCode;
            newValue.valueAmount = disbursementValue.valueAmount.toString();
            newValue.creator = auditUser;
            return newValue;
          },
        );
        disbursementSchedules.push(newDisbursement);
      }
      assessment.disbursementSchedules = disbursementSchedules;
      assessment.modifier = auditUser;
      // Save the disbursements.
      const studentAssessmentRepo =
        transactionEntityManager.getRepository(StudentAssessment);
      await studentAssessmentRepo.save(assessment);
      // Adjust the saved grants disbursements with the values already disbursed.
      // !Intended to process only grants (CanadaGrant/BCGrant)
      this.applyGrantsAlreadyDisbursedValues(
        disbursementSchedules,
        totalAlreadyDisbursedValues,
      );
      // Adjust the saved loans disbursements with the values already disbursed
      // and generate possible overawards.
      // !Intended to process only loans (CanadaLoan/BCLoan)
      await this.applyLoansOverawards(
        assessment.id,
        assessment.application.student.id,
        disbursementSchedules,
        totalAlreadyDisbursedValues,
        transactionEntityManager,
      );
      // Calculate BC Total grant to be used in e-Cert files.
      await this.calculateBCTotalGrants(disbursementSchedules);
      // Persist changes for grants and loans.
      await studentAssessmentRepo.save(assessment);

      return assessment.disbursementSchedules;
    });
  }

  /**
   * Get the student assessment information needed to process
   * the disbursements received to be saved.
   * @param assessmentId student assessment id.
   * @param entityManager used to execute the commands in the same transaction.
   * @returns student assessment information.
   */
  private async getStudentAssessment(
    assessmentId: number,
    entityManager: EntityManager,
  ): Promise<StudentAssessment> {
    const studentAssessmentRepo =
      entityManager.getRepository(StudentAssessment);
    // Lock the assessment record for update.
    await studentAssessmentRepo.findOne({
      select: { id: true },
      where: { id: assessmentId },
      lock: { mode: "pessimistic_write" },
    });
    const assessment = await studentAssessmentRepo.findOne({
      select: {
        id: true,
        triggerType: true,
        application: {
          id: true,
          applicationStatus: true,
          applicationNumber: true,
          student: {
            id: true,
          },
        },
        disbursementSchedules: { id: true },
        offering: {
          studyStartDate: true,
        },
      },
      relations: {
        application: {
          student: true,
        },
        disbursementSchedules: true,
        offering: true,
      },
      where: {
        id: assessmentId,
      },
    });

    if (!assessment) {
      throw new CustomNamedError(
        "Student assessment not found.",
        ASSESSMENT_NOT_FOUND,
      );
    }

    if (assessment.disbursementSchedules?.length > 0) {
      throw new CustomNamedError(
        `Disbursements were already created for this Student Assessment.`,
        DISBURSEMENT_SCHEDULES_ALREADY_CREATED,
      );
    }

    if (
      assessment.triggerType === AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.inProgress
    ) {
      throw new CustomNamedError(
        `Student Assessment and Student Application are not in the expected status. Expecting assessment status '${AssessmentTriggerType.OriginalAssessment}' when the application status is '${ApplicationStatus.inProgress}'.`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }

    if (
      assessment.triggerType !== AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.completed
    ) {
      throw new CustomNamedError(
        `Student Assessment and Student Application are not in the expected status. Expecting application status '${ApplicationStatus.completed}' when the assessment status is not '${AssessmentTriggerType.OriginalAssessment}'.`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }
    return assessment;
  }

  /**
   * Rollback overawards from the current application being reassessed.
   * Past pending assessment will not be impacted.
   * @param assessmentId assessment id.
   * @param entityManager used to execute the commands in the same transaction.
   */
  async rollbackOverawards(
    assessmentId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const applicationsToRollback = await entityManager
      .getRepository(Application)
      .find({
        select: { applicationNumber: true, student: { id: true } },
        relations: {
          student: true,
        },
        where: {
          currentAssessment: {
            id: assessmentId,
          },
        },
      });

    const [applicationToRollback] = applicationsToRollback;
    await Promise.all([
      this.deleteOverawardRecords(
        applicationToRollback.student.id,
        applicationToRollback.applicationNumber,
        entityManager,
      ),
      this.cancelPendingDisbursements(
        applicationToRollback.student.id,
        applicationToRollback.applicationNumber,
        entityManager,
      ),
    ]);
  }

  /**
   * Get disbursement schedules values that are either pending or were already disbursed.
   * All possible versions of the same application will be considered, including overridden ones.
   * For instance, if a disbursement schedule was ever marked as disbursed it will matter for
   * calculations of the values already paid for the student.
   * @param studentId student id.
   * @param applicationNumber application number to have the disbursements retrieved.
   * @param entityManager used to execute the commands in the same transaction.
   * @returns disbursement schedules relevant to overaward calculation.
   */
  private async getDisbursementsForOverawards(
    studentId: number,
    applicationNumber: string,
    status: DisbursementScheduleStatus,
    entityManager: EntityManager,
  ): Promise<DisbursementSchedule[]> {
    const disbursementScheduleRepo =
      entityManager.getRepository(DisbursementSchedule);
    return disbursementScheduleRepo.find({
      select: {
        id: true,
        disbursementScheduleStatus: true,
        disbursementValues: {
          id: true,
          valueType: true,
          valueCode: true,
          valueAmount: true,
          overawardAmountSubtracted: true,
          disbursedAmountSubtracted: true,
        },
        studentAssessment: {
          id: true,
          application: {
            id: true,
            student: {
              id: true,
            },
          },
        },
      },
      relations: {
        disbursementValues: true,
        studentAssessment: {
          application: {
            student: true,
          },
        },
      },
      where: {
        studentAssessment: {
          application: {
            student: {
              id: studentId,
            },
            applicationNumber,
          },
        },
        disbursementScheduleStatus: status,
      },
    });
  }

  /**
   * Soft delete overawards records generated from reassessments
   * of this application.
   * @param studentId student id.
   * @param applicationNumber application number to be rolled back.
   * @param entityManager used to execute the commands in the same transaction.
   */
  private async deleteOverawardRecords(
    studentId: number,
    applicationNumber: string,
    entityManager: EntityManager,
  ): Promise<void> {
    const disbursementOverawardRepo = entityManager.getRepository(
      DisbursementOveraward,
    );
    const overawardsToDelete = await disbursementOverawardRepo.find({
      select: { id: true },
      where: {
        // Only delete overawards not related to awards (disbursement_schedule_id IS NULL).
        // Overawards associated with some award were already sent in some e-Cert and are
        // considered paid.
        disbursementSchedule: {
          id: IsNull(),
        },
        studentAssessment: {
          application: {
            student: {
              id: studentId,
            },
            applicationNumber,
          },
        },
      },
    });
    if (!overawardsToDelete.length) {
      return;
    }
    const deletedAt = new Date();
    const auditUser = await this.systemUsersService.systemUser();
    overawardsToDelete.forEach((overaward) => {
      overaward.modifier = auditUser;
      overaward.deletedAt = deletedAt;
    });
    await disbursementOverawardRepo.save(overawardsToDelete, {
      reload: false,
    });
  }

  /**
   * Cancel all pending disbursements.
   * @param studentId student id.
   * @param applicationNumber application that must have their pending awards cancelled.
   * @param entityManager used to execute the commands in the same transaction.
   */
  private async cancelPendingDisbursements(
    studentId: number,
    applicationNumber: string,
    entityManager: EntityManager,
  ) {
    const auditUser = await this.systemUsersService.systemUser();
    // Get all pending awards that must be cancelled.
    const pendingDisbursements = await this.getDisbursementsForOverawards(
      studentId,
      applicationNumber,
      DisbursementScheduleStatus.Pending,
      entityManager,
    );
    for (const pendingDisbursement of pendingDisbursements) {
      pendingDisbursement.modifier = auditUser;
      pendingDisbursement.disbursementScheduleStatus =
        DisbursementScheduleStatus.Cancelled;
    }
    // Save all the pending awards that were changed to cancelled.
    await entityManager
      .getRepository(DisbursementSchedule)
      .save(pendingDisbursements);
  }

  /**
   * Sum all the disbursed Canada/BC loans and grants per loan/grant value code.
   * The result object will be as the one in the example below
   * where CSLF and BCSL are the valueCode in the disbursement value.
   * @param disbursementSchedules disbursement schedules and values from DB.
   * @returns sum of all the disbursed Canada/BC loans (CSLF, CSPT, BCSL).
   * @example
   * {
   *    CSLF: 5532,
   *    BCSL: 1256,
   *    CSGP: 5555,
   *    BGPD: 1234
   * }
   */
  private sumDisbursedValuesPerValueCode(
    disbursementSchedules: DisbursementSchedule[],
  ): Record<string, number> {
    const totalPerValueCode: Record<string, number> = {};
    disbursementSchedules
      .filter(
        (disbursementSchedule) =>
          disbursementSchedule.disbursementScheduleStatus ===
          DisbursementScheduleStatus.Sent,
      )
      .flatMap(
        (disbursementSchedule) => disbursementSchedule.disbursementValues,
      )
      .forEach((disbursementValue) => {
        const realAwardPaidValue =
          +disbursementValue.valueAmount -
          +disbursementValue.disbursedAmountSubtracted;
        totalPerValueCode[disbursementValue.valueCode] =
          (totalPerValueCode[disbursementValue.valueCode] ?? 0) +
          realAwardPaidValue;
      });
    return totalPerValueCode;
  }

  /**
   * Checks values already sent (disbursed) for all grants to
   * avoid paying twice the same award. All calculations are
   * individually processed for each award code.
   * The possible adjustments are execute in the disbursementSchedules
   * award values.
   * !Intended to process only grants (CanadaGrant/BCGrant)
   * @param disbursementSchedules schedules with awards values
   * to be adjusted case already sent.
   * @param totalAlreadyDisbursedValues sum of the awards already
   * disbursed per award code.
   */
  private async applyGrantsAlreadyDisbursedValues(
    disbursementSchedules: DisbursementSchedule[],
    totalAlreadyDisbursedValues: Record<string, number>,
  ): Promise<void> {
    const grantsAwards = this.getAwardsByAwardType(
      disbursementSchedules,
      GRANTS_TYPES,
    );
    const distinctValueCodes = this.getDistinctValueCodes(grantsAwards);
    for (const valueCode of distinctValueCodes) {
      // Checks if the grant is present in multiple disbursements.
      // Find all the values in all the schedules (expected one or two).
      const grants = grantsAwards.filter(
        (grantAward) => grantAward.disbursementValue.valueCode === valueCode,
      );
      // Total value already received by the student for this grant for this application.
      const alreadyDisbursed = totalAlreadyDisbursedValues[valueCode] ?? 0;
      // Subtract the debt from the current grant in the current assessment.
      this.subtractStudentDebit(
        grants.map((grant) => grant.disbursementValue),
        alreadyDisbursed,
        "PreviousDisbursement",
      );
      // If there is some remaining student debit for grants it will be just
      // not considered (loans generate overawards, grants do not).
    }
  }

  /**
   * Checks values already sent (disbursed) for all loans to
   * avoid paying twice the same award. All calculations are
   * individually processed for each loan code.
   * For a particular loan award, when the money amount already disbursed is
   * greater than the amount of money the student need to received, an
   * overaward is added to the student account.
   * @param assessmentId assessment being processed.
   * @param studentId student.
   * @param disbursementSchedules disbursement schedules with the awards to
   * be verified and possibility adjusted.
   * @param totalAlreadyDisbursedValues total disbursed values for this the application.
   * @param entityManager used to execute the commands in the same transaction.
   * @returns
   */
  private async applyLoansOverawards(
    assessmentId: number,
    studentId: number,
    disbursementSchedules: DisbursementSchedule[],
    totalAlreadyDisbursedValues: Record<string, number>,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = await this.systemUsersService.systemUser();
    const disbursementOverawardRepo = entityManager.getRepository(
      DisbursementOveraward,
    );
    const loanAwards = this.getAwardsByAwardType(
      disbursementSchedules,
      LOAN_TYPES,
    );
    const distinctValueCodes = this.getDistinctValueCodes(loanAwards);
    for (const valueCode of distinctValueCodes) {
      // Checks if the loan is present in multiple disbursements.
      // Find all the values in all the schedules (expected one or two).
      const loans = loanAwards.filter(
        (loanAward) => loanAward.disbursementValue.valueCode === valueCode,
      );
      // Total value already received by the student for this loan for this application.
      const alreadyDisbursed = totalAlreadyDisbursedValues[valueCode] ?? 0;
      // Subtract the debit from the current awards in the current assessment.
      const remainingStudentDebit = this.subtractStudentDebit(
        loans.map((loan) => loan.disbursementValue),
        alreadyDisbursed,
        "PreviousDisbursement",
      );
      // If there is some remaining student debit, generate an overaward.
      const [referenceAward] = loans;
      const shouldGenerateOveraward = this.shouldGenerateOveraward(
        referenceAward.disbursementValue.valueType,
        remainingStudentDebit,
      );
      if (shouldGenerateOveraward) {
        // There is no more money to be subtracted from this assessment.
        // Insert the remaining student debit into the overaward.
        await disbursementOverawardRepo.insert({
          student: { id: studentId } as Student,
          studentAssessment: { id: assessmentId } as StudentAssessment,
          disbursementValueCode: valueCode,
          overawardValue: remainingStudentDebit.toString(),
          originType: DisbursementOverawardOriginType.ReassessmentOveraward,
          creator: auditUser,
        } as DisbursementOveraward);
      }
    }
  }

  /**
   * Checks if an overaward should be generated.
   * Not every overaward should be added to the student account.
   * @param disbursementValueType award type.
   * @param studentOveraward overaward to be added to the student account.
   * @returns true if the overaward should be generated, otherwise, false.
   */
  private shouldGenerateOveraward(
    disbursementValueType: DisbursementValueType,
    studentOveraward: number,
  ): boolean {
    return (
      disbursementValueType !== DisbursementValueType.CanadaLoan ||
      (disbursementValueType === DisbursementValueType.CanadaLoan &&
        studentOveraward > MIN_CANADA_LOAN_OVERAWARD)
    );
  }

  /**
   * Calculate the total BC grants for each disbursement since they
   * can be affected by the calculations for the values already paid for the student.
   * @param disbursementSchedules disbursements to have the BC grants calculated.
   */
  private async calculateBCTotalGrants(
    disbursementSchedules: DisbursementSchedule[],
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
        bcTotalGrant.valueCode = "BCSG";
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
          return previousValue + +currentValue.valueAmount;
        }, 0)
        .toString();
    }
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
  private subtractStudentDebit(
    awards: DisbursementValue[],
    totalStudentDebit: number,
    subtractOrigin: "PreviousDisbursement" | "Overaward",
  ): number {
    let studentDebit = totalStudentDebit;
    for (const award of awards) {
      const awardValueAmount = +award.valueAmount;
      if (awardValueAmount >= totalStudentDebit) {
        // Current disbursement value is enough to pay the debit.
        // For instance:
        // - Award: $1000
        // - Student Debit: $750
        // Then
        // - New award: $250 ($1000 - $750)
        // - Student debit: $0
        if (subtractOrigin === "Overaward") {
          award.overawardAmountSubtracted = studentDebit.toString();
        } else {
          award.disbursedAmountSubtracted = studentDebit.toString();
        }
        studentDebit = 0;
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
        studentDebit -= awardValueAmount;
        if (subtractOrigin === "Overaward") {
          award.overawardAmountSubtracted = award.valueAmount;
        } else {
          award.disbursedAmountSubtracted = award.valueAmount;
        }
      }
    }
    return studentDebit;
  }

  /**
   * Get awards by the award type with its schedule associated.
   * @param disbursementSchedules schedules with awards to be extracted.
   * @param valueTypes types to be considered.
   * @returns awards of the specified type.
   */
  private getAwardsByAwardType(
    disbursementSchedules: DisbursementSchedule[],
    valueTypes: DisbursementValueType[],
  ): DisbursementScheduleValue[] {
    const results: DisbursementScheduleValue[] = [];
    for (const schedule of disbursementSchedules) {
      for (const scheduleValue of schedule.disbursementValues) {
        if (valueTypes.includes(scheduleValue.valueType)) {
          results.push({
            disbursementScheduleId: schedule.id,
            disbursementValue: scheduleValue,
          });
        }
      }
    }
    return results;
  }

  /**
   * Awards(loan/grants) can be present multiple times in one or more disbursements.
   * Get only the distinct value codes present on this disbursement.
   * @param awards awards to retrieve unique codes.
   * @returns unique awards codes.
   */
  private getDistinctValueCodes(awards: DisbursementScheduleValue[]) {
    return [
      ...new Set(awards.map((award) => award.disbursementValue.valueCode)),
    ];
  }
}
