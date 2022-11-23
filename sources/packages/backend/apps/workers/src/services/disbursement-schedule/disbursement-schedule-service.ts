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
} from "@sims/sims-db";
import { Disbursement } from "./disbursement-schedule.models";
import { CustomNamedError } from "@sims/utilities";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  DISBURSEMENT_SCHEDULES_ALREADY_CREATED,
} from "../../constants";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  private readonly assessmentRepo: Repository<StudentAssessment>;
  constructor(private readonly dataSource: DataSource) {
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
        },
        disbursementSchedules: { id: true },
      },
      relations: {
        application: true,
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

    for (const disbursement of disbursements) {
      const newDisbursement = new DisbursementSchedule();
      newDisbursement.disbursementDate = disbursement.disbursementDate;
      newDisbursement.negotiatedExpiryDate = disbursement.negotiatedExpiryDate;
      newDisbursement.disbursementValues = disbursement.disbursements.map(
        (disbursementValue) => {
          const newValue = new DisbursementValue();
          newValue.valueType = disbursementValue.valueType;
          newValue.valueCode = disbursementValue.valueCode;
          newValue.valueAmount = disbursementValue.valueAmount.toString();
          return newValue;
        },
      );
      assessment.disbursementSchedules.push(newDisbursement);
    }

    await this.dataSource.transaction(async (transactionEntityManager) => {
      // Step 1
      // Get disbursed values to know the amount that the student already payed.
      // Get pending values to be cancelled.
      const currentDisbursements = await this.getDisbursementsForOverawards(
        assessment.application.applicationNumber,
        transactionEntityManager,
      );
      // Step 2
      // Cancel pending disbursements.
      // Add possible overawards (present in cancelled record) back to the disbursement_overawards table.
      await this.cancelPendingDisbursements(
        currentDisbursements,
        transactionEntityManager,
      );
      // Step 3
      // Sum total disbursed values per loan type (Federal or Provincial).
      const totalDisbursedValues =
        this.sumDisbursedValuesPerValueCode(currentDisbursements);
    });

    await this.assessmentRepo.save(assessment);
    return assessment.disbursementSchedules;
  }

  /**
   * Sum all the disbursed Canada/BC loans (CSLF, CSPT, BCSL).
   * The result object will be as the one in the example below
   * where CSLF and BCSL are the valueCode in the disbursement value.
   * @example
   * {
   *    CSLF: 5532,
   *    BCSL: 1256
   * }
   * @param disbursementSchedules
   * @returns sum of all the disbursed Canada/BC loans (CSLF, CSPT, BCSL).
   */
  sumDisbursedValuesPerValueCode(
    disbursementSchedules: DisbursementSchedule[],
  ): Record<string, number> {
    const totalPerValueCode: Record<string, number> = {};
    disbursementSchedules
      .filter(
        (disbursementSchedule) =>
          disbursementSchedule.disbursementScheduleStatus ===
          DisbursementScheduleStatus.Disbursed,
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

  async cancelPendingDisbursements(
    disbursementSchedules: DisbursementSchedule[],
    entityManager: EntityManager,
  ) {
    const pendingDisbursementsValues = disbursementSchedules
      .filter(
        (disbursementSchedule) =>
          disbursementSchedule.disbursementScheduleStatus ===
          DisbursementScheduleStatus.Pending,
      )
      .flatMap(
        (disbursementSchedule) => disbursementSchedule.disbursementValues,
      );
    for (const pendingDisbursementValue of pendingDisbursementsValues) {
      console.log("Insert into disbursement_overawards");
      console.log(pendingDisbursementValue);
    }
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
  async getDisbursementsForOverawards(
    applicationNumber: string,
    entityManager: EntityManager,
  ): Promise<DisbursementSchedule[]> {
    const disbursementScheduleRepo =
      entityManager.getRepository(DisbursementSchedule);
    return disbursementScheduleRepo.find({
      select: {
        id: true,
        disbursementValues: {
          valueType: true,
          valueCode: true,
          overaward: true,
        },
      },
      relations: {
        disbursementValues: true,
      },
      where: {
        studentAssessment: {
          application: { applicationNumber },
        },
        disbursementScheduleStatus: In([
          DisbursementScheduleStatus.Pending,
          DisbursementScheduleStatus.Disbursed,
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
}
