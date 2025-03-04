import { Injectable } from "@nestjs/common";
import {
  Student,
  SFASIndividual,
  ApplicationStatus,
  StudentAssessmentStatus,
  ProgramYear,
  StudentScholasticStandingChangeType,
  Application,
  OfferingIntensity,
  mapFromRawAndEntities,
} from "@sims/sims-db";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ApplicationDetail } from "../../services";

const MAX_PAST_PROGRAM_YEARS_INCLUDING_CURRENT = 3;
@Injectable()
export class StudentInformationService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SFASIndividual)
    private readonly sfasIndividualRepo: Repository<SFASIndividual>,
    @InjectRepository(ProgramYear)
    private readonly programYearRepo: Repository<ProgramYear>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  /**
   * Get student by valid SIN.
   * @param sin student sin number.
   * @returns student.
   */
  async getStudentBySIN(sin: string): Promise<Student> {
    return this.studentRepo.findOne({
      select: {
        id: true,
        birthDate: true,
        contactInfo: true as unknown,
        sinValidation: { id: true, sin: true },
        user: { id: true, firstName: true, lastName: true, email: true },
      },
      relations: { sinValidation: true, user: true },
      where: { sinValidation: { sin, isValidSIN: true } },
    });
  }

  /**
   * Get student applications.
   * @param studentId student id.
   * @returns applications.
   */
  async getStudentApplications(
    studentId: number,
  ): Promise<ApplicationDetail[]> {
    // Get the SQL to get last 3 active program years including the current program year.
    const programYearQuery = this.programYearRepo
      .createQueryBuilder("programYear")
      .select("programYear.id")
      .where("programYear.active = true")
      .andWhere("programYear.startDate <= NOW()")
      .orderBy("programYear.startDate", "DESC")
      .limit(MAX_PAST_PROGRAM_YEARS_INCLUDING_CURRENT)
      .getSql();

    const queryResult = await this.applicationRepo
      .createQueryBuilder("searchApplication")
      .select([
        "searchApplication.id",
        "searchApplication.applicationNumber",
        "searchApplication.applicationStatus",
        "searchApplication.applicationStatusUpdatedOn",
        "currentAssessment.id",
        "currentAssessment.workflowData",
        "currentAssessment.assessmentData",
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
      .addSelect("searchApplication.data ->> 'dependants'", "dependants")
      .innerJoin("searchApplication.student", "searchStudent")
      .innerJoin("searchApplication.location", "location")
      .innerJoin("searchApplication.currentAssessment", "currentAssessment")
      .leftJoin(
        "currentAssessment.studentScholasticStanding",
        "scholasticStanding",
        "scholasticStanding.changeType = :withdrawal",
      )
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin(
        "currentAssessment.disbursementSchedules",
        "disbursementSchedule",
      )
      .leftJoin("disbursementSchedule.disbursementValues", "disbursementValue")
      .where("searchStudent.id = :studentId")
      .andWhere("searchApplication.applicationStatus != :overwritten")
      .andWhere(`searchApplication.programYear.id IN (${programYearQuery})`)
      .andWhere(
        "currentAssessment.studentAssessmentStatus = :assessmentStatusCompleted",
      )
      .andWhere("offering.offeringIntensity = :fullTime")
      .setParameters({
        studentId,
        overwritten: ApplicationStatus.Overwritten,
        assessmentStatusCompleted: StudentAssessmentStatus.Completed,
        fullTime: OfferingIntensity.fullTime,
        withdrawal:
          StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
      })
      .getRawAndEntities();

    return mapFromRawAndEntities<Application>(queryResult, "dependants");
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
