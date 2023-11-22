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

  async executeCalculations(): Promise<ProcessSummary> {
    const log = new ProcessSummary();
    log.info(`Processing disbursement(s).`);
    const disbursements = await this.getDisbursements();
    const disbursementsPerStudent =
      this.getGroupedDisbursementsPerStudent(disbursements);
    log.info(
      `Found ${disbursements.length} eligible disbursement(s) for ${
        Object.keys(disbursementsPerStudent).length
      } student(s).`,
    );

    const uniqueStudentIds = Object.keys(disbursementsPerStudent);
    await processInParallel(
      (uniqueStudentId: string) =>
        this.calculateDisbursementsForStudent(
          disbursementsPerStudent[uniqueStudentId],
          log,
        ),
      uniqueStudentIds,
    );

    return log;
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
    for (const disbursement of groupedDisbursement) {
      const disbursementLog = new ProcessSummary();
      parentLog.children(disbursementLog);
      disbursementLog.info(
        `Processing disbursement id ${disbursement} scheduled for ${disbursement.disbursementDate}.`,
      );
      await this.dataSource.transaction(async (entityManager) => {
        for (let i = 0; i < steps.length; i++) {
          disbursementLog.info(
            `Executing step ${i + 1} out of ${steps.length}.`,
          );
          steps[i].executeStep(disbursement, entityManager, disbursementLog);
        }
      });
    }
  }
}
