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
    console.log(processingDate);
    return this.repo.find({
      select: {
        id: true,
        application: {
          applicationNumber: true,
          student: {
            sinValidation: { sin: true },
            user: { lastName: true, firstName: true },
            birthDate: true,
          },
        },
        offering: {
          educationProgram: {
            name: true,
            description: true,
            credentialType: true,
            cipCode: true,
            nocCode: true,
            sabcCode: true,
            institutionProgramCode: true,
          },
          yearOfStudy: true,
          studyStartDate: true,
          studyEndDate: true,
          actualTuitionCosts: true,
          programRelatedCosts: true,
          mandatoryFees: true,
          exceptionalExpenses: true,
          studyBreaks: { totalFundedWeeks: true },
        },
        disbursementSchedules: {
          id: true,
          disbursementValues: { id: true, valueCode: true, valueAmount: true },
        },
      },
      relations: {
        disbursementSchedules: { disbursementValues: true },
        application: { student: { sinValidation: true, user: true } },
        offering: { institutionLocation: true, educationProgram: true },
      },
      where: {
        assessmentDate: dateEqualTo(processingDate),
        offering: { institutionLocation: { hasIntegration: true } },
      },
    });
  }
}
