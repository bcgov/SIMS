import { Injectable } from "@nestjs/common";
import {
  Application,
  ApplicationStatus,
  OfferingIntensity,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import { Brackets, In, Repository, UpdateResult } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Manages the student assessment related operations.
 */
@Injectable()
export class StudentAssessmentService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(StudentAssessment)
    private readonly studentAssessmentRepo: Repository<StudentAssessment>,
  ) {}

  /**
   * Get the pending current assessment for the institutions which have integration true for the particular date.
   * @param generatedDate date in which the assessment for particular institution is generated.
   * @returns pending application and its current assessment for the institution location.
   */
  async getPendingApplicationsCurrentAssessment(
    startDate: Date,
    endDate: Date,
  ): Promise<Application[]> {
    return this.applicationRepo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "application.applicationNumber",
        "application.data",
        "application.submittedDate",
        "application.applicationStatus",
        "application.applicationStatusUpdatedOn",
        "application.studentNumber",
        "student.id",
        "student.birthDate",
        "student.contactInfo",
        "student.disabilityStatus",
        "sinValidation.id",
        "sinValidation.sin",
        "studentUser.id",
        "studentUser.lastName",
        "studentUser.firstName",
        "studentRestriction.id",
        "studentRestriction.isActive",
        "restriction.id",
        "restriction.restrictionCode",
        "restriction.actionType",
        "programYear.id",
        "programYear.programYear",
        "studentScholasticStanding.id",
        "studentScholasticStanding.changeType",
        "currentAssessment.id",
        "currentAssessment.assessmentData",
        "currentAssessment.workflowData",
        "currentAssessment.assessmentDate",
        "currentAssessment.triggerType",
        "offering.id",
        "offering.yearOfStudy",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "offering.mandatoryFees",
        "offering.exceptionalExpenses",
        "parentOffering.id",
        "program.id",
        "program.name",
        "program.credentialType",
        "program.fieldOfStudyCode",
        "program.cipCode",
        "program.nocCode",
        "program.sabcCode",
        "program.institutionProgramCode",
        "program.completionYears",
        "institutionLocation.id",
        "institutionLocation.institutionCode",
        "disbursementSchedule.id",
        "disbursementSchedule.coeStatus",
        "disbursementSchedule.disbursementScheduleStatus",
        "disbursementSchedule.disbursementDate",
        "disbursementSchedule.updatedAt",
        "disbursementSchedule.dateSent",
        "disbursementValue.id",
        "disbursementValue.valueCode",
        "disbursementValue.valueAmount",
        "disbursementValue.valueType",
        "disbursementValue.restrictionAmountSubtracted",
        "disbursementReceipt.id",
        "disbursementReceipt.disburseDate",
        "disbursementFeedbackError.id",
        "disbursementFeedbackError.updatedAt",
        "eCertFeedbackError.id",
        "eCertFeedbackError.errorCode",
      ])
      .innerJoin("application.student", "student")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("student.user", "studentUser")
      .leftJoin("student.studentRestrictions", "studentRestriction")
      .leftJoin("studentRestriction.restriction", "restriction")
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.parentOffering", "parentOffering")
      .innerJoin("offering.educationProgram", "program")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .innerJoin(
        "currentAssessment.disbursementSchedules",
        "disbursementSchedule",
      )
      .leftJoin("disbursementSchedule.disbursementValues", "disbursementValue")
      .leftJoin(
        "disbursementSchedule.disbursementReceipts",
        "disbursementReceipt",
      )
      .leftJoin(
        "disbursementSchedule.disbursementFeedbackErrors",
        "disbursementFeedbackError",
      )
      .leftJoin(
        "disbursementFeedbackError.eCertFeedbackError",
        "eCertFeedbackError",
      )
      .leftJoin(
        "application.studentScholasticStandings",
        "studentScholasticStanding",
      )
      .where("application.offeringIntensity = :offeringIntensityFullTime")
      .andWhere("application.applicationStatus != :applicationStatusEdited")
      .andWhere("institutionLocation.hasIntegration = true")
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            "currentAssessment.assessmentDate >= :startDate AND currentAssessment.assessmentDate < :endDate",
          )
            .orWhere(
              "disbursementSchedule.updatedAt >= :startDate AND disbursementSchedule.updatedAt < :endDate",
            )
            .orWhere(
              "disbursementFeedbackError.updatedAt >= :startDate AND disbursementFeedbackError.updatedAt < :endDate",
            )
            .orWhere(
              "student.updatedAt >= :startDate AND student.updatedAt < :endDate",
            );
        }),
      )
      .setParameters({
        offeringIntensityFullTime: OfferingIntensity.fullTime,
        applicationStatusEdited: ApplicationStatus.Edited,
        startDate,
        endDate,
      })
      .getMany();
  }

  /**
   * Update reported date of the given student assessments.
   * @param assessmentIds assessments to be updated.
   * @param reportedDate reported date.
   * @param auditUserId user updating the reported date.
   * @returns update result.
   */
  async updateReportedDate(
    assessmentIds: number[],
    reportedDate: Date,
    auditUserId: number,
  ): Promise<UpdateResult> {
    return this.studentAssessmentRepo.update(
      { id: In(assessmentIds) },
      {
        reportedDate: reportedDate,
        modifier: { id: auditUserId } as User,
      },
    );
  }
}
