import { Injectable } from "@nestjs/common";
import {
  Student,
  SFASIndividual,
  ApplicationStatus,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { Brackets, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class StudentInformationService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SFASIndividual)
    private readonly sfasIndividualRepo: Repository<SFASIndividual>,
  ) {}

  /**
   * Get student by valid SIN and student applications.
   * @param sin student sin number.
   * @returns student and applications.
   */
  async getStudentAndApplicationsBySIN(sin: string): Promise<Student> {
    return this.studentRepo
      .createQueryBuilder("student")
      .select([
        "student.id",
        "student.birthDate",
        "student.contactInfo",
        "sinValidation.sin",
        "user.firstName",
        "user.lastName",
        "user.email",
        "application.id",
        "application.data",
        "application.applicationNumber",
      ])
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .leftJoin("student.applications", "application")
      .leftJoin("application.currentAssessment", "currentAssessment")
      .where("sinValidation.sin = :sin")
      .andWhere("sinValidation.isValidSIN = true")
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            new Brackets((qb) => {
              qb.where(
                "application.applicationStatus != :overwritten",
              ).andWhere(
                "currentAssessment.studentAssessmentStatus = :assessmentStatusCompleted",
              );
            }),
          ).orWhere("application.id IS NULL");
        }),
      )
      .setParameters({
        sin,
        overwritten: ApplicationStatus.Overwritten,
        assessmentStatusCompleted: StudentAssessmentStatus.Completed,
      })
      .getOne();
  }

  /**
   * Get SFAS Individual by SIN.
   * @param sin student sin number.
   * @returns SFAS Individual.
   */
  async getSFASIndividualBySIN(sin: string): Promise<SFASIndividual> {
    return this.sfasIndividualRepo.findOne({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        sin: true,
        birthDate: true,
        phoneNumber: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        provinceState: true,
        postalZipCode: true,
        country: true,
      },
      where: { sin },
    });
  }
}
