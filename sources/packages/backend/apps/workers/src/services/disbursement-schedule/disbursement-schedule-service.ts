import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, In, Repository } from "typeorm";
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
      },
      relations: {
        application: {
          student: true,
        },
        disbursementSchedules: true,
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
      // Step 1
      // Get disbursed values to know the amount that the student already payed.
      // Get pending values to be cancelled.
      const currentDisbursements = await this.getDisbursementsForOverawards(
        assessment.application.applicationNumber,
        transactionEntityManager,
      );
      // Step 2
      // Cancel all pending disbursements.
      // Rollback non-payed overawards. Add possible overawards (present in pending records)
      // back to the disbursement overawards table.
      await this.cancelPendingOverawards(
        currentDisbursements,
        transactionEntityManager,
      );

      await this.createOverawardReverseRecords(
        assessment.application.applicationNumber,
        transactionEntityManager,
      );

      // Step 3
      // Get the student current overaward balance.
      // !This must be executed after the step 2 (rollback non-payed overawards) to ensure that all
      // !values are present in the disbursement overaward table.
      const totalOverawards =
        await this.disbursementOverawardService.getOverawardBalance(
          assessment.application.student.id,
          transactionEntityManager,
        );
      // Step 4
      // Sum total disbursed values per loan type (Federal or Provincial).
      const totalAlreadyDisbursedValues =
        this.sumDisbursedValuesPerValueCode(currentDisbursements);
      // Step final
      // Save the disbursements to DB with the adjusted overaward values.
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

      // Do the magic :D
      await this.applyOverawards(
        assessment.application.student.id,
        disbursementSchedules,
        totalOverawards,
        totalAlreadyDisbursedValues,
        transactionEntityManager,
      );

      // Persist overaward changes.
      await studentAssessmentRepo.save(assessment);

      return assessment.disbursementSchedules;
    });
  }

  /**
   * Get disbursement schedules values that are either pending or were already disbursed.
   * All possible versions of the same application will be considered, including overridden ones.
   * For instance, if a disbursement schedule was ever marked as disbursed it will matter for
   * overaward calculations.
   * @param applicationNumber application number to have the disbursements retrieved.
   * @param entityManager used to execute the queries in the same transaction.
   * @returns disbursement schedules relevant to overaward calculation.
   */
  private async getDisbursementsForOverawards(
    applicationNumber: string,
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
          application: { applicationNumber },
        },
        disbursementScheduleStatus: In([
          DisbursementScheduleStatus.Pending,
          DisbursementScheduleStatus.Sent,
        ]),
        disbursementValues: {
          valueType: In([
            DisbursementValueType.CanadaLoan,
            DisbursementValueType.BCLoan,
          ]),
        },
      },
    });
  }

  private async createOverawardReverseRecords(
    applicationNumber: string,
    entityManager: EntityManager,
  ): Promise<void> {
    const disbursementOverawardRepo = entityManager.getRepository(
      DisbursementOveraward,
    );
    const applicationOverawards = await disbursementOverawardRepo.find({
      select: {
        id: true,
        student: {
          id: true,
        },
        disbursementSchedule: {
          id: true,
        },
        overawardValue: true,
        disbursementValueCode: true,
      },
      relations: {
        student: true,
        disbursementSchedule: true,
      },
      where: {
        disbursementSchedule: {
          studentAssessment: {
            application: {
              applicationNumber,
            },
          },
        },
      },
    });
    const reverseOverawardsRecords = applicationOverawards.map((overaward) => ({
      disbursementSchedule: overaward.disbursementSchedule,
      student: overaward.student,
      disbursementValueCode: overaward.disbursementValueCode,
      overawardValue: (+overaward.overawardValue * -1).toString(),
      originType: DisbursementOverawardOriginType.CancelledDisbursement,
    }));
    await entityManager
      .getRepository(DisbursementOveraward)
      .insert(reverseOverawardsRecords);
  }

  /**
   * Cancel all pending disbursements and, if there is any overaward value
   * present, add it back to the disbursement overaward table.
   * An overaward value that was never sent (disbursed) is not
   * considered as payed and must be added back to the overaward table for history
   * and also to be part of the sum to determined the total overaward for the
   * reassessment.
   * @param disbursementSchedules all disbursements schedules for one particular
   * application including the overwritten ones.
   * @param entityManager used to execute the queries in the same transaction.
   */
  private async cancelPendingOverawards(
    disbursementSchedules: DisbursementSchedule[],
    entityManager: EntityManager,
  ) {
    const pendingDisbursements = disbursementSchedules.filter(
      (disbursementSchedule) =>
        disbursementSchedule.disbursementScheduleStatus ===
        DisbursementScheduleStatus.Pending,
    );
    const rollbackOverawards: QueryDeepPartialEntity<DisbursementOveraward>[] =
      [];
    for (const pendingDisbursement of pendingDisbursements) {
      pendingDisbursement.disbursementScheduleStatus =
        DisbursementScheduleStatus.Cancelled;
      for (const pendingDisbursementValue of pendingDisbursement.disbursementValues) {
        if (+pendingDisbursementValue.overawardAmountSubtracted > 0) {
          rollbackOverawards.push({
            disbursementSchedule: pendingDisbursement,
            student: pendingDisbursement.studentAssessment.application.student,
            disbursementValueCode: pendingDisbursementValue.valueCode,
            overawardValue: pendingDisbursementValue.overawardAmountSubtracted,
            originType: DisbursementOverawardOriginType.CancelledDisbursement,
          });
        }
      }
    }
    await entityManager
      .getRepository(DisbursementOveraward)
      .insert(rollbackOverawards);
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

  async applyOverawards(
    studentId: number,
    disbursementSchedules: DisbursementSchedule[],
    totalOverawards: Record<string, number>,
    totalAlreadyDisbursedValues: Record<string, number>,
    entityManager: EntityManager,
  ) {
    const disbursementOverawardRepo = entityManager.getRepository(
      DisbursementOveraward,
    );

    const loanAwards = disbursementSchedules
      .flatMap(
        (disbursementSchedule) => disbursementSchedule.disbursementValues,
      )
      .filter((disbursementValue) =>
        LOAN_TYPES.includes(disbursementValue.valueType),
      );
    // Loans can be present multiple times in one or more disbursements.
    // Get only the distinct value codes present on this disbursement.
    const distinctValueCodes = [
      ...loanAwards.map((loanAward) => loanAward.valueCode),
    ];

    for (const valueCode of distinctValueCodes) {
      // Checks if the loan is present in multiple disbursements.
      // Find all the values in all the schedules (expected one or two).
      const loans = loanAwards.filter(
        (loanAward) => loanAward.valueCode === valueCode,
      );
      // Total already received by the student for this award for this application.
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
          disbursementSchedule: disbursementSchedules[0],
          student: { id: studentId } as Student,
          disbursementValueCode: valueCode,
          overawardValue: alreadyDisbursedRemainingStudentDebit.toString(),
          originType: DisbursementOverawardOriginType.Reassessment,
        });
        return;
      }

      // Total owed by the student due to some previous overaward.
      const overawardBalance = totalOverawards[valueCode] ?? 0;
      const remainingOverawardBalance = this.subtractStudentDebit(
        loans,
        overawardBalance,
        "Overaward",
      );
      // If there is some remaining student debit, generate an overaward.
      if (remainingOverawardBalance) {
        await disbursementOverawardRepo.insert({
          disbursementSchedule: disbursementSchedules[0],
          student: { id: studentId } as Student,
          disbursementValueCode: valueCode,
          overawardValue: (
            remainingOverawardBalance - overawardBalance
          ).toString(),
          originType: DisbursementOverawardOriginType.Reassessment,
        });
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
}
