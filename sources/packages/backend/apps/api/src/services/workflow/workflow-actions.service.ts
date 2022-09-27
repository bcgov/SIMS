import { Injectable } from "@nestjs/common";
import { WorkflowService } from "..";
import { WorkflowStartResult } from "./workflow.models";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { ApplicationExceptionStatus } from "../../database/entities";

@Injectable()
export class WorkflowActionsService {
  constructor(private readonly workflowService: WorkflowService) {}

  /**
   * Starts application assessment.
   * @param workflowName workflow to be started.
   * @param assessmentId student assessment that need to be processed.
   * @returns result of the application start.
   */
  async startApplicationAssessment(
    workflowName: string,
    assessmentId: number,
  ): Promise<WorkflowStartResult> {
    try {
      return await this.workflowService.start(workflowName, {
        variables: {
          assessmentId: {
            value: assessmentId,
            type: "integer",
          },
        },
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
    } catch (error: unknown) {
      this.logger.error(
        `Error while sending Program Info completed message to instance id: ${processInstanceId}`,
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
   */
  async sendCRAIncomeVerificationCompletedMessage(
    incomeVerificationId: number,
  ): Promise<boolean> {
    try {
      await this.workflowService.sendMessage({
        messageName: `sims-cra-income-verification-complete-${incomeVerificationId}`,
        all: false, // false means that the message is correlated to exactly one entity.
      });
      return true;
    } catch (error: unknown) {
      this.logger.error(
        `Error while sending CRA income verification completed message using incomeVerificationId: ${incomeVerificationId}`,
      );
      this.logger.error(error);
      // The error is not thrown here, as we are failing silently.
    }

    return false;
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      this.logger.error(
        `Error while sending Confirm Confirmation of Enrollment (COE) message to instance id: ${processInstanceId}`,
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
      await this.workflowService.sendMessage({
        messageName: `sims-supporting-user-complete-${supportingUserId}`,
        all: false, // false means that the message is correlated to exactly one entity.
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
      await this.workflowService.sendMessage({
        messageName: `sims-application-exception-approval-${applicationExceptionId}`,
        all: false, // false means that the message is correlated to exactly one entity.
        processVariables: {
          exceptionsApprovalStatus: {
            value: status,
            type: "string",
          },
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

  @InjectLogger()
  logger: LoggerService;
}
