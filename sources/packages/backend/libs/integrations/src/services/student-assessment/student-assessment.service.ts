import { Injectable } from "@nestjs/common";
import { RecordDataModelService, StudentAssessment } from "@sims/sims-db";
import { DataSource } from "typeorm";
import { addDays, dateEqualTo } from "@sims/utilities";

/**
 * Manages the student assessment related operations.
 */
@Injectable()
export class StudentAssessmentService extends RecordDataModelService<StudentAssessment> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(StudentAssessment));
  }

  /**
   * Get the pending assessment for the institutions which have integration true for the particular date.
   * @param generatedDate Date in which the assessment for
   * particular institution is generated.
   * @returns Pending assessment for the institution location.
   */
  async getPendingAssessment(
    generatedDate?: string,
  ): Promise<StudentAssessment[]> {
    const processingDate = generatedDate
      ? new Date(generatedDate)
      : addDays(-1);
    return this.repo.find({
      select: {
        id: true,
        assessmentData: true as unknown,
        workflowData: true as unknown,
        assessmentDate: true,
        triggerType: true,
        application: {
          id: true,
          applicationNumber: true,
          data: true as unknown,
          submittedDate: true,
          applicationStatus: true,
          applicationStatusUpdatedOn: true,
          student: {
            id: true,
            sinValidation: { id: true, sin: true },
            user: { id: true, lastName: true, firstName: true },
            birthDate: true,
            contactInfo: true as unknown,
            studentRestrictions: {
              id: true,
              isActive: true,
              restriction: { id: true, restrictionCode: true },
            },
          },
          programYear: {
            id: true,
            programYear: true,
          },
          studentScholasticStandings: { id: true, changeType: true },
        },
        offering: {
          id: true,
          educationProgram: {
            id: true,
            name: true,
            description: true,
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
          disbursementValues: {
            id: true,
            valueCode: true,
            valueAmount: true,
            valueType: true,
          },
          disbursementReceipts: {
            id: true,
            disburseDate: true,
          },
        },
      },
      relations: {
        disbursementSchedules: {
          disbursementValues: true,
          disbursementReceipts: true,
        },
        application: {
          student: {
            sinValidation: true,
            user: true,
            studentRestrictions: { restriction: true },
          },
          studentScholasticStandings: true,
          programYear: true,
        },
        offering: { institutionLocation: true, educationProgram: true },
      },
      where: [
        {
          assessmentDate: dateEqualTo(processingDate),
          offering: { institutionLocation: { hasIntegration: true } },
        },
        {
          disbursementSchedules: { updatedAt: dateEqualTo(processingDate) },
          offering: { institutionLocation: { hasIntegration: true } },
        },
      ],
    });
  }
}
