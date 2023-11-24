import { ECertProcessStep } from "../e-cert-processing-steps/e-cert-steps-models";
import { DataSource } from "typeorm";
import { ProcessSummary } from "@sims/utilities/logger";
import { DisbursementSchedule } from "@sims/sims-db";
import { processInParallel } from "@sims/utilities";

interface GroupedDisbursementPerStudent {
  [studentId: number]: DisbursementSchedule[];
}

export abstract class ECertCalculationProcess {
  constructor(private readonly dataSource: DataSource) {}

  protected abstract getDisbursements(): Promise<DisbursementSchedule[]>;

  protected abstract calculationSteps(): ECertProcessStep[];

  async executeCalculations(log: ProcessSummary): Promise<void> {
    log.info(`Processing disbursement(s).`);
    const disbursements = await this.getDisbursements();
    const disbursementsPerStudent =
      this.getGroupedDisbursementsPerStudent(disbursements);
    log.info(
      `Found ${disbursements.length} eligible disbursement(s) for ${
        Object.keys(disbursementsPerStudent).length
      } student(s).`,
    );
    // Identify the distinct students to be processed in parallel.
    const uniqueStudentIds = Object.keys(disbursementsPerStudent);
    await processInParallel(
      (uniqueStudentId: string) =>
        this.calculateDisbursementsForStudent(
          disbursementsPerStudent[uniqueStudentId],
          log,
        ),
      uniqueStudentIds,
    );
  }

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

  private async calculateDisbursementsForStudent(
    groupedDisbursement: DisbursementSchedule[],
    parentLog: ProcessSummary,
  ): Promise<void> {
    const steps = this.calculationSteps();
    // Ensure that disbursements for the same student will be processed
    // sequentialy since one disbursement may affect student account data like
    // overawards balance and maximums, where a second disbursement should take
    // those updated data into consideration.
    for (const disbursement of groupedDisbursement) {
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
