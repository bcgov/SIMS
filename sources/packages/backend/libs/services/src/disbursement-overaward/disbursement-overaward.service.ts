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
   * @param externalEntityManager used to execute the queries in the same transaction.
   * @returns the sum of the overawards grouped by the award type and them by
   * the student id.
   */
  async getOverawardBalance(
    studentIds: number[],
    externalEntityManager?: EntityManager,
  ): Promise<StudentOverawardBalance> {
    const repository =
      externalEntityManager?.getRepository(DisbursementOveraward) ?? this.repo;
    // This query supports up to 65000 students.
    const distinctStudentIds = [...new Set(studentIds)];
    const totalAwards = await repository
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

  /**
   * Get all overawards which belong to a student.
   * @param studentId student.
   * @returns overaward details of a student.
   */
  async getOverawardsByStudent(
    studentId: number,
  ): Promise<DisbursementOveraward[]> {
    return this.repo.find({
      select: {
        createdAt: true,
        originType: true,
        overawardValue: true,
        disbursementValueCode: true,
        creator: { firstName: true, lastName: true },
        studentAssessment: {
          id: true,
          application: { applicationNumber: true },
          triggerType: true,
        },
      },
      where: {
        student: { id: studentId },
      },
      relations: {
        creator: true,
        studentAssessment: { application: true },
      },
    });
  }
}
