import { Injectable, Inject } from "@nestjs/common";
import { Connection, In, IsNull, Repository, UpdateResult } from "typeorm";
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

  /**
   * Gets income verifications that were never sent to CRA (dateSent is null).
   * Once sent, there is no mechanism in place for a retry logic.
   * @returns pending income verifications.
   */
  async getPendingIncomeVerifications(): Promise<CRAIncomeVerification[]> {
    return this.repo
      .createQueryBuilder("incomeVerifications")
      .select([
        "incomeVerifications.id",
        "applications.id",
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

  /**
   * Creates a CRA Income Verification record that will be waiting
   * to be send to CRA and receive a response.
   * @param applicationId related application id that contains the
   * student information that will be used to send the data to CRA.
   * @param taxYear tax year to retrieve the income information.
   * @param reportedIncome income reported by the user in the Student
   * Application. This is the income that will be verified on CRA.
   * @returns Income Verification record created.
   */
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
   * @param craReportedIncome if present, the total income for
   * the requested tax year returned by CRA.
   * @returns update result. Only one row is supposed to be affected.
   */
  async updateReceivedFile(
    craVerificationId: number,
    fileReceived: string,
    dateReceived: Date,
    matchStatus: string,
    requestStatus: string,
    craReportedIncome?: number,
  ): Promise<UpdateResult> {
    if (!fileReceived || !dateReceived || !matchStatus || !requestStatus) {
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
        matchStatus,
        requestStatus,
      },
    );
  }
}
