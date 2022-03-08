import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, IsNull, Repository } from "typeorm";
import {
  CRAPersonRecord,
  MatchStatusCodes,
  RequestStatusCodes,
} from "../../cra-integration/cra-integration.models";
import { getUTCNow } from "../../utilities";
import { SINValidation } from "../../database/entities";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { CRAResponseStatusRecord } from "src/cra-integration/cra-files/cra-response-status-record";

/**
 * Service layer for SIN Validations.
 */
@Injectable()
export class SINValidationService extends RecordDataModelService<SINValidation> {
  constructor(connection: Connection) {
    super(connection.getRepository(SINValidation));
  }

  /**
   * Once the SIN Validation request file is created, updates the
   * date that the file was uploaded.
   * @param craPersonRecords records that are part of the generated
   * file that must have the file sent name and date updated.
   * @param fileSent filename sent for sin validation.
   * @param [externalRepo] when provided, it is used instead of the
   * local repository (this.repo). Useful when the command must be executed,
   * for instance, as part of an existing transaction manage externally to this
   * service.
   * @returns the result of the update.
   */
  async updateRecordsInSentFile(
    craPersonRecords: CRAPersonRecord[],
    fileSent: string,
    externalRepo?: Repository<SINValidation>,
  ) {
    for (const craPersonRecord of craPersonRecords) {
      if (!craPersonRecord.userId) {
        throw new Error(
          "User Id is not provided to update the SIN Validation records.",
        );
      }
      this.logger.log(
        `SIN Validation table update for user: ${craPersonRecord.userId}`,
      );
      const repository = externalRepo ?? this.repo;
      return repository.update(
        {
          user: { id: craPersonRecord.userId },
          dateSent: IsNull(),
          dateReceived: IsNull(),
        },
        {
          dateSent: getUTCNow(),
          fileSent,
          givenNameSent: craPersonRecord.givenName,
          surnameSent: craPersonRecord.surname,
          dobSent: craPersonRecord.birthDate,
        },
      );
    }
  }

  /**
   * Once the SIN Validation request file is created, updates the
   * date that the file was uploaded.
   * @param craPersonRecords records that are part of the generated
   * file that must have the file sent name and date updated.
   * @param fileSent filename sent for sin validation.
   * @param [externalRepo] when provided, it is used instead of the
   * local repository (this.repo). Useful when the command must be executed,
   * for instance, as part of an existing transaction manage externally to this
   * service.
   * @returns the result of the update.
   */
  async updateRecordsInReceivedFile(
    craRecord: CRAResponseStatusRecord,
    fileReceived: string,
    userId: number,
  ) {
    const isValidSIN =
      craRecord.requestStatusCode === RequestStatusCodes.successfulRequest &&
      craRecord.matchStatusCode === MatchStatusCodes.successfulMatch;
    return this.repo.update(
      {
        user: { id: userId },
        dateReceived: IsNull(),
        fileReceived: IsNull(),
        isValidSIN: IsNull(),
      },
      {
        dateReceived: getUTCNow(),
        fileReceived,
        isValidSIN,
        requestStatusCode: craRecord.requestStatusCode,
        matchStatusCode: craRecord.matchStatusCode,
        sinMatchStatusCode: craRecord.sinMatchStatusCode,
        surnameMatchStatusCode: craRecord.surnameMatchStatusCode,
        givenNameMatchStatusCode: craRecord.givenNameMatchStatusCode,
        birthDateMatchStatusCode: craRecord.birthDateMatchStatusCode,
      },
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
