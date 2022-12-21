import { Injectable } from "@nestjs/common";
import { RecordDataModelService, Student, User } from "@sims/sims-db";
import { getUTCNow } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { DataSource } from "typeorm";

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
   * Update the PD Sent Date
   * @param studentId student who's PD status is to be updated.
   * @param auditUser user who is making the changes.
   * @returns Student who's PD sent date is updated.
   */
  async updatePDSentDate(studentId: number, auditUser: User): Promise<Student> {
    // get the Student Object
    const studentToUpdate = await this.repo.findOneOrFail({
      where: { id: studentId },
    });
    if (studentToUpdate) {
      const now = new Date();
      studentToUpdate.studentPDSentAt = now;
      studentToUpdate.modifier = auditUser;
      studentToUpdate.updatedAt = now;
      return this.repo.save(studentToUpdate);
    }
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

  @InjectLogger()
  logger: LoggerService;
}
