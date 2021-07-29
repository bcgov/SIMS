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
      throw new Error(
        `Error while starting application assessment workflow: ${workflowName}, error: ${error}`,
      );
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
      const errorMessage = `Error while sending Program Info completed message to instance id: ${processInstanceId}`;
      this.logger.error(error);
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
