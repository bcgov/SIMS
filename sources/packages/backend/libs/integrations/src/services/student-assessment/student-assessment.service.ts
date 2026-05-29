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
import { IERAward } from "../../institution-integration/ier12-integration/models/ier12-integration.model";

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
   * Get application details for current assessment that belongs to the integration enabled institutions
   * between the given period.
   * @param modifiedSince Inclusive date since the application or student data was modified.
   * @param modifiedUntil Exclusive date until the application or student data was modified.
   * @param institutionCode Optional institution code to limit the applications to a specific institution.
   * @returns application details for current assessment.
   */
  async getPendingApplicationsCurrentAssessment(
    modifiedSince: Date,
    modifiedUntil: Date,
    institutionCode?: string,
  ): Promise<Application[]> {
    const query = this.applicationRepo
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
        "user.id",
        "user.lastName",
        "user.firstName",
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
      .innerJoin("student.user", "user")
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
            new Brackets((qbInner) => {
              qbInner
                .where("currentAssessment.assessmentDate >= :modifiedSince")
                .andWhere("currentAssessment.assessmentDate < :modifiedUntil");
            }),
          )
            .orWhere(
              new Brackets((qbInner) => {
                qbInner
                  .where("disbursementSchedule.updatedAt >= :modifiedSince")
                  .andWhere("disbursementSchedule.updatedAt < :modifiedUntil");
              }),
            )
            .orWhere(
              new Brackets((qbInner) => {
                qbInner
                  .where(
                    "disbursementFeedbackError.updatedAt >= :modifiedSince",
                  )
                  .andWhere(
                    "disbursementFeedbackError.updatedAt < :modifiedUntil",
                  );
              }),
            )
            .orWhere(
              new Brackets((qbInner) => {
                qbInner
                  .where("student.updatedAt >= :modifiedSince")
                  .andWhere("student.updatedAt < :modifiedUntil");
              }),
            )
            .orWhere(
              new Brackets((qbInner) => {
                qbInner
                  .where("user.updatedAt >= :modifiedSince")
                  .andWhere("user.updatedAt < :modifiedUntil");
              }),
            );
        }),
      );
    // Optionally limit applications to a specific institution.
    if (institutionCode) {
      query.andWhere("institutionLocation.institutionCode = :institutionCode", {
        institutionCode,
      });
    }
    query
      .setParameters({
        offeringIntensityFullTime: OfferingIntensity.fullTime,
        applicationStatusEdited: ApplicationStatus.Edited,
        modifiedSince,
        modifiedUntil,
      })
      .orderBy("currentAssessment.assessmentDate", "ASC")
      .addOrderBy("disbursementSchedule.disbursementDate", "ASC");
    return await query.getMany();
  }

  /**
   * Get the current assessment award total per application ID.
   * The total per application is the sum of all disbursement values across
   * all disbursements belonging to the application's current assessment.
   * @param applicationIds application IDs to include in the aggregation.
   * @returns A map of application ID to current assessment award total.
   */
  async getDisbursementAwardTotalsForApplications(
    applicationIds: number[],
  ): Promise<Map<number, IERAward[]>> {
    const applications = await this.applicationRepo.find({
      select: {
        id: true,
        currentAssessment: {
          id: true,
          disbursementSchedules: {
            id: true,
            disbursementValues: {
              id: true,
              valueType: true,
              valueCode: true,
              valueAmount: true,
              restrictionAmountSubtracted: true,
            },
          },
        },
      },
      relations: {
        currentAssessment: {
          disbursementSchedules: {
            disbursementValues: true,
          },
        },
      },
      where: {
        id: In(applicationIds),
      },
    });

    const applicationAwardTotals = new Map<number, IERAward[]>();
    for (const application of applications) {
      const { disbursementSchedules = [] } =
        application.currentAssessment ?? {};
      // assessmentAwards aggregates all the current assessment award values so each disbursement record can reuse the same totals.
      const assessmentAwards = disbursementSchedules
        .flatMap(
          (disbursementSchedule) =>
            disbursementSchedule.disbursementValues ?? [],
        )
        .map<IERAward>((disbursementValue) => ({
          valueType: disbursementValue.valueType,
          valueCode: disbursementValue.valueCode,
          valueAmount: disbursementValue.valueAmount,
          restrictionAmountSubtracted:
            disbursementValue.restrictionAmountSubtracted,
        }));
      applicationAwardTotals.set(application.id, assessmentAwards);
    }
    return applicationAwardTotals;
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
