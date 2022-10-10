import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult, IsNull, Not } from "typeorm";
import {
  RecordDataModelService,
  Application,
  CRAIncomeVerification,
  SupportingUser,
} from "@sims/sims-db";

/**
 * Service layer for CRA income verifications.
 */
@Injectable()
export class CRAIncomeVerificationService extends RecordDataModelService<CRAIncomeVerification> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(CRAIncomeVerification));
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
