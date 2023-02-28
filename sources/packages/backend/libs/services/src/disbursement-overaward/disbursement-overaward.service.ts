import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  Student,
  User,
} from "@sims/sims-db";
import {
  AwardOverawardBalance,
  StudentOverawardBalance,
} from "./disbursement-overaward.models";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementOverawardService {
  constructor(
    @InjectRepository(DisbursementOveraward)
    private readonly disbursementOverawardRepo: Repository<DisbursementOveraward>,
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
   * Adds a legacy overaward value to disbursement overawards table.
   * @param overawards disbursement overaward array to be saved.
   * @param entityManager entity manager used to perform the query.
   */
  async addLegacyOverawards(
    overawards: DisbursementOveraward[],
    entityManager?: EntityManager,
  ): Promise<void> {
    const repo =
      entityManager?.getRepository(DisbursementOveraward) ??
      this.disbursementOverawardRepo;
    await repo.insert(overawards);
  }

  /**
   * Get all overawards which belong to a student.
   * @param studentId student.
   * @returns overaward details of a student.
   */
  async getOverawardsByStudent(
    studentId: number,
  ): Promise<DisbursementOveraward[]> {
    return this.disbursementOverawardRepo.find({
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
      relations: {
        creator: true,
        studentAssessment: { application: true },
      },
      where: {
        student: { id: studentId },
      },
    });
  }

  /**
   * Add a manual overaward.
   * @param awardValueCode award value code.
   * @param overawardValue overaward deducted value.
   * @param studentId student for whom overaward is deducted.
   * @param auditUserId user who added overaward deduction.
   * @returns overaward record created.
   */
  async addManualOveraward(
    awardValueCode: string,
    overawardValue: number,
    studentId: number,
    auditUserId: number,
  ): Promise<DisbursementOveraward> {
    const overawardManualRecord = new DisbursementOveraward();
    overawardManualRecord.creator = { id: auditUserId } as User;
    overawardManualRecord.disbursementValueCode = awardValueCode;
    overawardManualRecord.overawardValue = overawardValue;
    overawardManualRecord.originType =
      DisbursementOverawardOriginType.ManualRecord;
    overawardManualRecord.student = { id: studentId } as Student;
    return this.disbursementOverawardRepo.save(overawardManualRecord);
  }
}
