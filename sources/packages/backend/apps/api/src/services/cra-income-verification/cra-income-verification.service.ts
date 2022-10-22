import { Injectable } from "@nestjs/common";
import { DataSource, In, IsNull, Repository, UpdateResult } from "typeorm";
import { RecordDataModelService, CRAIncomeVerification } from "@sims/sims-db";

/**
 * Service layer for CRA income verifications.
 */
@Injectable()
export class CRAIncomeVerificationService extends RecordDataModelService<CRAIncomeVerification> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(CRAIncomeVerification));
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
        "sinValidation.id",
        "sinValidation.sin",
        "studentUser.firstName",
        "studentUser.lastName",
        "supportingUser.birthDate",
        "supportingUser.sin",
        "supportingUserUser.firstName",
        "supportingUserUser.lastName",
      ])
      .innerJoin("incomeVerification.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("student.user", "studentUser")
      .leftJoin("incomeVerification.supportingUser", "supportingUser")
      .leftJoin("supportingUser.user", "supportingUserUser")
      .where("incomeVerification.dateSent is null")
      .getMany();
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
   * the record will not be updated.
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
   * Get the student and supporting users (if any) income verification details for an applications.
   * @param applicationId application id.
   * @returns income verification details for an applications.
   */
  async getAllIncomeVerificationsForAnApplication(
    applicationId: number,
  ): Promise<CRAIncomeVerification[]> {
    return this.repo.find({
      select: {
        id: true,
        supportingUser: {
          id: true,
          supportingUserType: true,
        },
        dateReceived: true,
      },
      relations: {
        supportingUser: true,
      },
      where: {
        application: {
          id: applicationId,
        },
      },
    });
  }
}
