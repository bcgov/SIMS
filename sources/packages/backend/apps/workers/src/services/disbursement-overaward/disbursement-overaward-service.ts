import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { RecordDataModelService, DisbursementOveraward } from "@sims/sims-db";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementOverawardService extends RecordDataModelService<DisbursementOveraward> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(DisbursementOveraward));
  }

  /**
   * Sum the total overawards per value code (e.g. CSLF, BCSL) for the student.
   * @param studentId student to get the balance.
   * @param entityManager used to execute the queries in the same transaction.
   * @returns
   */
  async getOverawardBalance(
    studentId: number,
    entityManager: EntityManager,
  ): Promise<Record<string, number>> {
    const totalAwardsPerValueCodes = await entityManager
      .getRepository(DisbursementOveraward)
      .createQueryBuilder("disbursementOveraward")
      .select("disbursementOveraward.disbursementValueCode", "valueCode")
      .addSelect("SUM(disbursementOveraward.overawardValue)", "total")
      .where("disbursementOveraward.student.id = :studentId", { studentId })
      .groupBy("disbursementOveraward.disbursementValueCode")
      .getRawMany<{ valueCode: string; total: number }>();
    const result: Record<string, number> = {};
    for (const totalAward of totalAwardsPerValueCodes) {
      result[totalAward.valueCode] = +totalAward.total;
    }
    return result;
  }
}
