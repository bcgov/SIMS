import { Injectable, Logger } from "@nestjs/common";
import { ApplicationExceptionStatus, ProgramInfoStatus } from "@sims/sims-db";
import { CreateProcessInstanceResponse, Duration, ZBClient } from "zeebe-node";
import {
  APPLICATION_EXCEPTION_STATUS,
  PROGRAM_INFO_STATUS,
} from "./variables/assessment-gateway";

@Injectable()
export class WorkflowClientService {
  private readonly logger = new Logger(WorkflowClientService.name);

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
    try {
      return await this.zeebeClient.createProcessInstance(workflowName, {
        assessmentId,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Error while starting application assessment workflow: ${workflowName}`,
      );
      this.logger.error(error);
      // The error is not thrown here, as we are failing silently.
    }
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
    applicationId: number,
    status: ProgramInfoStatus,
  ): Promise<void> {
    try {
      await this.zeebeClient.publishMessage({
        name: "program-info-request-completed",
        correlationKey: applicationId.toString(),
        timeToLive: Duration.seconds.of(30),
        variables: {
          [PROGRAM_INFO_STATUS]: status,
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Error while sending Program Info completed message to application id: ${applicationId}`,
      );
      this.logger.error(error);
      // The error is not thrown here, as we are failing silently.
    }
  }

  /**
   * When a CRA income verification is requested, the workflow needs to wait
   * until the request in sent to CRA and a response is received.
   * This method is going to send a message to the workflow allowing it to proceed
   * when the data in available on database to be retrieved.
   * @param incomeVerificationId income verification id that will be appended to the
   * name of the message to uniquely identify it.
   * @return true case a successful call happen, otherwise false.
   * @deprecated move to WorkflowClientService.
   */
  async sendCRAIncomeVerificationCompletedMessage(
    incomeVerificationId: number,
  ): Promise<void> {
    try {
      await this.zeebeClient.publishMessage({
        name: "program-info-request-completed",
        correlationKey: incomeVerificationId.toString(),
        timeToLive: Duration.seconds.of(30),
        variables: {},
      });
    } catch (error: unknown) {
      this.logger.error(
        `Error while sending CRA income verification completed message using incomeVerificationId: ${incomeVerificationId}.`,
      );
      this.logger.error(error);
      // The error is not thrown here, as we are failing silently.
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
      await this.zeebeClient.cancelProcessInstance(assessmentWorkflowId);
    } catch (error: unknown) {
      this.logger.error(
        `Error while deleting application assessment workflow: ${assessmentWorkflowId}.`,
      );
      this.logger.error(error);
      //The error is not thrown here, as we are failing silently
    }
  }

  /**
   * When there is a need of collecting additional information from a person
   * other than the student (e.g. parent/partner), a supporting user is created
   * by the the workflow that will be waiting until this message is received.
   * This method is going to send a message to the workflow allowing it to proceed
   * when the data in available on database to be retrieved.
   * @param supportingUserId supporting user id that will be appended to the
   * name of the message to uniquely identify it.
   */
  async sendSupportingUsersCompletedMessage(
    supportingUserId: number,
  ): Promise<void> {
    try {
      await this.zeebeClient.publishMessage({
        name: "supporting-user-info-received",
        correlationKey: supportingUserId.toString(),
        timeToLive: Duration.seconds.of(30),
        variables: {},
      });
    } catch (error: unknown) {
      this.logger.error(
        `Error while sending supporting users completed message using supportingUserId: ${supportingUserId}`,
      );
      this.logger.error(error);
      // The error is not thrown here, as we are failing silently.
    }
  }

  /**
   * When an exception is detected in the student application dynamic data, for instance,
   * when some document was uploaded and need to be reviewed, the workflow will stop till
   * this message is received with the approval or denial from the Ministry user.
   * @param applicationExceptionId exception id to send the message.
   * @param status approval or denial status.
   */
  async sendApplicationExceptionApproval(
    applicationExceptionId: number,
    status: ApplicationExceptionStatus,
  ): Promise<void> {
    try {
      await this.zeebeClient.publishMessage({
        name: "application-exception-verified",
        correlationKey: applicationExceptionId.toString(),
        timeToLive: Duration.seconds.of(30),
        variables: {
          [APPLICATION_EXCEPTION_STATUS]: status,
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Error while sending application exception approval message applicationExceptionId: ${applicationExceptionId}.`,
      );
      this.logger.error(error);
      // The error is not thrown here, as we are failing silently.
    }
  }
}
