import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import {
  RecordDataModelService,
  DisbursementSchedule,
  DisbursementValue,
  StudentAssessment,
  AssessmentTriggerType,
  ApplicationStatus,
} from "@sims/sims-db";
import { Disbursement } from "./disbursement-schedule.models";
import { CustomNamedError } from "@sims/utilities";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  DISBURSEMENT_SCHEDULES_ALREADY_CREATED,
} from "../../constants";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  private readonly assessmentRepo: Repository<StudentAssessment>;
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(DisbursementSchedule));
    this.assessmentRepo = dataSource.getRepository(StudentAssessment);
  }

  /**
   * Create the disbursements for an assessment.
   * @param assessmentId application id to associate the disbursements.
   * @param disbursements array of disbursements and values to be created.
   * @returns created disbursements.
   */
  async createDisbursementSchedules(
    assessmentId: number,
    disbursements: Disbursement[],
  ): Promise<DisbursementSchedule[]> {
    const assessment = await this.assessmentRepo.findOne({
      select: {
        id: true,
        triggerType: true,
        application: { id: true, applicationStatus: true },
        disbursementSchedules: { id: true },
      },
      relations: {
        application: true,
        disbursementSchedules: true,
      },
      where: {
        id: assessmentId,
      },
    });

    if (!assessment) {
      throw new CustomNamedError(
        "Student assessment not found.",
        ASSESSMENT_NOT_FOUND,
      );
    }

    if (assessment.disbursementSchedules?.length > 0) {
      throw new CustomNamedError(
        `Disbursements were already created for this Student Assessment.`,
        DISBURSEMENT_SCHEDULES_ALREADY_CREATED,
      );
    }

    if (
      assessment.triggerType === AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.inProgress
    ) {
      throw new CustomNamedError(
        `Student Assessment and Student Application are not in the expected status. Expecting assessment status '${AssessmentTriggerType.OriginalAssessment}' when the application status is '${ApplicationStatus.inProgress}'.`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }

    if (
      assessment.triggerType !== AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.completed
    ) {
      throw new CustomNamedError(
        `Student Assessment and Student Application are not in the expected status. Expecting application status '${ApplicationStatus.completed}' when the assessment status is not '${AssessmentTriggerType.OriginalAssessment}'.`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }

    for (const disbursement of disbursements) {
      const newDisbursement = new DisbursementSchedule();
      newDisbursement.disbursementDate = disbursement.disbursementDate;
      newDisbursement.negotiatedExpiryDate = disbursement.negotiatedExpiryDate;
      newDisbursement.disbursementValues = disbursement.disbursements.map(
        (disbursementValue) => {
          const newValue = new DisbursementValue();
          newValue.valueType = disbursementValue.valueType;
          newValue.valueCode = disbursementValue.valueCode;
          newValue.valueAmount = disbursementValue.valueAmount.toString();
          return newValue;
        },
      );
      assessment.disbursementSchedules.push(newDisbursement);
    }

    await this.assessmentRepo.save(assessment);
    return assessment.disbursementSchedules;
  }
}
