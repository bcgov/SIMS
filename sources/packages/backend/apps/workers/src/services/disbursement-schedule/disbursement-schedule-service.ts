import { Injectable } from "@nestjs/common";
import {
  DataSource,
  EntityManager,
  In,
  IsNull,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
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
} from "@sims/sims-db";
import {
  DisbursementSaveModel,
  DisbursementScheduleValue,
} from "./disbursement-schedule.models";
import { CustomNamedError } from "@sims/utilities";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  DISBURSEMENT_SCHEDULES_ALREADY_CREATED,
} from "../../constants";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { DisbursementOverawardService } from "..";
import { SystemUsersService } from "@sims/services/system-users/system-users.service";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  private readonly assessmentRepo: Repository<StudentAssessment>;
  constructor(
    private readonly dataSource: DataSource,
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super(dataSource.getRepository(DisbursementSchedule));
    this.assessmentRepo = dataSource.getRepository(StudentAssessment);
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
    const assessment = await this.getStudentAssessment(assessmentId);

    return this.dataSource.transaction(async (transactionEntityManager) => {
      // Rollback overawards from the current and future applications.
      await this.rollbackOverawards(
        assessment.application.student.id,
        assessment.offering.studyStartDate,
        transactionEntityManager,
      );
      // Get already sent (disbursed) values to know the amount that the student already received.
      const currentDisbursements = await this.getDisbursementsForOverawards(
        [assessment.application.applicationNumber],
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
        newDisbursement.disbursementDate = disbursement.disbursementDate;
        newDisbursement.negotiatedExpiryDate =
          disbursement.negotiatedExpiryDate;
        newDisbursement.disbursementValues = disbursement.disbursements.map(
          (disbursementValue) => {
            const newValue = new DisbursementValue();
            newValue.valueType = disbursementValue.valueType;
            newValue.valueCode = disbursementValue.valueCode;
            newValue.valueAmount = disbursementValue.valueAmount.toString();
            return newValue;
          },
        );
        disbursementSchedules.push(newDisbursement);
      }
      assessment.disbursementSchedules = disbursementSchedules;
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
      // Persist changes for grants and loans.
      await studentAssessmentRepo.save(assessment);

      return assessment.disbursementSchedules;
    });
  }

  /**
   * Get the student assessment information needed to process
   * the disbursements received to be saved.
   * @param assessmentId student assessment id.
   * @returns student assessment information.
   */
  private async getStudentAssessment(
    assessmentId: number,
  ): Promise<StudentAssessment> {
    const assessment = await this.assessmentRepo.findOne({
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
   * Rollback overawards from the current and future applications.
   * Past pending assessment will not be impacted.
   * @param studentId student id.
   * @param offeringStartDate offering start date used as a reference
   * to find all applications in the future.
   * @param entityManager used to execute the commands in the same transaction.
   */
  async rollbackOverawards(
    studentId: number,
    offeringStartDate: string,
    entityManager: EntityManager,
  ): Promise<void> {
    // Submitted applications are not allowed to have overlaps what makes possible
    // to use the offering start date to order them.
    // !Please note that, when doing local development and using
    // !BYPASS_APPLICATION_SUBMIT_VALIDATIONS=true the application can be created !with overlaps,
    // !which is not a problem unless they have the same offering start date.
    const applicationsToRollback = await entityManager
      .getRepository(Application)
      .find({
        select: { applicationNumber: true },
        where: {
          student: { id: studentId },
          currentAssessment: {
            offering: { studyStartDate: MoreThanOrEqual(offeringStartDate) },
          },
        },
      });
    const applicationNumbers = applicationsToRollback.map(
      (application) => application.applicationNumber,
    );

    await Promise.all([
      this.deleteOverawardRecords(applicationNumbers, entityManager),
      this.cancelPendingOverawards(applicationNumbers, entityManager),
    ]);
  }

  /**
   * Get disbursement schedules values that are either pending or were already disbursed.
   * All possible versions of the same application will be considered, including overridden ones.
   * For instance, if a disbursement schedule was ever marked as disbursed it will matter for
   * overaward calculations.
   * @param applicationNumbers application number to have the disbursements retrieved.
   * @param entityManager used to execute the commands in the same transaction.
   * @returns disbursement schedules relevant to overaward calculation.
   */
  private async getDisbursementsForOverawards(
    applicationNumbers: string[],
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
          application: { applicationNumber: In(applicationNumbers) },
        },
        disbursementScheduleStatus: status,
      },
    });
  }

  /**
   * Soft delete overawards records generated from reassessments and
   * not related directly to any award. Overawards associated with some
   * award must be rolled back only if the award is still on pending
   * and this is taken care in a separated process.
   * @param applicationNumbers application number to be rolled back.
   * @param entityManager
   * @returns
   */
  private async deleteOverawardRecords(
    applicationNumbers: string[],
    entityManager: EntityManager,
  ): Promise<void> {
    const disbursementOverawardRepo = entityManager.getRepository(
      DisbursementOveraward,
    );
    const overawardsToDelete = await disbursementOverawardRepo.find({
      select: { id: true },
      where: {
        // Only delete overawards not related to awards (disbursement_schedule_is IS NULL).
        // Overawards associated with some award must be rolled back only if the
        // award is still on pending and this is taken care in a separated process.
        disbursementSchedule: {
          id: IsNull(),
        },
        studentAssessment: {
          application: {
            applicationNumber: In(applicationNumbers),
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
   * Cancel all pending disbursements and, if there is any overaward value
   * present, add it back to the disbursement overaward table.
   * An overaward value that was never sent (disbursed) is not
   * considered as payed and must be added back to the overaward table for history
   * and also to be part of the sum to determined the total overaward for the
   * reassessment.
   * @param applicationNumbers application that must have their pending awards cancelled.
   * @param entityManager used to execute the commands in the same transaction.
   */
  private async cancelPendingOverawards(
    applicationNumbers: string[],
    entityManager: EntityManager,
  ) {
    const auditUser = await this.systemUsersService.systemUser();
    // Get all pending awards that must be cancelled.
    const pendingDisbursements = await this.getDisbursementsForOverawards(
      applicationNumbers,
      DisbursementScheduleStatus.Pending,
      entityManager,
    );
    // Accumulate all the inserts that could be possible executed.
    const rollbackOverawards: QueryDeepPartialEntity<DisbursementOveraward>[] =
      [];
    for (const pendingDisbursement of pendingDisbursements) {
      pendingDisbursement.modifier = auditUser;
      pendingDisbursement.disbursementScheduleStatus =
        DisbursementScheduleStatus.Cancelled;
      for (const pendingDisbursementValue of pendingDisbursement.disbursementValues) {
        if (+pendingDisbursementValue.overawardAmountSubtracted) {
          rollbackOverawards.push({
            disbursementSchedule: pendingDisbursement,
            student: pendingDisbursement.studentAssessment.application.student,
            disbursementValueCode: pendingDisbursementValue.valueCode,
            overawardValue: pendingDisbursementValue.overawardAmountSubtracted,
            originType: DisbursementOverawardOriginType.PendingAwardCancelled,
            modifier: auditUser,
          });
        }
      }
    }
    await Promise.all([
      // Save all the pending awards that were changed to cancelled.
      entityManager
        .getRepository(DisbursementSchedule)
        .save(pendingDisbursements),
      // Insert the overawards present in the cancelled awards into the overaward balance.
      entityManager
        .getRepository(DisbursementOveraward)
        .insert(rollbackOverawards),
    ]);
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
        totalPerValueCode[disbursementValue.valueCode] =
          (totalPerValueCode[disbursementValue.valueCode] ?? 0) +
          +disbursementValue.valueAmount;
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
    const grantsAwards = this.getAwardsByAwardType(disbursementSchedules, [
      DisbursementValueType.CanadaGrant,
      DisbursementValueType.BCGrant,
    ]);
    const distinctValueCodes = this.getDistinctValueCodes(grantsAwards);
    for (const valueCode of distinctValueCodes) {
      // Checks if the grant is present in multiple disbursements.
      // Find all the values in all the schedules (expected one or two).
      const grants = grantsAwards.filter(
        (grantAward) => grantAward.disbursementValue.valueCode === valueCode,
      );
      // Total value already received by the student for this grant for this application.
      const alreadyDisbursed = totalAlreadyDisbursedValues[valueCode] ?? 0;
      // Subtract the debit from the current grant in the current assessment.
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
   * !This must be executed after the "rollback non-disbursed overawards" to
   * !ensure that all values are present in the disbursement overaward table.
   * !Intended to process only loans (CanadaLoan/BCLoan)
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
    // Get the student current overaward balance.
    const totalOverawards =
      await this.disbursementOverawardService.getOverawardBalance(
        studentId,
        entityManager,
      );
    const disbursementOverawardRepo = entityManager.getRepository(
      DisbursementOveraward,
    );
    const loanAwards = this.getAwardsByAwardType(disbursementSchedules, [
      DisbursementValueType.CanadaLoan,
      DisbursementValueType.BCLoan,
    ]);
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
      const alreadyDisbursedRemainingStudentDebit = this.subtractStudentDebit(
        loans.map((loan) => loan.disbursementValue),
        alreadyDisbursed,
        "PreviousDisbursement",
      );
      // If there is some remaining student debit, generate an overaward.
      if (alreadyDisbursedRemainingStudentDebit) {
        // There is no more money to be subtracted from this assessment.
        // Insert the remaining student debit into the overaward.
        await disbursementOverawardRepo.insert({
          student: { id: studentId } as Student,
          studentAssessment: { id: assessmentId } as StudentAssessment,
          disbursementValueCode: valueCode,
          overawardValue: alreadyDisbursedRemainingStudentDebit.toString(),
          originType: DisbursementOverawardOriginType.ReassessmentOveraward,
        });
        return;
      }
      // Total owed by the student due to some previous overaward balance.
      const overawardBalance = totalOverawards[valueCode] ?? 0;
      this.subtractStudentDebit(
        loans.map((loan) => loan.disbursementValue),
        overawardBalance,
        "Overaward",
      );
      const overawardsAwardsToInsert = loans
        .filter((loan) => +loan.disbursementValue.overawardAmountSubtracted)
        .map((loan) => ({
          // If there was any overaward generated, subtract it from the overaward balance.
          student: { id: studentId } as Student,
          studentAssessment: { id: assessmentId } as StudentAssessment,
          disbursementSchedule: {
            id: loan.disbursementScheduleId,
          } as DisbursementSchedule,
          disbursementValueCode: valueCode,
          overawardValue: (
            +loan.disbursementValue.overawardAmountSubtracted * -1
          ).toString(),
          originType: DisbursementOverawardOriginType.AwardValueAdjusted,
        }));
      await disbursementOverawardRepo.insert(overawardsAwardsToInsert);
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
        award.valueAmount = (awardValueAmount - studentDebit).toString();
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
        award.valueAmount = "0";
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
    return [...awards.map((award) => award.disbursementValue.valueCode)];
  }
}
