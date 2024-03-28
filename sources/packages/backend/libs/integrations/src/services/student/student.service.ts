import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DisabilityStatus, SINValidation, Student, User } from "@sims/sims-db";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import {
  DataSource,
  EntityManager,
  Raw,
  Repository,
  UpdateResult,
} from "typeorm";

@Injectable()
export class StudentService {
  constructor(
    dataSource: DataSource,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  /**
   * Update the disability status to requested.
   * @param studentId student who's PD status is to be updated.
   * @param auditUser user who is making the changes.
   * @returns update result.
   */
  async updateDisabilityRequested(
    studentId: number,
    auditUser: User,
  ): Promise<UpdateResult> {
    const now = new Date();
    return this.studentRepo.update(
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
   * Get student by Id.
   * @param studentId student id.
   * @returns student.
   */
  async getStudentById(studentId: number): Promise<Student> {
    return this.studentRepo.findOne({
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
    return this.studentRepo
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

  /**
   * Get student by student personal information.
   * @param sin sin.
   * @param lastName last name.
   * @param birthDate birth date.
   * @returns student.
   */
  async getStudentByPersonalInfo(
    sin: string,
    lastName: string,
    birthDate: string,
    entityManager?: EntityManager,
  ): Promise<Student> {
    const repo = entityManager?.getRepository(Student) ?? this.studentRepo;
    return repo.findOne({
      select: { id: true, disabilityStatus: true },
      where: {
        sinValidation: { sin },
        user: {
          lastName: Raw((alias) => `LOWER(${alias}) = LOWER(:lastName)`, {
            lastName,
          }),
        },
        birthDate,
      },
    });
  }

  /**
   * Update disability status of a student.
   * @param studentId student id.
   * @param disabilityStatus disability status.
   * @param disabilityStatusUpdatedDate disability status updated date.
   * @returns update result.
   */
  async updateDisabilityStatus(
    studentId: number,
    disabilityStatus: DisabilityStatus,
    disabilityStatusUpdatedDate: Date,
  ): Promise<UpdateResult> {
    return this.studentRepo.update(
      { id: studentId },
      { disabilityStatus, studentPDUpdateAt: disabilityStatusUpdatedDate },
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
