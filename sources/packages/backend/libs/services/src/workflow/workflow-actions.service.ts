import { Injectable } from "@nestjs/common";
import {
  CreateProcessInstanceResponse,
  Duration,
  PublishMessageResponse,
  ZBClient,
} from "zeebe-node";

@Injectable()
export class WorkflowClientService {
  constructor(private readonly zeebeClient: ZBClient) {}

  /**
   * Starts application assessment.
   * @param workflowName workflow to be started.
   * @param assessmentId student assessment that need to be processed.
   * @returns result of the application start.
   */
  async startApplicationAssessment(
    workflowName: string,
    assessmentId: number,
  ): Promise<CreateProcessInstanceResponse> {
    return this.zeebeClient.createProcessInstance(workflowName, {
      assessmentId,
    });
  }

  /**
   * When a Program Information Request (PIR) needs to be completed by the institution,
   * the workflows waits until it receives a message that the institution completed the PIR.
   * This method is going to send a message to the workflow allowing it to proceed.
   * This message should only be sent once the offering id is provided for the student
   * application.
   * @param applicationId application id that had the PIT completed.
   */
  async sendProgramInfoCompletedMessage(
    applicationId: string,
  ): Promise<PublishMessageResponse> {
    return this.zeebeClient.publishMessage({
      name: "program-info-request-completed",
      correlationKey: applicationId,
      timeToLive: Duration.seconds.of(30),
      variables: {},
    });
  }
}
