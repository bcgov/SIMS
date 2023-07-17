import { Injectable } from "@nestjs/common";
import {
  DisabilityStatus,
  RecordDataModelService,
  SINValidation,
  Student,
  User,
} from "@sims/sims-db";
import { getUTCNow } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { DataSource, EntityManager, UpdateResult } from "typeorm";

@Injectable()
export class StudentService extends RecordDataModelService<Student> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(Student));
  }

  /**
   * Get all students who applied for permanent disability
   * and waiting for the confirmation from ATBC.
   * @returns students
   */
  async getStudentsAppliedForPD(): Promise<Student[]> {
    return this.repo
      .createQueryBuilder("student")
      .select(["student.id", "sinValidation.id", "sinValidation.sin"])
      .innerJoin("student.sinValidation", "sinValidation")
      .where("student.studentPDSentAt is not null")
      .andWhere("student.studentPDUpdateAt is null")
      .andWhere("student.studentPDVerified is null")
      .getMany();
  }

  /**
   * Update the PD status to requested.
   * @param studentId student who's PD status is to be updated.
   * @param auditUser user who is making the changes.
   * @returns update result.
   */
  async updatePDRequested(
    studentId: number,
    auditUser: User,
  ): Promise<UpdateResult> {
    const now = new Date();
    return this.repo.update(
      { id: studentId },
      {
        studentPDSentAt: now,
        modifier: auditUser,
        updatedAt: now,
        disabilityStatus: DisabilityStatus.Requested,
      },
    );
  }

  /**
   * Update the PD Sent Date
   * @param studentId Student id.
   * @param status PD status.
   * @returns updated student.
   */
  async updatePDStatusNDate(
    studentId: number,
    status: boolean,
  ): Promise<Student> {
    // get the Student Object
    const studentToUpdate = await this.repo.findOneOrFail({
      where: { id: studentId },
    });
    if (studentToUpdate) {
      studentToUpdate.studentPDVerified = status;
      // Date in UTC format
      studentToUpdate.studentPDUpdateAt = getUTCNow();
      return this.repo.save(studentToUpdate);
    }
  }

  /**
   * Get student by Id.
   * @param studentId student id.
   * @returns student.
   */
  async getStudentById(studentId: number): Promise<Student> {
    return this.repo.findOne({
      select: {
        id: true,
        sinValidation: { id: true, sin: true },
        user: { id: true, firstName: true, lastName: true, email: true },
        birthDate: true,
      },
      relations: { sinValidation: true, user: true },
      where: { id: studentId },
    });
  }

  /**
   * Gets all the students that have the SIN validation pending.
   * @returns Students pending SIN validation.
   */
  async getStudentsPendingSinValidation(): Promise<Student[]> {
    return this.repo
      .createQueryBuilder("student")
      .select([
        "student.id",
        "student.birthDate",
        "student.gender",
        "user.firstName",
        "user.lastName",
        "user.id",
        "sinValidation.id",
        "sinValidation.sin",
      ])
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .where("sinValidation.isValidSIN is null")
      .andWhere("sinValidation.dateSent is null")
      .getMany();
  }

  /**
   * Uses the user id to identify a student that must have his
   * SIN validation active record updated.
   * @param studentId Student who's SIN validation is to be updated.
   * @param sinValidation SIN validation record to have the
   * relationship created with the student.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param transactionalEntityManager entity manager to execute in transaction.
   * @returns updated student.
   */
  async updateSINValidationByStudentId(
    studentId: number,
    sinValidation: SINValidation,
    auditUserId: number,
    transactionalEntityManager: EntityManager,
  ): Promise<Student> {
    const studentRepo = transactionalEntityManager.getRepository(Student);
    const studentToUpdate = await studentRepo
      .createQueryBuilder("student")
      .select("student.id")
      .where("student.id = :studentId", { studentId })
      .getOne();
    studentToUpdate.modifier = { id: auditUserId } as User;
    studentToUpdate.sinValidation = sinValidation;
    return studentRepo.save(studentToUpdate);
  }

  @InjectLogger()
  logger: LoggerService;
}
