import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  SINValidation,
  Student,
  User,
} from "@sims/sims-db";
import { DataSource } from "typeorm";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";

@Injectable()
export class StudentService extends RecordDataModelService<Student> {
  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(Student));
    this.logger.log("[Created]");
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
   * Gets all the students applied for PD.
   * @returns Students applied for PD.
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
   * Uses the user id to identify a student that must have his
   * SIN validation active record updated.
   * @param studentId Student who's SIN validation is to be updated.
   * @param sinValidation SIN validation record to have the
   * relationship created with the student.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns updated student.
   */
  async updateSINValidationByStudentId(
    studentId: number,
    sinValidation: SINValidation,
    auditUserId: number,
  ): Promise<Student> {
    const studentToUpdate = await this.repo
      .createQueryBuilder("student")
      .select("student.id")
      .where("student.id = :studentId", { studentId })
      .getOne();
    studentToUpdate.modifier = { id: auditUserId } as User;
    studentToUpdate.sinValidation = sinValidation;
    return this.repo.save(studentToUpdate);
  }

  @InjectLogger()
  logger: LoggerService;
}
