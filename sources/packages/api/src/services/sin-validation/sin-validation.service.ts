import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, UpdateResult } from "typeorm";
import {
  CRAPersonRecord,
  MatchStatusCodes,
  RequestStatusCodes,
} from "../../cra-integration/cra-integration.models";
import { SINValidation } from "../../database/entities";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { CRAResponseStatusRecord } from "../../cra-integration/cra-files/cra-response-status-record";

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
  ) {
    const sinValidationsToBeUpdated = craPersonRecords.map(
      (record) =>
        ({
          id: record.verificationId,
          dateSent: new Date(),
          fileSent,
          givenNameSent: record.givenName,
          surnameSent: record.surname,
          dobSent: record.birthDate,
        } as SINValidation),
    );
    return this.repo.save(sinValidationsToBeUpdated);
  }

  /**
   * Update the SIN validation information on a student that
   * is marked with a pending validation.
   * @param craRecord
   * @param fileReceived
   */
  async updatePendingSinValidation(
    verificationId: number,
    craRecord: CRAResponseStatusRecord,
    fileReceived: string,
  ): Promise<UpdateResult> {
    const isValidSIN =
      craRecord.requestStatusCode === RequestStatusCodes.successfulRequest &&
      craRecord.matchStatusCode === MatchStatusCodes.successfulMatch;
    return this.repo.update(
      { id: verificationId },
      {
        dateReceived: new Date(),
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
