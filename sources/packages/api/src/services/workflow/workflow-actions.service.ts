import { Injectable } from "@nestjs/common";
import { WorkflowService } from "..";
import { WorkflowStartResult } from "./workflow.models";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";

@Injectable()
export class WorkflowActionsService {
  constructor(private readonly workflowService: WorkflowService) {}

  /**
   * Starts application assessment.
   * @param workflowName wrokflow to be started.
   * @param applicationId application id to be processed.
   * @returns result of the application start.
   */
  async startApplicationAssessment(
    workflowName: string,
    applicationId: number,
  ): Promise<WorkflowStartResult> {
    try {
      return await this.workflowService.start(workflowName, {
        variables: {
          applicationId: {
            value: applicationId,
            type: "integer",
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error while starting application assessment workflow: ${workflowName}`,
      );
      this.logger.error(error);
      //The error is not thrown here, as we are failing silently
    }
  }

  /**
   * When a Program Information Request (PIR) needs to be completed by the institution,
   * the workflows waits until it receives a message that the institution completed the PIR.
   * This method is going to send a message to the workflow allowing it to proceed.
   * This message should only be sent once the offering id is provided for the student
   * application.
   * @param processInstanceId workflow instance to receive the message.
   */
  async sendProgramInfoCompletedMessage(
    processInstanceId: string,
  ): Promise<void> {
    try {
      await this.workflowService.sendMessage({
        messageName: "sims-pir-complete",
        processInstanceId,
        all: false, // false means that the message is correlated to exactly one entity.
      });
    } catch (error) {
      this.logger.error(
        `Error while sending Program Info completed message to instance id: ${processInstanceId}`,
      );
      this.logger.error(error);
      //The error is not thrown here, as we are failing silently
    }
  }

  /**
   * delete application assessment.
   * @param assessmentWorkflowId workflow Id to be deleted.
   */
  async deleteApplicationAssessment(
    assessmentWorkflowId: string,
  ): Promise<void> {
    try {
      await this.workflowService.delete(assessmentWorkflowId);
    } catch (error) {
      this.logger.error(
        `Error while deleting application assessment workflow: ${assessmentWorkflowId}, error: ${error}`,
      );
      this.logger.error(error);
      //The error is not thrown here, as we are failing silently
    }
  }

  /**
   * When Confirmation of Enrollment (COE) needs to be confirmed by the institution user,
   * the workflows waits until it receives a message that the institution confirms the COE.
   * This method is going to send a message to the workflow allowing it to proceed.
   * This message should only be sent when the institution confirmation COE of an Application
   * @param processInstanceId workflow instance to receive the message.
   */
  async sendConfirmCOEMessage(processInstanceId: string): Promise<void> {
    try {
      await this.workflowService.sendMessage({
        messageName: "sims-coe-complete",
        processInstanceId,
        all: false, // false means that the message is correlated to exactly one entity.
      });
    } catch (error) {
      this.logger.error(
        `Error while sending Confirm Confirmation of Enrollment (COE) message to instance id: ${processInstanceId}`,
      );
      this.logger.error(error);
      //The error is not thrown here, as we are failing silently
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
