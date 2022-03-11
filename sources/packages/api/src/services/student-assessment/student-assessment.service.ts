import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  StudentAssessment,
} from "../../database/entities";
import { Connection } from "typeorm";
import { CustomNamedError } from "../../utilities";
import { INVALID_OPERATION_IN_THE_CURRENT_STATUS } from "../application/application.service";
import { WorkflowActionsService } from "..";

@Injectable()
export class StudentAssessmentService extends RecordDataModelService<StudentAssessment> {
  constructor(
    connection: Connection,
    private readonly workflow: WorkflowActionsService,
  ) {
    super(connection.getRepository(StudentAssessment));
  }

  /**
   * Starts the assessment workflow of one Student Application.
   * @param assessmentId Student assessment that need to be processed.
   */
  async startAssessment(assessmentId: number): Promise<void> {
    const assessment = await this.repo
      .createQueryBuilder("assessment")
      .select([
        "assessment.id",
        "assessment.assessmentWorkflowId",
        "assessment.triggerType",
        "application.id",
        "application.applicationStatus",
        "application.data",
      ])
      .innerJoin("assessment.application", "application")
      .where("assessment.id = :assessmentId", { assessmentId })
      .getOne();

    if (assessment.assessmentWorkflowId) {
      throw new CustomNamedError(
        `Student assessment was already started and has a workflow associated with. Assessment id ${assessmentId}`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }

    if (
      assessment.triggerType === AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.submitted
    ) {
      throw new CustomNamedError(
        `An assessment with a trigger type '${AssessmentTriggerType.OriginalAssessment}' can only be started with a Student Application in the status '${ApplicationStatus.submitted}'. Assessment id ${assessmentId}`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }

    if (
      assessment.triggerType !== AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.completed
    ) {
      throw new CustomNamedError(
        `An assessment with a trigger type other than '${AssessmentTriggerType.OriginalAssessment}' can only be started with a Student Application in the status '${ApplicationStatus.completed}'. Assessment id ${assessmentId}`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }

    await this.workflow.startApplicationAssessment(
      assessment.application.data.workflowName,
      assessment.application.id,
      assessment.id,
    );
  }
}
