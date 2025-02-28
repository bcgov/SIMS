import { Injectable } from "@nestjs/common";
import {
  Student,
  SFASIndividual,
  ApplicationStatus,
  StudentAssessmentStatus,
  ProgramYear,
  StudentScholasticStandingChangeType,
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
    @InjectRepository(ProgramYear)
    private readonly programYearRepo: Repository<ProgramYear>,
  ) {}

  /**
   * Get student by valid SIN and student applications.
   * @param sin student sin number.
   * @returns student and applications.
   */
  async getStudentAndApplicationsBySIN(sin: string): Promise<Student> {
    // Get the SQL to get last 3 active program years including the current program year.
    const programYearQuery = this.programYearRepo
      .createQueryBuilder("programYear")
      .select(["programYear.id"])
      .where("programYear.active = true")
      .andWhere("programYear.startDate <= NOW()")
      .orderBy("programYear.startDate", "DESC")
      .limit(3)
      .getSql();

    return this.studentRepo
      .createQueryBuilder("student")
      .select([
        "student.id",
        "student.birthDate",
        "student.contactInfo",
        "sinValidation.sin",
        "studentUser.firstName",
        "studentUser.lastName",
        "studentUser.email",
        "studentApplication.id",
        "studentApplication.data",
        "currentAssessment.id",
        "currentAssessment.workflowData",
        "currentAssessment.assessmentData",
        "studentApplication.applicationNumber",
        "studentApplication.applicationStatus",
        "studentApplication.applicationStatusUpdatedOn",
        "scholasticStanding.id",
        "scholasticStanding.changeType",
        "scholasticStanding.submittedData",
        "offering.id",
        "offering.studyBreaks",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "location.id",
        "location.institutionCode",
        "location.name",
        "location.primaryContact",
        "disbursementSchedule.id",
        "disbursementSchedule.disbursementDate",
        "disbursementSchedule.dateSent",
        "disbursementSchedule.disbursementScheduleStatus",
        "disbursementValue.id",
        "disbursementValue.valueCode",
        "disbursementValue.valueAmount",
        "disbursementValue.effectiveAmount",
      ])
      .innerJoin("student.user", "studentUser")
      .innerJoin("student.sinValidation", "sinValidation")
      .leftJoin("student.applications", "studentApplication")
      .leftJoin("studentApplication.location", "location")
      .leftJoin("location.institution", "institution")
      .leftJoin("studentApplication.currentAssessment", "currentAssessment")
      .leftJoin(
        "currentAssessment.studentScholasticStanding",
        "scholasticStanding",
        "scholasticStanding.changeType = :withdrawal",
        {
          withdrawal:
            StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
        },
      )
      .leftJoin("currentAssessment.offering", "offering")
      .leftJoin(
        "currentAssessment.disbursementSchedules",
        "disbursementSchedule",
      )
      .leftJoin("disbursementSchedule.disbursementValues", "disbursementValue")
      .where("sinValidation.sin = :sin")
      .andWhere("sinValidation.isValidSIN = true")
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            new Brackets((qb) => {
              qb.where("studentApplication.applicationStatus != :overwritten")
                .andWhere(
                  `studentApplication.programYear.id IN (${programYearQuery})`,
                )
                .andWhere(
                  "currentAssessment.studentAssessmentStatus = :assessmentStatusCompleted",
                );
            }),
          ).orWhere("studentApplication.id IS NULL");
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
