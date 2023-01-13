import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { RecordDataModelService, DisbursementOveraward } from "@sims/sims-db";
import {
  AwardOverawardBalance,
  StudentOverawardBalance,
} from "./disbursement-overaward.models";

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
   * @returns the sum of the overawards grouped by the award type and them by
   * the student id.
   */
  async getOverawardBalance(
    studentIds: number[],
    entityManager: EntityManager,
  ): Promise<StudentOverawardBalance> {
    // This query supports up to 65000 students.
    const distinctStudentIds = [...new Set(studentIds)];
    const totalAwards = await entityManager
      .getRepository(DisbursementOveraward)
      .createQueryBuilder("disbursementOveraward")
      .select("student.id", "studentId")
      .addSelect("disbursementOveraward.disbursementValueCode", "valueCode")
      .addSelect("SUM(disbursementOveraward.overawardValue)", "total")
      .innerJoin("disbursementOveraward.student", "student")
      .where("student.id IN (:...studentIds)", {
        studentIds: distinctStudentIds,
      })
      .groupBy("student.id")
      .addGroupBy("disbursementOveraward.disbursementValueCode")
      .getRawMany<{ studentId: number; valueCode: string; total: number }>();
    const result: StudentOverawardBalance = {};
    for (const totalAward of totalAwards) {
      if (!result[totalAward.studentId]) {
        result[totalAward.studentId] = {} as AwardOverawardBalance;
      }
      result[totalAward.studentId][totalAward.valueCode] = +totalAward.total;
    }
    return result;
  }
}
