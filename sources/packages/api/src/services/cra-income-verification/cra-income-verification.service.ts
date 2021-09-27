import { Injectable, Inject } from "@nestjs/common";
import { Connection } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import { Application, CRAIncomeVerification } from "../../database/entities";

/**
 * Service layer for CRA income verifications.
 */
@Injectable()
export class CRAIncomeVerificationService extends RecordDataModelService<CRAIncomeVerification> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(CRAIncomeVerification));
  }

  async getPendingIncomeVerifications(): Promise<CRAIncomeVerification[]> {
    return this.repo
      .createQueryBuilder("incomeVerifications")
      .select([
        "incomeVerifications.id",
        "students.birthdate",
        "students.sin",
        "users.firstName",
        "users.lastName",
      ])
      .innerJoin("incomeVerifications.application", "applications")
      .innerJoin("applications.student", "students")
      .innerJoin("students.user", "users")
      .where("incomeVerifications.dateSent is null")
      .getMany();
  }

  async createIncomeVerification(
    applicationId: number,
    taxYear: number,
    reportedIncome: number,
  ): Promise<CRAIncomeVerification> {
    const newVerification = new CRAIncomeVerification();
    newVerification.application = { id: applicationId } as Application;
    newVerification.taxYear = taxYear;
    newVerification.reportedIncome = reportedIncome;
    return this.repo.save(newVerification);
  }

  async updateSentFile(
    craVerificationId: number,
    dateSent: Date,
    fileSent: string,
  ) {
    if (!!dateSent || !!fileSent) {
      throw new Error(
        "Not all required fields to update an income verification sent file were provided.",
      );
    }
    return this.repo.update(craVerificationId, { dateSent, fileSent });
  }

  async updateReceivedFile(
    craVerificationId: number,
    craReportedIncome: number,
    fileReceived: string,
    dateReceived: Date,
    matchStatus: string,
    requestStatus: string,
  ) {
    if (
      !!craReportedIncome ||
      !!fileReceived ||
      !!dateReceived ||
      !!matchStatus ||
      !!requestStatus
    ) {
      throw new Error(
        "Not all required fields to update an income verification received file were provided.",
      );
    }

    return this.repo.update(craVerificationId, {
      craReportedIncome,
      fileReceived,
      dateReceived,
      matchStatus,
      requestStatus,
    });
  }
}
