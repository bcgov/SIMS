import { Injectable, Inject } from "@nestjs/common";
import { Connection, In, IsNull, Repository, UpdateResult } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  Application,
  CRAIncomeVerification,
  SupportingUser,
} from "../../database/entities";
import { WorkflowActionsService } from "../workflow/workflow-actions.service";
import { getUTCNow } from "../../utilities";
import {
  InactiveCodes,
  MatchStatusCodes,
  RequestStatusCodes,
} from "../../cra-integration/cra-integration.models";

// Dummy files names for CRA income send/receive simulation process.
const DUMMY_BYPASS_CRA_SENT_FILE = "DUMMY_BYPASS_CRA_SENT_FILE.txt";
const DUMMY_BYPASS_CRA_RECEIVED_FILE = "DUMMY_BYPASS_CRA_RECEIVED_FILE.txt";
const RETRY_BYPASS_CRA_RECEIVED_FILE_ATTEMPTS = 5;
const RETRY_BYPASS_CRA_RECEIVED_FILE_TIME = 2000;

/**
 * Service layer for CRA income verifications.
 */
@Injectable()
export class CRAIncomeVerificationService extends RecordDataModelService<CRAIncomeVerification> {
  constructor(
    @Inject("Connection") connection: Connection,
    private readonly workflowService: WorkflowActionsService,
  ) {
    super(connection.getRepository(CRAIncomeVerification));
  }

  /**
   * Get one income verification record associated
   * with a Student Application. The records could
   * be related to a student income or some other
   * supporting user (e.g. parent/partner).
   * @param applicationId application id to retrieve the income.
   * @returns one income verification for the application.
   */
  async getIncomeVerificationForApplication(
    applicationId: number,
    incomeVerificationId: number,
  ): Promise<CRAIncomeVerification> {
    return this.repo
      .createQueryBuilder("incomeVerifications")
      .select([
        "incomeVerifications.reportedIncome",
        "incomeVerifications.craReportedIncome",
        "incomeVerifications.dateReceived",
      ])
      .where("incomeVerifications.id = :incomeVerificationId", {
        incomeVerificationId,
      })
      .andWhere("incomeVerifications.application.id = :applicationId", {
        applicationId,
      })
      .getOne();
  }

  /**
   * Gets income verifications that were never sent to CRA (dateSent is null).
   * Once sent, there is no mechanism in place for a retry logic.
   * @returns pending income verifications.
   */
  async getPendingIncomeVerifications(): Promise<CRAIncomeVerification[]> {
    return this.repo
      .createQueryBuilder("incomeVerification")
      .select([
        "incomeVerification.id",
        "incomeVerification.taxYear",
        "application.id",
        "student.birthDate",
        "student.sin",
        "studentUser.firstName",
        "studentUser.lastName",
        "supportingUser.birthDate",
        "supportingUser.sin",
        "supportingUserUser.firstName",
        "supportingUserUser.lastName",
      ])
      .innerJoin("incomeVerification.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "studentUser")
      .leftJoin("incomeVerification.supportingUser", "supportingUser")
      .leftJoin("supportingUser.user", "supportingUserUser")
      .where("incomeVerification.dateSent is null")
      .getMany();
  }

  /**
   * Creates a CRA Income Verification record that will be waiting
   * to be send to CRA and receive a response.
   * @param applicationId related application id that contains the
   * student information that will be used to send the data to CRA.
   * @param taxYear tax year to retrieve the income information.
   * @param reportedIncome income reported by the user in the Student
   * Application. This is the income that will be verified on CRA.
   * @param [supportingUserId] when the income is not related to the
   * student itself it will belong to a supporting user (e.g. parent/partner).
   * @returns income Verification record created.
   */
  async createIncomeVerification(
    applicationId: number,
    taxYear: number,
    reportedIncome: number,
    supportingUserId?: number,
  ): Promise<CRAIncomeVerification> {
    const newVerification = new CRAIncomeVerification();
    newVerification.application = { id: applicationId } as Application;
    newVerification.taxYear = taxYear;
    newVerification.reportedIncome = reportedIncome;
    if (supportingUserId) {
      newVerification.supportingUser = {
        id: supportingUserId,
      } as SupportingUser;
    }
    return this.repo.save(newVerification);
  }

  /**
   * Once the CRA request file is created, updates the fields
   * with the information about the generated file and the
   * date that the file was uploaded.
   * @param craVerificationIds records that are part of the generated
   * file that must have the file sent name and date updated.
   * @param dateSent date that the file was uploaded.
   * @param fileSent file name of the uploaded file.
   * @param [externalRepo] when provided, it is used instead of the
   * local repository (this.repo). Useful when the command must be executed,
   * for instance, as part of an existing transaction manage externally to this
   * service.
   * @returns the result of the update.
   */
  async updateSentFile(
    craVerificationIds: number[],
    dateSent: Date,
    fileSent: string,
    externalRepo?: Repository<CRAIncomeVerification>,
  ) {
    if (!dateSent || !fileSent) {
      throw new Error(
        "Not all required fields to update an income verification sent file were provided.",
      );
    }
    const repository = externalRepo ?? this.repo;
    return repository.update(
      { id: In(craVerificationIds) },
      { dateSent, fileSent },
    );
  }

  /**
   * Once the CRA response file is processed, updates the
   * CRA income verification record on the database with the
   * information received. If the information was already received
   * the record will not b updated.
   * @param craVerificationId CRA verification record to be updated.
   * @param fileReceived name of the response file received.
   * @param dateReceived date that the file was received.
   * @param matchStatus CRA match status for first name, last name
   * DOB and SIN.
   * @param requestStatus CRA request status for the income
   * verification request executed.
   * @param inactiveCode CRA record inactive code for the tax payer.
   * @param craReportedIncome if present, the total income for
   * the requested tax year returned by CRA.
   * @returns update result. Only one row is supposed to be affected.
   */
  async updateReceivedFile(
    craVerificationId: number,
    fileReceived: string,
    dateReceived: Date,
    matchStatusCode: string,
    requestStatusCode: string,
    inactiveCode: string,
    craReportedIncome?: number,
  ): Promise<UpdateResult> {
    if (
      !fileReceived ||
      !dateReceived ||
      !matchStatusCode ||
      !requestStatusCode ||
      !inactiveCode
    ) {
      throw new Error(
        "Not all required fields to update a received income verification file were provided.",
      );
    }

    return this.repo.update(
      { id: craVerificationId, dateReceived: IsNull() },
      {
        craReportedIncome,
        fileReceived,
        dateReceived,
        matchStatusCode,
        requestStatusCode,
        inactiveCode,
      },
    );
  }

  /**
   * This method allows the simulation of a complete cycle of the CRA send/response
   * process that allows the workflow to proceed without the need of the actual
   * CRA verification happens. This is enabled based in a environment variable,
   * that is by default disabled and should ne enabled only for DEV purposes on
   * local developer machine or on an environment where the CRA process is not enabled.
   * !This code should not be executed on production.
   * @param verificationId CRA verification id waiting to be processed.
   */
  async checkForCRAIncomeVerificationBypass(verificationId: number) {
    const now = getUTCNow();
    await this.updateSentFile(
      [verificationId],
      now,
      DUMMY_BYPASS_CRA_SENT_FILE,
    );
    await this.updateReceivedFile(
      verificationId,
      DUMMY_BYPASS_CRA_RECEIVED_FILE,
      now,
      MatchStatusCodes.successfulMatch,
      RequestStatusCodes.successfulRequest,
      InactiveCodes.inactiveCodeNotSet,
    );

    // !This is not a production code.
    // While trying to bypass the CRA validation for non-prod
    // environments, sometimes there is a delay between the API
    // call and the workflow reaching the wait event. This code
    // is a temporary fix since we do not have a retry strategy
    // to handle failed HTTP requests.
    for (let i = 0; i < RETRY_BYPASS_CRA_RECEIVED_FILE_ATTEMPTS; i++) {
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_BYPASS_CRA_RECEIVED_FILE_TIME),
      );
      const success =
        await this.workflowService.sendCRAIncomeVerificationCompletedMessage(
          verificationId,
        );
      if (success) {
        break;
      }
    }
  }
}
