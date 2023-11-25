import { ECertProcessStep } from "../e-cert-processing-steps/e-cert-steps-models";
import { DataSource } from "typeorm";
import { ProcessSummary } from "@sims/utilities/logger";
import { DisbursementSchedule } from "@sims/sims-db";
import { processInParallel } from "@sims/utilities";

/**
 * Disbursements grouped by student to allow parallel processing of students
 * and sequential processing of disbursements for the same student.
 */
interface GroupedDisbursementPerStudent {
  [studentId: number]: DisbursementSchedule[];
}

/**
 * Base process for e-Cert calculations independently of the offering intensity.
 * Both offering intensity will have similar calculation steps and some additional ones.
 */
export abstract class ECertCalculationProcess {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Get all disbursements currently eligible to be part of
   * an e-Cert to have its calculations executed.
   * The returned array of {@link DisbursementSchedule} will be shared across all
   * steps being modified till the {@link DisbursementSchedule} entity model
   * modifications will be saved.
   */
  protected abstract getDisbursements(): Promise<DisbursementSchedule[]>;

  /**
   * Define the steps to be executed and the execution order.
   */
  protected abstract calculationSteps(): ECertProcessStep[];

  /**
   * Execute the calculations for all eligible disbursements.
   * @param log cumulative process log.
   */
  async executeCalculations(log: ProcessSummary): Promise<void> {
    log.info(`Retrieving eligible disbursements(s).`);
    const disbursements = await this.getDisbursements();
    // Group retrieved disbursements per students since a student can
    // potentially have more then one disbursement in the same e-Cert.
    const disbursementsPerStudent =
      this.getGroupedDisbursementsPerStudent(disbursements);
    log.info(
      `Found ${disbursements.length} eligible disbursement(s) for ${
        Object.keys(disbursementsPerStudent).length
      } student(s).`,
    );
    // Identify the distinct students to be processed in parallel.
    const uniqueStudentIds = Object.keys(disbursementsPerStudent);
    // Process students in parallel.
    await processInParallel(
      (uniqueStudentId: string) =>
        this.calculateDisbursementsForStudent(
          disbursementsPerStudent[uniqueStudentId],
          log,
        ),
      uniqueStudentIds,
    );
  }

  /**
   * Group all disbursements per student id.
   * @param disbursements disbursements to be grouped.
   * @returns grouped disbursements.
   */
  private getGroupedDisbursementsPerStudent(
    disbursements: DisbursementSchedule[],
  ): GroupedDisbursementPerStudent {
    return disbursements.reduce(
      (
        group: { [studentId: number]: DisbursementSchedule[] },
        disbursement,
      ) => {
        const studentId = disbursement.studentAssessment.application.student.id;
        if (!group[studentId]) {
          group[studentId] = [];
        }
        group[studentId].push(disbursement);
        return group;
      },
      {},
    );
  }

  /**
   * Execute all the disbursements for a single student sequentially.
   * @param groupedDisbursements all disbursements for a single student.
   * @param parentLog cumulative process log.
   */
  private async calculateDisbursementsForStudent(
    groupedDisbursements: DisbursementSchedule[],
    parentLog: ProcessSummary,
  ): Promise<void> {
    const steps = this.calculationSteps();
    // Ensures that disbursements for the same student will be processed
    // sequentialy since one disbursement may affect student account data like
    // overawards balance and maximums where a second disbursement should take
    // those updated data into consideration.
    for (const disbursement of groupedDisbursements) {
      const disbursementLog = new ProcessSummary();
      parentLog.children(disbursementLog);
      disbursementLog.info(
        `Processing disbursement id ${disbursement.id} scheduled for ${disbursement.disbursementDate}.`,
      );
      await this.dataSource.transaction(async (entityManager) => {
        let stepNumber = 1;
        // Execute all steps sequentially. The order of execution is important since the
        // disbursement data is potentially changed along the steps till it is persisted.
        for (const step of steps) {
          disbursementLog.info(
            `Executing step ${stepNumber++} out of ${steps.length}.`,
          );
          const shouldProceed = await step.executeStep(
            disbursement,
            entityManager,
            disbursementLog,
          );
          if (!shouldProceed) {
            disbursementLog.info(
              "The step determined that the calculation should be interrupted. This disbursement will not be part of the next e-Cert generation.",
            );
            break;
          }
        }
      });
    }
  }
}
