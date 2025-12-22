import { Injectable } from "@nestjs/common";
import { EntityManager, Repository, DataSource } from "typeorm";
import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  NoteType,
  Student,
  User,
} from "@sims/sims-db";
import {
  AwardOverawardBalance,
  StudentOverawardBalance,
} from "./disbursement-overaward.models";
import { InjectRepository } from "@nestjs/typeorm";
import { NoteSharedService } from "../note/note.shared.service";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementOverawardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly noteSharedService: NoteSharedService,
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
      .having("SUM(disbursementOveraward.overawardValue) <> 0")
      // The total is returned from DB as string, need to converted to a number.
      .getRawMany<{ studentId: number; valueCode: string; total: string }>();
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
        originType: true,
        overawardValue: true,
        disbursementValueCode: true,
        studentAssessment: {
          id: true,
          application: { applicationNumber: true },
          triggerType: true,
        },
        addedBy: { firstName: true, lastName: true },
        createdAt: true,
        addedDate: true,
      },
      relations: {
        studentAssessment: { application: true },
        addedBy: true,
      },
      where: {
        student: { id: studentId },
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  /**
   * Add a manual overaward.
   * @param awardValueCode award value code.
   * @param overawardValue overaward deducted value.
   * @param studentId student for whom overaward is deducted.
   * @param overawardNotes notes for the manual overaward.
   * @param auditUserId user who added overaward deduction.
   * @returns overaward record created.
   */
  async addManualOveraward(
    awardValueCode: string,
    overawardValue: number,
    overawardNotes: string,
    studentId: number,
    auditUserId: number,
  ): Promise<DisbursementOveraward> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Create the note for the overaward and associate the note with the student.
      const noteEntity = await this.noteSharedService.createStudentNote(
        studentId,
        NoteType.Overaward,
        overawardNotes,
        auditUserId,
        transactionalEntityManager,
      );

      const auditUser = { id: auditUserId } as User;
      // Save disbursement overaward record.
      const overawardManualRecord = new DisbursementOveraward();
      overawardManualRecord.creator = auditUser;
      overawardManualRecord.disbursementValueCode = awardValueCode;
      overawardManualRecord.overawardValue = overawardValue;
      overawardManualRecord.originType =
        DisbursementOverawardOriginType.ManualRecord;
      overawardManualRecord.student = { id: studentId } as Student;
      overawardManualRecord.overawardNotes = noteEntity;
      overawardManualRecord.addedBy = auditUser;
      overawardManualRecord.addedDate = new Date();
      return transactionalEntityManager
        .getRepository(DisbursementOveraward)
        .save(overawardManualRecord);
    });
  }
}
