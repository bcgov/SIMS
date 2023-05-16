import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, IsNull, UpdateResult } from "typeorm";
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
  configureIdleTransactionSessionTimeout,
  COEStatus,
  User,
  Application,
} from "@sims/sims-db";
import {
  COEApprovalPeriodStatus,
  DisbursementSaveModel,
} from "./disbursement-schedule.models";
import {
  COE_WINDOW,
  CustomNamedError,
  MIN_CANADA_LOAN_OVERAWARD,
  addDays,
  getISODateOnlyString,
  isBeforeDate,
  isBetweenPeriod,
} from "@sims/utilities";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  DISBURSEMENT_DOCUMENT_NUMBER_SEQUENCE_GROUP,
  DISBURSEMENT_SCHEDULES_ALREADY_CREATED,
  ENROLMENT_ALREADY_COMPLETED,
  ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD,
  ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ENROLMENT_NOT_FOUND,
  FIRST_COE_NOT_COMPLETE,
  GRANTS_TYPES,
  INVALID_TUITION_REMITTANCE_AMOUNT,
  LOAN_TYPES,
} from "../constants";
import { SystemUsersService } from "@sims/services/system-users";
import { ConfirmationOfEnrollmentService } from "../confirmation-of-enrollment/confirmation-of-enrollment.service";
import { SequenceControlService } from "../sequence-control/sequence-control.service";
import { NotificationActionsService } from "../notifications";

// Timeout to handle the worst-case scenario where the commit/rollback
// was not executed due to a possible catastrophic failure.
const TRANSACTION_IDLE_TIMEOUT_SECONDS = 60;

/**
 * Service layer for the student application assessment calculations for the disbursement schedules.
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
 * - A reassessment only produces an overaward if the application had some money sent(disbursed) already. Applications that have all theirs disbursements in 'pending'
 * state will be freely recalculated but will never generate an overaward.
 * - An application will only have money disbursed between its offering start/end dates. The disbursement schedules are generated always between start and and dates,
 * which also means that the money will only be sent sometime between offering start/end dates.
 * - Considering the above assumptions and below applications for a same student where current date is Dec 2022.
 * -------------------------------------
 * | Application | Start    | End      |
 * |-------------|----------|----------|
 * | 1000000001  | Jan-2023 | May-2023 |
 * | 1000000002  | Jul-2023 | Dec-2023 |
 * | 1000000003  | Feb-2024 | Oct-2024 |
 * -------------------------------------
 * - Application 1000000001 will have money disbursed only between Jan-2023 and May-2023 and while this is happening, applications 1000000002 and 1000000003
 * will never generate an overaward. For instance, application 1000000002 will never have any money disbursed before its start date (Jul-2023), which means that
 * any reassessment will just generate new numbers, remember, no money sent no overaward generated ever.
 * - Any deviation from the above statements is considered an edge case and must be adjusted manually by the Ministry.
 */
@Injectable()
export class DisbursementScheduleSharedService extends RecordDataModelService<DisbursementSchedule> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly systemUsersService: SystemUsersService,
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
    private readonly sequenceService: SequenceControlService,
    private readonly notificationActionsService: NotificationActionsService,
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
      // Sum total disbursed values per award type (Federal or Provincial).
      // !Must be execute before the new disbursement values are added.
      const totalAlreadyDisbursedValues =
        await this.sumDisbursedValuesPerValueCode(
          assessment.application.student.id,
          assessment.application.applicationNumber,
          transactionEntityManager,
        );
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
            newValue.valueAmount = disbursementValue.valueAmount;
            newValue.creator = auditUser;
            return newValue;
          },
        );
        disbursementSchedules.push(newDisbursement);
      }
      assessment.disbursementSchedules = disbursementSchedules;
      assessment.modifier = auditUser;
      // Adjust the saved grants disbursements with the values already disbursed.
      // !Intended to process only grants (CanadaGrant/BCGrant)
      this.applyGrantsAlreadyDisbursedValues(
        disbursementSchedules,
        totalAlreadyDisbursedValues,
      );
      // Adjust the saved loans disbursements with the values already disbursed
      // and generate possible overawards.
      // !Intended to process only loans (CanadaLoan/BCLoan)
      await this.createLoansOverawards(
        assessment.id,
        assessment.application.student.id,
        disbursementSchedules,
        totalAlreadyDisbursedValues,
        transactionEntityManager,
      );
      // Persist changes for grants and loans.
      await transactionEntityManager
        .getRepository(StudentAssessment)
        .save(assessment);

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
          id: true,
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
      assessment.application.applicationStatus !== ApplicationStatus.InProgress
    ) {
      throw new CustomNamedError(
        `Student Assessment and Student Application are not in the expected status. Expecting assessment status '${AssessmentTriggerType.OriginalAssessment}' when the application status is '${ApplicationStatus.InProgress}'.`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }

    if (
      assessment.triggerType !== AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.Completed
    ) {
      throw new CustomNamedError(
        `Student Assessment and Student Application are not in the expected status. Expecting application status '${ApplicationStatus.Completed}' when the assessment status is not '${AssessmentTriggerType.OriginalAssessment}'.`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }
    return assessment;
  }

  /**
   * Rollback overawards from the current application being reassessed.
   * Past pending assessment will not be impacted.
   * This method is safe to be called independently of the workflow state but it makes sense only after the
   * application moves from the 'In progress' status when the disbursements are generated.
   * @param assessmentId assessment id.
   * @param entityManager used to execute the commands in the same transaction.
   */
  async rollbackOverawards(
    assessmentId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const assessmentToRollback = await entityManager
      .getRepository(StudentAssessment)
      .findOne({
        select: {
          id: true,
          application: {
            id: true,
            applicationNumber: true,
            student: {
              id: true,
            },
          },
        },
        relations: {
          application: { student: true },
        },
        where: {
          id: assessmentId,
        },
      });
    await Promise.all([
      this.deleteOverawardRecords(
        assessmentToRollback.application.student.id,
        assessmentToRollback.application.applicationNumber,
        entityManager,
      ),
      this.cancelPendingDisbursements(
        assessmentToRollback.application.student.id,
        assessmentToRollback.application.applicationNumber,
        entityManager,
      ),
    ]);
  }

  /**
   * Get disbursement schedules (and its awards values) that are either pending or were already disbursed.
   * All possible versions of the same application will be considered, including overridden ones.
   * For instance, if a disbursement schedule was ever marked as disbursed it will matter for
   * calculations of the values already paid for the student.
   * @param studentId student id.
   * @param applicationNumber application number to have the disbursements retrieved.
   * @param status disbursement schedule status.
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
          effectiveAmount: true,
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
   * Soft delete overawards records, if any, generated from reassessments
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
        deletedAt: IsNull(),
        // disbursementSchedule is populated when an overaward has a deduction during the e-Cert
        // generation when the award was paid (Sent), these records are not deleted.
        disbursementSchedule: IsNull(),
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
   * @param studentId student id.
   * @param applicationNumber application number to have the money already disbursed calculated.
   * @param entityManager used to execute the commands in the same transaction.
   * @returns sum of all the disbursed Canada/BC loans (CSLF, CSPT, BCSL).
   * @example
   * {
   *    CSLF: 5532,
   *    BCSL: 1256,
   *    CSGP: 5555,
   *    BGPD: 1234
   * }
   */
  private async sumDisbursedValuesPerValueCode(
    studentId: number,
    applicationNumber: string,
    entityManager: EntityManager,
  ): Promise<Record<string, number>> {
    // Get already sent (disbursed) values to know the amount that the student already received.
    const disbursementSchedules = await this.getDisbursementsForOverawards(
      studentId,
      applicationNumber,
      DisbursementScheduleStatus.Sent,
      entityManager,
    );

    const totalPerValueCode: Record<string, number> = {};
    // While calculating the total amount paid to the student, the overawardAmountSubtracted is added to the
    // effectiveAmount because it should be considered part of what the student received.
    // The overawardAmountSubtracted is money that the student is being paid but before e-Cert generation
    // it is used to deduct student debt, and the deduction is made with "student money".
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
        totalPerValueCode[disbursementValue.valueCode] =
          (totalPerValueCode[disbursementValue.valueCode] ?? 0) +
          (disbursementValue.overawardAmountSubtracted ?? 0) +
          (disbursementValue.effectiveAmount ?? 0);
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
        (grantAward) => grantAward.valueCode === valueCode,
      );
      // Total value already received by the student for this grant for this application.
      const alreadyDisbursed = totalAlreadyDisbursedValues[valueCode] ?? 0;
      // Subtract the debt from the current grant in the current assessment.
      this.subtractPreviousDisbursementDebit(grants, alreadyDisbursed);
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
   * @param assessmentId assessment id being processed.
   * @param studentId student id.
   * @param disbursementSchedules disbursement schedules with the awards to
   * be verified and possibility adjusted.
   * @param totalAlreadyDisbursedValues total disbursed values for this the application.
   * @param entityManager used to execute the commands in the same transaction.
   */
  private async createLoansOverawards(
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
        (loanAward) => loanAward.valueCode === valueCode,
      );
      // Total value already received by the student for this loan for this application.
      const alreadyDisbursed = totalAlreadyDisbursedValues[valueCode] ?? 0;
      // Subtract the debit from the current awards in the current assessment.
      const remainingStudentDebit = this.subtractPreviousDisbursementDebit(
        loans,
        alreadyDisbursed,
      );
      // If there is some remaining student debit, generate an overaward.
      const [referenceAward] = loans;
      const shouldGenerateOveraward = this.shouldGenerateOveraward(
        referenceAward.valueType,
        remainingStudentDebit,
      );
      if (shouldGenerateOveraward) {
        // There is no more money to be subtracted from this assessment.
        // Insert the remaining student debit into the overaward.
        await disbursementOverawardRepo.insert({
          student: { id: studentId } as Student,
          studentAssessment: { id: assessmentId } as StudentAssessment,
          disbursementValueCode: valueCode,
          overawardValue: remainingStudentDebit,
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
    switch (disbursementValueType) {
      case DisbursementValueType.CanadaLoan:
        return studentOveraward > MIN_CANADA_LOAN_OVERAWARD;
      case DisbursementValueType.BCLoan:
        return studentOveraward !== 0;
      default:
        return false;
    }
  }

  /**
   * During a reassessment, if the student had already received any amount of money for the
   * same application, this amount must be subtracted from the new reassessment awards amounts.
   * @param awards specific award being adjusted (e.g BGPD). This will contain one or
   * two entries, always from the same award, from where the student debit will be deducted.
   * The debit will try to be settle as much as possible with the first award. If it is not enough
   * if will check for the second award (second disbursement), when present, if it is not enough, the
   * remaining value will be returned to let the caller of the method aware that part of the debit
   * was not payed.
   * The awards lists will be always from the same award code. For instance, the list list will contain
   * one or two awards of type BGPD.
   * @param totalStudentDebit total award amount already paid to be deducted.
   * @returns the remaining student debit in case the awards were not enough to pay it.
   */
  private subtractPreviousDisbursementDebit(
    awards: DisbursementValue[],
    totalStudentDebit: number,
  ): number {
    let studentDebit = totalStudentDebit;
    for (const award of awards) {
      if (award.valueAmount >= totalStudentDebit) {
        // Current disbursement value is enough to pay the debit.
        // For instance:
        // - Award: $1000
        // - Student already received: $750
        // Then
        // - Award: $1000
        // - disbursedAmountSubtracted: $750
        // - Student debit: $0
        award.disbursedAmountSubtracted = studentDebit;
        studentDebit = 0;
      } else {
        // Current disbursement is not enough to pay the debit.
        // Updates total student debit.
        // For instance:
        // - Award: $500
        // - Student already received: $750
        // Then
        // - Award: $500
        // - disbursedAmountSubtracted: $500
        // - Student debit: $250
        // If there is one more disbursement with the same award, the $250
        // student debit will be taken from there, if possible executing the
        // second iteration of this for loop.
        studentDebit -= award.valueAmount;
        award.disbursedAmountSubtracted = award.valueAmount;
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
  ): DisbursementValue[] {
    return disbursementSchedules
      .flatMap((schedule) => schedule.disbursementValues)
      .filter((scheduleValue) => valueTypes.includes(scheduleValue.valueType));
  }

  /**
   * Awards(loan/grants) can be present multiple times in one or more disbursements.
   * Get only the distinct value codes present on this disbursement.
   * @param awards awards to retrieve unique codes.
   * @returns unique awards codes.
   */
  private getDistinctValueCodes(awards: DisbursementValue[]): string[] {
    return [...new Set(awards.map((award) => award.valueCode))];
  }

  /**
   * Total BCSL amount that the student received from the SIMS.
   * @param studentId student id.
   * @returns total BCSL amount that the student received from the SIMS.
   */
  async totalDisbursedBCSLAmount(studentId: number): Promise<number> {
    const total = await this.repo
      .createQueryBuilder("disbursement")
      .select("SUM(disbursementValue.effectiveAmount)")
      .innerJoin("disbursement.disbursementValues", "disbursementValue")
      .innerJoin("disbursement.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.student", "student")
      .where(
        "disbursement.disbursementScheduleStatus = :disbursementScheduleStatus",
        {
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      )
      .andWhere("student.id = :studentId", { studentId: studentId })
      .andWhere("disbursementValue.valueType = :disbursementValueType", {
        disbursementValueType: DisbursementValueType.BCLoan,
      })
      .getRawOne<{ sum?: number }>();
    return +(total?.sum ?? 0);
  }

  /**
   * Disbursement and application details of the given disbursement.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param locationId location id.
   * @returns disbursement and application summary.
   */
  async getDisbursementAndApplicationSummary(
    disbursementScheduleId: number,
    locationId?: number,
  ): Promise<DisbursementSchedule> {
    const disbursementAndApplicationQuery = this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.disbursementDate",
        "disbursementSchedule.coeStatus",
        "application.id",
        "application.applicationStatus",
        "application.applicationNumber",
        "studentAssessment.id",
        "studentAssessment.assessmentWorkflowId",
        "currentAssessment.id",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "offering.studyEndDate",
        "disbursementValues.valueType",
        "disbursementValues.valueCode",
        "disbursementValues.valueAmount",
      ])
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin(
        "disbursementSchedule.disbursementValues",
        "disbursementValues",
      )
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "location")
      .where("disbursementSchedule.id = :disbursementScheduleId", {
        disbursementScheduleId,
      });

    if (locationId) {
      disbursementAndApplicationQuery.andWhere("location.id = :locationId", {
        locationId,
      });
    }
    return disbursementAndApplicationQuery.getOne();
  }

  /**
   * Get COE approval period status which defines
   * if the COE can be confirmed by institution on current date.
   * @param disbursementDate disbursement date.
   * @param studyEndDate study end date of the offering.
   * @param enrolmentConfirmationDate date of confirmation of enrolment.
   * @returns COE approval period status.
   */
  getCOEApprovalPeriodStatus(
    disbursementDate: string | Date,
    studyEndDate: string | Date,
    enrolmentConfirmationDate?: string | Date,
  ): COEApprovalPeriodStatus {
    if (!disbursementDate || !studyEndDate) {
      throw new Error(
        "disbursementDate and studyEndDate are required for COE window verification.",
      );
    }
    // Enrolment period start date(COE_WINDOW days before disbursement date).
    const enrolmentPeriodStart = addDays(-COE_WINDOW, disbursementDate);
    //Current date as date only string.
    const coeConfirmationDate = getISODateOnlyString(
      enrolmentConfirmationDate ?? new Date(),
    );
    // Enrolment period end date is study period end date.
    // Is the enrolment now within eligible approval period.
    if (
      isBetweenPeriod(coeConfirmationDate, {
        startDate: enrolmentPeriodStart,
        endDate: studyEndDate,
      })
    ) {
      return COEApprovalPeriodStatus.WithinApprovalPeriod;
    }
    // Is the enrolment now before the eligible approval period.
    if (isBeforeDate(coeConfirmationDate, enrolmentPeriodStart)) {
      return COEApprovalPeriodStatus.BeforeApprovalPeriod;
    }

    return COEApprovalPeriodStatus.AfterApprovalPeriod;
  }

  /**
   * Get the first disbursement schedule of an application.
   * @param applicationId application id.
   * @param onlyPendingCOE If onlyPendingCOE is true,
   * only records with coeStatus defined as 'Required' will be considered.
   * @returns first disbursement schedule, if any.
   */
  async getFirstDisbursementScheduleByApplication(
    applicationId: number,
    onlyPendingCOE?: boolean,
  ): Promise<DisbursementSchedule> {
    const query = this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.coeStatus",
        "disbursementSchedule.coeDeniedOtherDesc",
        "coeDeniedReason.id",
        "coeDeniedReason.reason",
        "studentAssessment.id",
        "application.id",
        "application.applicationStatus",
      ])
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("disbursementSchedule.coeDeniedReason", "coeDeniedReason")
      .where("studentAssessment.id = currentAssessment.id")
      .andWhere("application.applicationStatus IN (:...status)", {
        status: [ApplicationStatus.Enrolment, ApplicationStatus.Completed],
      })
      .andWhere("application.id = :applicationId", {
        applicationId: applicationId,
      });

    if (onlyPendingCOE) {
      query.andWhere("disbursementSchedule.coeStatus = :required", {
        required: COEStatus.required,
      });
    }

    query.orderBy("disbursementSchedule.disbursementDate").limit(1);
    return query.getOne();
  }

  /**
   * On COE Approval, update disbursement schedule with document number and
   * COE related columns. Update the Application status to completed, if it is first COE.
   * The update to Application and Disbursement schedule happens in single transaction.
   * @param disbursementScheduleId disbursement schedule Id.
   * @param userId User updating the confirmation of enrollment.
   * @param applicationId application Id.
   * @param applicationStatus application status of the disbursed application.
   * @param tuitionRemittanceRequestedAmount tuition remittance amount requested by the institution.
   */
  private async updateDisbursementAndApplicationCOEApproval(
    disbursementScheduleId: number,
    userId: number,
    applicationId: number,
    applicationStatus: ApplicationStatus,
    tuitionRemittanceRequestedAmount: number,
    enrolmentConfirmationDate?: Date,
  ): Promise<void> {
    const documentNumber = await this.getNextDocumentNumber();
    const auditUser = { id: userId } as User;
    const coeConfirmationDate = enrolmentConfirmationDate ?? new Date();

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager
        .getRepository(DisbursementSchedule)
        .createQueryBuilder()
        .update(DisbursementSchedule)
        .set({
          documentNumber: documentNumber,
          coeStatus: COEStatus.completed,
          coeUpdatedBy: auditUser,
          coeUpdatedAt: coeConfirmationDate,
          modifier: auditUser,
          updatedAt: coeConfirmationDate,
          tuitionRemittanceRequestedAmount: tuitionRemittanceRequestedAmount,
        })
        .where("id = :disbursementScheduleId", { disbursementScheduleId })
        .execute();

      if (applicationStatus === ApplicationStatus.Enrolment) {
        await transactionalEntityManager
          .getRepository(Application)
          .createQueryBuilder()
          .update(Application)
          .set({
            applicationStatus: ApplicationStatus.Completed,
            modifier: auditUser,
            updatedAt: coeConfirmationDate,
          })
          .where("id = :applicationId", { applicationId })
          .execute();
      }
      // Create a student notification when COE is confirmed.
      await this.createNotificationForDisbursementUpdate(
        disbursementScheduleId,
        userId,
        transactionalEntityManager,
      );
    });
  }

  /**
   * Create institution confirm COE notification to notify student
   * when institution confirms a COE to their application.
   * @param disbursementScheduleId updated disbursement schedule.
   * @param auditUserId user who creates notification.
   * @param transactionalEntityManager entity manager to execute in transaction.
   */
  async createNotificationForDisbursementUpdate(
    disbursementScheduleId: number,
    auditUserId: number,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    const disbursement = await transactionalEntityManager
      .getRepository(DisbursementSchedule)
      .findOne({
        select: {
          id: true,
          studentAssessment: {
            id: true,
            application: {
              id: true,
              student: {
                id: true,
                user: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        relations: {
          studentAssessment: { application: { student: { user: true } } },
        },
        where: { id: disbursementScheduleId },
      });

    const studentUser = disbursement.studentAssessment.application.student.user;
    await this.notificationActionsService.saveInstitutionCompletesCOENotification(
      {
        givenNames: studentUser.firstName,
        lastName: studentUser.lastName,
        toAddress: studentUser.email,
        userId: studentUser.id,
      },
      auditUserId,
      transactionalEntityManager,
    );
  }

  /**
   * Decline COE for a disbursement schedule.
   ** Note: If an application has 2 COEs, and if the first COE is rejected then 2nd COE is implicitly rejected.
   * @param disbursementScheduleId disbursement schedule id to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param declinedReason COE declined reason details.
   * - `coeDeniedReasonId` Denied reason id.
   * - `otherReasonDesc` Other reason if the COE decline reason is other.
   * @param otherReasonDesc result of the update operation.
   */
  private async updateCOEToDeclined(
    disbursementScheduleId: number,
    auditUserId: number,
    declinedReason: { coeDeniedReasonId: number; otherReasonDesc?: string },
  ): Promise<UpdateResult> {
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const updateResult = await transactionalEntityManager
          .getRepository(DisbursementSchedule)
          .createQueryBuilder()
          .update(DisbursementSchedule)
          .set({
            coeStatus: COEStatus.declined,
            coeUpdatedBy: auditUser,
            coeUpdatedAt: now,
            coeDeniedReason: { id: declinedReason.coeDeniedReasonId },
            coeDeniedOtherDesc: declinedReason.otherReasonDesc,
            modifier: auditUser,
            updatedAt: now,
          })
          .where("id = :disbursementScheduleId", { disbursementScheduleId })
          .andWhere("coeStatus = :required", { required: COEStatus.required })
          .execute();

        if (updateResult.affected !== 1) {
          throw new Error(
            `While updating COE status to '${COEStatus.declined}' the number of affected row was bigger than the expected one. Expected 1 received ${updateResult.affected}`,
          );
        }

        // Create a student notification when COE is confirmed.
        await this.createNotificationForDisbursementUpdate(
          disbursementScheduleId,
          auditUserId,
          transactionalEntityManager,
        );

        return updateResult;
      },
    );
  }

  /**
   * Approve confirmation of enrollment(COE).
   * An application can have up to two COEs based on the disbursement schedule,
   * hence the COE approval happens twice for application with more than once disbursement.
   * Irrespective of number of COEs to be approved, application status is set to complete
   * on first COE approval.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param auditUserId user who confirms enrollment.
   * @param tuitionRemittance tuition remittance amount.
   * @param options Confirm COE options.
   * - `locationId` location id of the application.
   * - `allowOutsideCOEApprovalPeriod` allow COEs which are outside the valid COE confirmation period to be confirmed..
   * - `enrolmentConfirmationDate` date of enrolment confirmation.
   * - `applicationNumber` application number of the enrolment.
   */
  async confirmEnrollment(
    disbursementScheduleId: number,
    auditUserId: number,
    tuitionRemittance: number,
    options?: {
      locationId?: number;
      allowOutsideCOEApprovalPeriod?: boolean;
      enrolmentConfirmationDate?: Date;
      applicationNumber?: string;
    },
  ): Promise<void> {
    // Get the disbursement and application summary for COE.
    const disbursementSchedule =
      await this.getDisbursementAndApplicationSummary(
        disbursementScheduleId,
        options?.locationId,
      );

    if (!disbursementSchedule) {
      throw new CustomNamedError("Enrolment not found.", ENROLMENT_NOT_FOUND);
    }

    const application = disbursementSchedule.studentAssessment.application;

    if (
      options?.applicationNumber &&
      options?.applicationNumber !== application.applicationNumber
    ) {
      throw new CustomNamedError(
        "Enrolment for the given application not found.",
        ENROLMENT_NOT_FOUND,
      );
    }

    if (disbursementSchedule.coeStatus !== COEStatus.required) {
      throw new CustomNamedError(
        "Enrolment already completed and can neither be confirmed nor declined",
        ENROLMENT_ALREADY_COMPLETED,
      );
    }

    if (
      ![ApplicationStatus.Enrolment, ApplicationStatus.Completed].includes(
        disbursementSchedule.studentAssessment.application.applicationStatus,
      )
    ) {
      throw new CustomNamedError(
        "Enrolment cannot be confirmed as application is not in a valid status.",
        ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }
    if (!options?.allowOutsideCOEApprovalPeriod) {
      const approvalPeriodStatus = this.getCOEApprovalPeriodStatus(
        disbursementSchedule.disbursementDate,
        disbursementSchedule.studentAssessment.application.currentAssessment
          .offering.studyEndDate,
        options.enrolmentConfirmationDate,
      );
      if (
        approvalPeriodStatus !== COEApprovalPeriodStatus.WithinApprovalPeriod
      ) {
        throw new CustomNamedError(
          "The enrolment cannot be confirmed as enrolment confirmation date is not within the valid approval period.",
          ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD,
        );
      }
    }

    const firstOutstandingDisbursement =
      await this.getFirstDisbursementScheduleByApplication(
        disbursementSchedule.studentAssessment.application.id,
        true,
      );

    if (disbursementSchedule.id !== firstOutstandingDisbursement.id) {
      throw new CustomNamedError(
        "First disbursement(COE) not complete. Please complete the first disbursement.",
        FIRST_COE_NOT_COMPLETE,
      );
    }

    // If no tuition remittance is set then, it is defaulted to 0.
    // This happens when ministry confirms COE.
    const tuitionRemittanceAmount = tuitionRemittance ?? 0;

    // Validate tuition remittance amount.
    await this.validateTuitionRemittance(
      tuitionRemittanceAmount,
      disbursementSchedule.id,
    );

    await this.updateDisbursementAndApplicationCOEApproval(
      disbursementScheduleId,
      auditUserId,
      disbursementSchedule.studentAssessment.application.id,
      disbursementSchedule.studentAssessment.application.applicationStatus,
      tuitionRemittanceAmount,
      options?.enrolmentConfirmationDate,
    );
  }

  /**
   * Decline the enrolment of an application.
   * @param disbursementScheduleId disbursement schedule id.
   * @param auditUserId user who confirms enrollment.
   * @param declineReason reason for declining the enrolment.
   * @param options decline enrolment options.
   * - `locationId` location id of the application.
   * - `applicationNumber` application number of the enrolment.
   */
  async declineEnrolment(
    disbursementScheduleId: number,
    auditUserId: number,
    declineReason: { coeDenyReasonId: number; otherReasonDesc?: string },
    options: {
      locationId?: number;
      applicationNumber?: string;
    },
  ): Promise<void> {
    const disbursementSchedule =
      await this.getDisbursementAndApplicationSummary(
        disbursementScheduleId,
        options?.locationId,
      );

    if (!disbursementSchedule) {
      throw new CustomNamedError("Enrolment not found.", ENROLMENT_NOT_FOUND);
    }

    const application = disbursementSchedule.studentAssessment.application;

    if (
      options?.applicationNumber &&
      options?.applicationNumber !== application.applicationNumber
    ) {
      throw new CustomNamedError(
        "Enrolment for the given application not found.",
        ENROLMENT_NOT_FOUND,
      );
    }

    if (disbursementSchedule.coeStatus !== COEStatus.required) {
      throw new CustomNamedError(
        "Enrolment already completed and can neither be confirmed nor declined.",
        ENROLMENT_ALREADY_COMPLETED,
      );
    }

    if (
      ![ApplicationStatus.Enrolment, ApplicationStatus.Completed].includes(
        disbursementSchedule.studentAssessment.application.applicationStatus,
      )
    ) {
      throw new CustomNamedError(
        "Enrolment cannot be declined as application is not in a valid status.",
        ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }

    await this.updateCOEToDeclined(disbursementSchedule.id, auditUserId, {
      coeDeniedReasonId: declineReason.coeDenyReasonId,
      otherReasonDesc: declineReason.otherReasonDesc,
    });
  }

  /**
   * Validate Institution Users to request tuition remittance at the time
   * of confirming enrolment, not to exceed the lesser than both
   * (Actual tuition + Program related costs) and (Canada grants + Canada Loan + BC Loan).
   * @param tuitionRemittanceAmount tuition remittance submitted by institution.
   * @param disbursementScheduleId disbursement schedule id.
   * @throws UnprocessableEntityException.
   */
  private async validateTuitionRemittance(
    tuitionRemittanceAmount: number,
    disbursementScheduleId: number,
  ): Promise<void> {
    // If the tuition remittance amount is set to 0, then skip validation.
    if (!tuitionRemittanceAmount) {
      return;
    }

    const maxTuitionAllowed =
      await this.confirmationOfEnrollmentService.getEstimatedMaxTuitionRemittance(
        disbursementScheduleId,
      );

    if (tuitionRemittanceAmount > maxTuitionAllowed) {
      throw new CustomNamedError(
        "Tuition amount provided should be lesser than both (Actual tuition + Program related costs) and (Canada grants + Canada Loan + BC Loan).",
        INVALID_TUITION_REMITTANCE_AMOUNT,
      );
    }
  }

  /**
   * Generates the next document number to be associated
   * with a disbursement.
   * @returns sequence number for disbursement document number.
   */
  private async getNextDocumentNumber(): Promise<number> {
    let nextDocumentNumber: number;
    await this.sequenceService.consumeNextSequence(
      DISBURSEMENT_DOCUMENT_NUMBER_SEQUENCE_GROUP,
      async (nextSequenceNumber) => {
        nextDocumentNumber = nextSequenceNumber;
      },
    );
    return nextDocumentNumber;
  }
}
