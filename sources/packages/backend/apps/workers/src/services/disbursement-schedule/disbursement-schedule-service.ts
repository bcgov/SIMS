import { Injectable } from "@nestjs/common";
import {
  DataSource,
  EntityManager,
  In,
  MoreThanOrEqual,
  Repository,
  UpdateResult,
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
import { Disbursement } from "./disbursement-schedule.models";
import { CustomNamedError } from "@sims/utilities";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  DISBURSEMENT_SCHEDULES_ALREADY_CREATED,
} from "../../constants";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { DisbursementOverawardService } from "..";

const LOAN_TYPES = [
  DisbursementValueType.CanadaLoan,
  DisbursementValueType.BCLoan,
];

const GRANT_TYPES = [
  DisbursementValueType.CanadaGrant,
  DisbursementValueType.BCGrant,
];

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  private readonly assessmentRepo: Repository<StudentAssessment>;
  constructor(
    private readonly dataSource: DataSource,
    private readonly disbursementOverawardService: DisbursementOverawardService,
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
    disbursements: Disbursement[],
  ): Promise<DisbursementSchedule[]> {
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

    return this.dataSource.transaction(async (transactionEntityManager) => {
      // Rollback overawards from the current and future applications.
      await this.rollbackOverawards(
        assessment.application.student.id,
        assessment.offering.studyStartDate,
        transactionEntityManager,
      );
      // Get already disbursed values to know the amount that the student already payed.
      const currentDisbursements = await this.getDisbursementsForOverawards(
        [assessment.application.applicationNumber],
        DisbursementScheduleStatus.Sent,
        transactionEntityManager,
      );
      // Get the student current overaward balance.
      // !This must be executed after the step 2 (rollback non-payed overawards) to ensure that all
      // !values are present in the disbursement overaward table.
      const totalOverawards =
        await this.disbursementOverawardService.getOverawardBalance(
          assessment.application.student.id,
          transactionEntityManager,
        );
      // Sum total disbursed values per award type (Federal or Provincial).
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
      this.applyGrantsAlreadyDisbursedValues(
        disbursementSchedules,
        totalAlreadyDisbursedValues,
      );
      // Adjust the saved loans disbursements with the overawards.
      await this.applyOverawards(
        assessment.id,
        assessment.application.student.id,
        disbursementSchedules,
        totalOverawards,
        totalAlreadyDisbursedValues,
        transactionEntityManager,
      );
      // Persist changes for grants and loans.
      await studentAssessmentRepo.save(assessment);

      return assessment.disbursementSchedules;
    });
  }

  async rollbackOverawards(
    studentId: number,
    offeringStartDate: string,
    entityManager: EntityManager,
  ) {
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
   * @param entityManager used to execute the queries in the same transaction.
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

  private async deleteOverawardRecords(
    applicationNumbers: string[],
    entityManager: EntityManager,
  ): Promise<UpdateResult> {
    return entityManager.getRepository(DisbursementOveraward).softDelete({
      studentAssessment: {
        application: {
          applicationNumber: In(applicationNumbers),
        },
      },
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
   * @param entityManager used to execute the queries in the same transaction.
   */
  private async cancelPendingOverawards(
    applicationNumbers: string[],
    entityManager: EntityManager,
  ) {
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
   * Sum all the disbursed Canada/BC loans (CSLF, CSPT, BCSL).
   * The result object will be as the one in the example below
   * where CSLF and BCSL are the valueCode in the disbursement value.
   * @param disbursementSchedules
   * @returns sum of all the disbursed Canada/BC loans (CSLF, CSPT, BCSL).
   * @example
   * {
   *    CSLF: 5532,
   *    BCSL: 1256
   * }
   */
  sumDisbursedValuesPerValueCode(
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

  async applyGrantsAlreadyDisbursedValues(
    disbursementSchedules: DisbursementSchedule[],
    totalAlreadyDisbursedValues: Record<string, number>,
  ) {
    const grantsAwards = this.getAwardsByAwardType(disbursementSchedules, [
      DisbursementValueType.CanadaGrant,
      DisbursementValueType.BCGrant,
    ]);
    const distinctValueCodes = this.getDistinctValueCodes(grantsAwards);
    for (const valueCode of distinctValueCodes) {
      // Checks if the grant is present in multiple disbursements.
      // Find all the values in all the schedules (expected one or two).
      const grants = grantsAwards.filter(
        (grantAward) => grantAward.valueCode === valueCode,
      );
      // Total value already received by the student for this grant for this application.
      const alreadyDisbursed = totalAlreadyDisbursedValues[valueCode] ?? 0;
      // Subtract the debit from the current grant in the current assessment.
      this.subtractStudentDebit(
        grants,
        alreadyDisbursed,
        "PreviousDisbursement",
      );
      // If there is some remaining student debit it will be just not considered.
    }
  }

  async applyOverawards(
    assessmentId: number,
    studentId: number,
    disbursementSchedules: DisbursementSchedule[],
    totalOverawards: Record<string, number>,
    totalAlreadyDisbursedValues: Record<string, number>,
    entityManager: EntityManager,
  ) {
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
        (loanAward) => loanAward.valueCode === valueCode,
      );
      // Total value already received by the student for this loan for this application.
      const alreadyDisbursed = totalAlreadyDisbursedValues[valueCode] ?? 0;
      // Subtract the debit from the current awards in the current assessment.
      const alreadyDisbursedRemainingStudentDebit = this.subtractStudentDebit(
        loans,
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
      this.subtractStudentDebit(loans, overawardBalance, "Overaward");
      for (const loan of loans) {
        if (+loan.overawardAmountSubtracted) {
          // Find the schedule associated with this award.
          const [relatedDisbursement] = disbursementSchedules
            .flatMap((schedule) => schedule.disbursementValues)
            .filter((disbursementValue) => disbursementValue.id === loan.id);
          // If there was any overaward generated, reduce it from the overaward balance.
          await disbursementOverawardRepo.insert({
            student: { id: studentId } as Student,
            studentAssessment: { id: assessmentId } as StudentAssessment,
            disbursementSchedule: relatedDisbursement,
            disbursementValueCode: valueCode,
            overawardValue: (+loan.overawardAmountSubtracted * -1).toString(),
            originType: DisbursementOverawardOriginType.AwardValueAdjusted,
          });
        }
      }
    }
  }

  subtractStudentDebit(
    awards: DisbursementValue[],
    totalStudentDebit: number,
    subtractOrigin: "Overaward" | "PreviousDisbursement",
  ): number {
    let studentDebit = totalStudentDebit;
    for (let i = 0; i < awards.length; i++) {
      const award = awards[i];
      if (+award.valueAmount >= totalStudentDebit) {
        // Current disbursement value is enough to pay the debit.
        award.valueAmount = (+award.valueAmount - studentDebit).toString();
        if (subtractOrigin === "Overaward") {
          award.overawardAmountSubtracted = studentDebit.toString();
        } else {
          award.disbursedAmountSubtracted = studentDebit.toString();
        }
        studentDebit = 0;
      } else {
        // Current disbursement is not enough to pay the debit.
        // Updates total student debit.
        studentDebit -= +award.valueAmount;
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
   * Get awards by the award type.
   * @param disbursementSchedules schedules with awards to be extracted.
   * @param valueTypes types to be considered.
   * @returns awards of the specified type.
   */
  private getAwardsByAwardType(
    disbursementSchedules: DisbursementSchedule[],
    valueTypes: DisbursementValueType[],
  ): DisbursementValue[] {
    return disbursementSchedules
      .flatMap(
        (disbursementSchedule) => disbursementSchedule.disbursementValues,
      )
      .filter((disbursementValue) =>
        valueTypes.includes(disbursementValue.valueType),
      );
  }

  /**
   * Loans can be present multiple times in one or more disbursements.
   * Get only the distinct value codes present on this disbursement.
   * @param awards awards to retrieve unique codes.
   * @returns unique awards codes.
   */
  private getDistinctValueCodes(awards: DisbursementValue[]) {
    // Loans can be present multiple times in one or more disbursements.
    // Get only the distinct value codes present on this disbursement.
    return [...awards.map((award) => award.valueCode)];
  }
}
