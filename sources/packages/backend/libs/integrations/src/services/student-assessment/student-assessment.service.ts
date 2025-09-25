import { Injectable } from "@nestjs/common";
import {
  Application,
  ApplicationStatus,
  OfferingIntensity,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import { FindOptionsWhere, In, Not, Repository, UpdateResult } from "typeorm";
import { addDays, dateEqualTo } from "@sims/utilities";
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
    generatedDate?: string,
  ): Promise<Application[]> {
    const processingDate = generatedDate
      ? new Date(generatedDate)
      : addDays(-1);
    // Base criteria to get the pending assessment for IER 12.
    const ierAssessmentBaseCriteria: FindOptionsWhere<StudentAssessment> = {
      offering: {
        offeringIntensity: OfferingIntensity.fullTime,
        institutionLocation: { hasIntegration: true },
      },
      application: {
        applicationStatus: Not(ApplicationStatus.Edited),
      },
    };
    return this.applicationRepo.find({
      select: {
        id: true,
        applicationNumber: true,
        data: true as unknown,
        submittedDate: true,
        applicationStatus: true,
        applicationStatusUpdatedOn: true,
        studentNumber: true,
        student: {
          id: true,
          sinValidation: { id: true, sin: true },
          user: { id: true, lastName: true, firstName: true },
          birthDate: true,
          contactInfo: true as unknown,
          disabilityStatus: true,
          studentRestrictions: {
            id: true,
            isActive: true,
            restriction: {
              id: true,
              restrictionCode: true,
              actionType: true,
            },
          },
        },
        programYear: {
          id: true,
          programYear: true,
        },
        studentScholasticStandings: { id: true, changeType: true },
        currentAssessment: {
          id: true,
          assessmentData: true as unknown,
          workflowData: true as unknown,
          assessmentDate: true,
          triggerType: true,
          offering: {
            id: true,
            parentOffering: { id: true },
            educationProgram: {
              id: true,
              name: true,
              credentialType: true,
              fieldOfStudyCode: true,
              cipCode: true,
              nocCode: true,
              sabcCode: true,
              institutionProgramCode: true,
              completionYears: true,
            },
            institutionLocation: {
              id: true,
              institutionCode: true,
            },
            yearOfStudy: true,
            studyStartDate: true,
            studyEndDate: true,
            actualTuitionCosts: true,
            programRelatedCosts: true,
            mandatoryFees: true,
            exceptionalExpenses: true,
          },
          disbursementSchedules: {
            id: true,
            coeStatus: true,
            disbursementScheduleStatus: true,
            disbursementDate: true,
            updatedAt: true,
            dateSent: true,
            disbursementValues: {
              id: true,
              valueCode: true,
              valueAmount: true,
              valueType: true,
              restrictionAmountSubtracted: true,
            },
            disbursementReceipts: {
              id: true,
              disburseDate: true,
            },
            disbursementFeedbackErrors: {
              updatedAt: true,
              eCertFeedbackError: { id: true, errorCode: true },
            },
          },
        },
      },
      relations: {
        student: {
          sinValidation: true,
          user: true,
          studentRestrictions: { restriction: true },
        },
        studentScholasticStandings: true,
        programYear: true,
        currentAssessment: {
          disbursementSchedules: {
            disbursementValues: true,
            disbursementReceipts: true,
            disbursementFeedbackErrors: { eCertFeedbackError: true },
          },
          offering: {
            institutionLocation: true,
            educationProgram: true,
            parentOffering: true,
          },
        },
      },
      where: {
        currentAssessment: [
          {
            assessmentDate: dateEqualTo(processingDate),
            ...ierAssessmentBaseCriteria,
          },
          {
            disbursementSchedules: { updatedAt: dateEqualTo(processingDate) },
            ...ierAssessmentBaseCriteria,
          },
          {
            disbursementSchedules: {
              disbursementFeedbackErrors: {
                updatedAt: dateEqualTo(processingDate),
              },
            },
            ...ierAssessmentBaseCriteria,
          },
        ],
      },
      order: {
        currentAssessment: {
          assessmentDate: "ASC",
          disbursementSchedules: { disbursementDate: "ASC" },
        },
      },
    });
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
