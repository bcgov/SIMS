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
  SFASApplication,
} from "@sims/sims-db";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

const MAX_PAST_PROGRAM_YEARS_INCLUDING_CURRENT = 3;
@Injectable()
export class StudentInformationService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SFASIndividual)
    private readonly sfasIndividualRepo: Repository<SFASIndividual>,
    @InjectRepository(SFASApplication)
    private readonly sfasApplicationRepo: Repository<SFASApplication>,
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
  async getStudentApplications(studentId: number): Promise<Application[]> {
    // Get the SQL to get last 3 active program years including the current program year.
    const programYearQuery = this.programYearRepo
      .createQueryBuilder("programYear")
      .select("programYear.id")
      .where("programYear.active = true")
      .andWhere("programYear.startDate <= NOW()")
      .orderBy("programYear.startDate", "DESC")
      .limit(MAX_PAST_PROGRAM_YEARS_INCLUDING_CURRENT)
      .getSql();

    return (
      this.applicationRepo
        .createQueryBuilder("searchApplication")
        .select([
          "searchApplication.id",
          "searchApplication.applicationNumber",
          "searchApplication.applicationStatus",
          "searchApplication.applicationStatusUpdatedOn",
          "searchApplication.data",
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
        .leftJoin(
          "disbursementSchedule.disbursementValues",
          "disbursementValue",
        )
        .where("searchStudent.id = :studentId")
        .andWhere("searchApplication.applicationStatus != :editedStatus")
        .andWhere(`searchApplication.programYear.id IN (${programYearQuery})`)
        .andWhere(
          "currentAssessment.studentAssessmentStatus = :assessmentStatusCompleted",
        )
        .andWhere("offering.offeringIntensity = :fullTime")
        .setParameters({
          studentId,
          editedStatus: ApplicationStatus.Edited,
          assessmentStatusCompleted: StudentAssessmentStatus.Completed,
          fullTime: OfferingIntensity.fullTime,
          withdrawal:
            StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
        })
        // Ensuring data is sorted in some way. Not a business requirement.
        .orderBy("searchApplication.id")
        .getMany()
    );
  }

  /**
   * Get SFAS Individual by either student or SIN.
   * @param sin student sin number.
   * @param studentId student id.
   * @returns SFAS Individual.
   */
  async getSFASIndividualByEitherStudentOrSIN(
    sin: string,
    studentId?: number,
  ): Promise<SFASIndividual> {
    const sfasIndividualQuery = this.sfasIndividualRepo
      .createQueryBuilder("legacyStudent")
      .select([
        "legacyStudent.id",
        "legacyStudent.firstName",
        "legacyStudent.lastName",
        "legacyStudent.sin",
        "legacyStudent.birthDate",
        "legacyStudent.phoneNumber",
        "legacyStudent.addressLine1",
        "legacyStudent.addressLine2",
        "legacyStudent.city",
        "legacyStudent.provinceState",
        "legacyStudent.postalZipCode",
        "legacyStudent.country",
        "legacyStudent.student.id",
      ])
      .where("legacyStudent.sin = :sin", { sin });
    // When student id is provided, match alternatively by student id and give priority to student id match over SIN match.
    if (studentId) {
      sfasIndividualQuery.orWhere("legacyStudent.student.id = :studentId", {
        studentId,
      });
      sfasIndividualQuery
        .orderBy("legacyStudent.student.id", "DESC", "NULLS LAST")
        .addOrderBy("legacyStudent.id", "DESC");
    } else {
      sfasIndividualQuery.orderBy("legacyStudent.id", "DESC");
    }
    return sfasIndividualQuery.limit(1).getOne();
  }

  /**
   * Get SFAS Applications.
   * @param sfasIndividualId legacy student id.
   * @returns sfas applications.
   */
  async getSFASApplications(
    sfasIndividualId: number,
  ): Promise<SFASApplication[]> {
    // Get the SQL to get last 3 active program years including the current program year.
    const legacyProgramYearQuery = this.programYearRepo
      .createQueryBuilder("programYear")
      .select(
        "CAST(REPLACE(programYear.programYear, '-', '') AS INTEGER)",
        "programYear",
      )
      .where("programYear.active = true")
      .andWhere("programYear.startDate <= NOW()")
      .orderBy("programYear.startDate", "DESC")
      .limit(MAX_PAST_PROGRAM_YEARS_INCLUDING_CURRENT)
      .getSql();

    return (
      this.sfasApplicationRepo
        .createQueryBuilder("legacyApplication")
        .select([
          "legacyApplication.id",
          "legacyApplication.startDate",
          "legacyApplication.endDate",
          "legacyApplication.educationPeriodWeeks",
          "legacyApplication.courseLoad",
          "legacyApplication.applicationNumber",
          "legacyApplication.applicationStatusCode",
          "legacyApplication.applicationCancelDate",
          "legacyApplication.withdrawalDate",
          "legacyApplication.withdrawalReason",
          "legacyApplication.withdrawalActiveFlag",
          "legacyApplication.bcResidencyFlag",
          "legacyApplication.permanentResidencyFlag",
          "legacyApplication.maritalStatus",
          "legacyApplication.marriageDate",
          "legacyApplication.grossIncomePreviousYear",
          "legacyApplication.livingArrangements",
          "legacyApplication.bslAward",
          "legacyApplication.cslAward",
          "legacyApplication.bcagAward",
          "legacyApplication.bgpdAward",
          "legacyApplication.csfgAward",
          "legacyApplication.csgtAward",
          "legacyApplication.csgdAward",
          "legacyApplication.csgpAward",
          "legacyApplication.sbsdAward",
          "legacyApplication.assessedCostsTuition",
          "legacyApplication.assessedCostsBooksAndSupplies",
          "legacyApplication.assessedCostsExceptionalExpenses",
          "legacyApplication.assessedCostsLivingAllowance",
          "legacyApplication.assessedCostsExtraShelter",
          "legacyApplication.assessedCostsChildCare",
          "legacyApplication.assessedCostsAlimony",
          "legacyApplication.assessedCostsLocalTransport",
          "legacyApplication.assessedCostsReturnTransport",
          "legacyApplication.assessedEligibleNeed",
          "legacyApplication.institutionCode",
          "dependant.id",
          "dependant.dependantName",
          "dependant.dependantBirthDate",
          "disbursement.id",
          "disbursement.fundingType",
          "disbursement.fundingAmount",
          "disbursement.fundingDate",
          "disbursement.dateIssued",
          "location.id",
          "location.name",
          "location.primaryContact",
        ])
        .leftJoin("legacyApplication.dependants", "dependant")
        .leftJoin("legacyApplication.disbursements", "disbursement")
        .leftJoin(
          "legacyApplication.institutionLocation",
          "location",
          "location.institutionCode IS NOT NULL",
        )
        .where("legacyApplication.individual.id = :sfasIndividualId", {
          sfasIndividualId,
        })
        .andWhere(
          `legacyApplication.programYearId IN (${legacyProgramYearQuery})`,
        )
        // Ensuring data is sorted in some way. Not a business requirement.
        .orderBy("legacyApplication.id")
        .getMany()
    );
  }
}
