import { Injectable } from "@nestjs/common";
import { Brackets, In, IsNull, Repository, UpdateResult } from "typeorm";
import { CRAIncomeVerification } from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Service layer for CRA income verifications.
 */
@Injectable()
export class CRAIncomeVerificationsService {
  constructor(
    @InjectRepository(CRAIncomeVerification)
    private readonly craIncomeVerificationRepo: Repository<CRAIncomeVerification>,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Gets income verifications that were never sent to CRA (dateSent is null),
   * and there is an associated SIN (either student or supporting user).
   * Once sent, there is no mechanism in place for a retry logic.
   * @returns pending income verifications.
   */
  async getPendingIncomeVerifications(): Promise<CRAIncomeVerification[]> {
    return this.craIncomeVerificationRepo
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
      .where("incomeVerification.dateSent IS NULL")
      .andWhere(
        new Brackets((qb) => {
          // Supporting user is not associated, which means it is a student,
          // or the supporting user is associated and has a SIN.
          qb.where("supportingUser.id IS NULL").orWhere(
            "supportingUser.sin IS NOT NULL",
          );
        }),
      )
      .orderBy("incomeVerification.id", "ASC")
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
  ): Promise<UpdateResult> {
    if (!dateSent || !fileSent) {
      throw new Error(
        "Not all required fields to update an income verification sent file were provided.",
      );
    }
    const repository = externalRepo ?? this.craIncomeVerificationRepo;
    return repository.update(
      { id: In(craVerificationIds) },
      {
        dateSent,
        fileSent,
        modifier: this.systemUsersService.systemUser,
        updatedAt: new Date(),
      },
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
    return this.craIncomeVerificationRepo.update(
      { id: craVerificationId, dateReceived: IsNull() },
      {
        craReportedIncome,
        fileReceived,
        dateReceived,
        matchStatusCode,
        requestStatusCode,
        inactiveCode,
        modifier: this.systemUsersService.systemUser,
        updatedAt: new Date(),
      },
    );
  }
}
