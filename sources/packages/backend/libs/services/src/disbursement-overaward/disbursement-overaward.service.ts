import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  Student,
} from "@sims/sims-db";
import {
  AwardOverawardBalance,
  StudentOverawardBalance,
} from "./disbursement-overaward.models";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemUsersService } from "../system-users/system-users.service";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementOverawardService {
  constructor(
    @InjectRepository(DisbursementOveraward)
    private readonly disbursementOverawardRepo: Repository<DisbursementOveraward>,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Checks if the student has any positive overaward balance for any award.
   * @param studentId student to be checked.
   * @returns true if the student has any positive overaward balance value
   * for any award, otherwise, false.
   */
  async hasOverawardBalance(studentId: number): Promise<boolean> {
    const overawards = await this.getOverawardBalance([studentId]);
    if (!overawards[studentId]) {
      return false;
    }
    return Object.values(overawards[studentId]).some(
      (awardBalance) => awardBalance > 0,
    );
  }

  /**
   * Sum the total overawards per value code (e.g. CSLF, BCSL) for the student.
   * @param studentId student to get the balance.
   * @param entityManager optionally used to execute the queries in the same transaction.
   * @returns the sum of the overawards grouped by the award type and them by
   * the student id.
   */
  async getOverawardBalance(
    studentIds: number[],
    entityManager?: EntityManager,
  ): Promise<StudentOverawardBalance> {
    const repo =
      entityManager?.getRepository(DisbursementOveraward) ??
      this.disbursementOverawardRepo;
    // This query supports up to 65000 students.
    const distinctStudentIds = [...new Set(studentIds)];
    const totalAwards = await repo
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
      result[totalAward.studentId][totalAward.valueCode] = totalAward.total;
    }
    return result;
  }

  /**
   * Adds a manual overaward value to disbursement overawards table.
   * @param studentId id of the student.
   * @param overawardValue overaward value.
   * @param disbursementValueCode disbursement value code.
   * @param entityManager entity manager used to perform the query.
   */
  async addManualOveraward(
    studentId: number,
    overawardValue: number,
    disbursementValueCode: string,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = await this.systemUsersService.systemUser();
    await entityManager.getRepository("DisbursementOveraward").insert({
      student: { id: studentId } as Student,
      disbursementValueCode,
      overawardValue,
      originType: DisbursementOverawardOriginType.ManuallyEntered,
      creator: auditUser,
    } as DisbursementOveraward);
  }
}
