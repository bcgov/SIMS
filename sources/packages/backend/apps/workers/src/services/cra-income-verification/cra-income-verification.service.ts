import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult, IsNull, Not } from "typeorm";
import {
  RecordDataModelService,
  Application,
  CRAIncomeVerification,
  SupportingUser,
} from "@sims/sims-db";
import { ConfigService } from "@sims/utilities/config";
import { WorkflowClientService } from "@sims/services";

/**
 * Service layer for CRA income verifications.
 */
@Injectable()
export class CRAIncomeVerificationService extends RecordDataModelService<CRAIncomeVerification> {
  constructor(
    dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly workflowClientService: WorkflowClientService,
  ) {
    super(dataSource.getRepository(CRAIncomeVerification));
  }

  /**
   * Creates a CRA Income Verification record that will be waiting
   * to be sent to CRA and receive a response.
   * @param applicationId related application id that contains the
   * student information that will be used to send the data to CRA.
   * @param taxYear tax year to retrieve the income information.
   * @param reportedIncome income reported by the user in the.
   * This is the income that will be verified on CRA.
   * @param supportingUserId when the income is not related to the
   * student itself it will belong to a supporting user (e.g. parent/partner).
   * @returns inert result of the income verification record created.
   */
  async createIncomeVerification(
    applicationId: number,
    taxYear: number,
    reportedIncome: number,
    supportingUserId?: number,
  ): Promise<InsertResult> {
    const newVerification = new CRAIncomeVerification();
    newVerification.application = { id: applicationId } as Application;
    newVerification.taxYear = taxYear;
    newVerification.reportedIncome = reportedIncome;
    if (supportingUserId) {
      newVerification.supportingUser = {
        id: supportingUserId,
      } as SupportingUser;
    }
    return this.repo.insert(newVerification);
  }

  /**
   * This method allows the simulation of a complete cycle of the CRA send/response
   * process that allows the workflow to proceed without the need of the actual
   * CRA verification happens. This is enabled based in a environment variable,
   * that is by default disabled and should be enabled only for DEV purposes on
   * local developer machine or on an environment where the CRA process is not enabled.
   * !This code should not be executed on production.
   * @param verificationId CRA verification id waiting to be processed.
   * @param reportedIncome reported income by the user.
   */
  async checkForCRAIncomeVerificationBypass(
    verificationId: number,
    reportedIncome: number,
  ): Promise<void> {
    if (this.configService.bypassCRAIncomeVerification !== true) {
      return;
    }
    const now = new Date();
    await this.repo.update(
      { id: verificationId, dateReceived: IsNull() },
      {
        dateSent: now,
        dateReceived: now,
        fileSent: "DUMMY_BYPASS_CRA_SENT_FILE.txt",
        fileReceived: "DUMMY_BYPASS_CRA_RECEIVED_FILE.txt",
        matchStatusCode: "01",
        requestStatusCode: "01",
        inactiveCode: "00",
        // When the income verification is bypassed, set the CRA reported income as the user reported income.
        craReportedIncome: reportedIncome,
      },
    );
    await this.workflowClientService.sendCRAIncomeVerificationCompletedMessage(
      verificationId,
    );
  }

  /**
   * Checks is an income verification was completed.
   * @param incomeVerificationId income verification to be checked.
   * @returns true if the income verification was completed, otherwise, false.
   */
  async isIncomeVerificationCompleted(
    incomeVerificationId: number,
  ): Promise<boolean> {
    const incomeVerification = await this.repo.findOne({
      select: { id: true },
      where: { id: incomeVerificationId, dateReceived: Not(IsNull()) },
    });
    return !!incomeVerification;
  }
}
