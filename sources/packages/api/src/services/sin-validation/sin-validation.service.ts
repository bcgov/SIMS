import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, Repository } from "typeorm";
import { SINValidation, User } from "../../database/entities";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { SINValidationRecord } from "../../esdc-integration/sin-validation/models/sin-validation-models";
import { SINValidationFileResponse } from "../../esdc-integration/sin-validation/sin-validation-files/sin-validation-file-response";
import { StudentService } from "../student/student.service";

/**
 * Service layer for SIN Validations.
 */
@Injectable()
export class SINValidationService extends RecordDataModelService<SINValidation> {
  constructor(
    connection: Connection,
    private readonly studentService: StudentService,
  ) {
    super(connection.getRepository(SINValidation));
  }

  /**
   * Once the SIN Validation request file is created, updates the
   * data that the file was uploaded.
   * @param sinValidationRecords records that are part of the generated
   * file that must have the file sent name and date updated.
   * @param fileSent filename sent for sin validation.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param sinValidationRepo when provided, it is used instead of the
   * local repository (this.repo). Useful when the command must be executed,
   * for instance, as part of an existing transaction manage externally to this
   * service.
   * @returns the result of the update.
   */
  async updateSentRecords(
    sinValidationRecords: SINValidationRecord[],
    fileSent: string,
    auditUserId: number,
    sinValidationRepo?: Repository<SINValidation>,
  ): Promise<SINValidation[]> {
    const dateSent = new Date();
    const auditUser = { id: auditUserId } as User;
    const recordsToUpdate = sinValidationRecords.map((record) => {
      const sinValidation = new SINValidation();
      sinValidation.id = record.sinValidationId;
      sinValidation.dateSent = dateSent;
      sinValidation.fileSent = fileSent;
      sinValidation.givenNameSent = record.firstName;
      sinValidation.surnameSent = record.lastName;
      sinValidation.dobSent = record.birthDate;
      sinValidation.modifier = auditUser;
      return sinValidation;
    });
    const repo = sinValidationRepo ?? this.repo;
    return repo.save(recordsToUpdate);
  }

  /**
   * Update the SIN validation record on DB based on the response from
   * the ESDC SIN validation response.
   * @param validationResponse SIN validation response from ESDC.
   * @param isValidSIN defines if, after system evaluation, the SIN
   * is considered valid or not.
   * @param receivedFileName file received with the SIN validation.
   * @param processDate date from the file received considered as
   * a processed date to be update in the DB as received date.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @returns updated SIN validation record.
   */
  async updateSINValidationFromESDCResponse(
    validationResponse: SINValidationFileResponse,
    isValidSIN: boolean,
    receivedFileName: string,
    processDate: Date,
    auditUserId: number,
  ): Promise<SINValidation> {
    const existingValidation = await this.repo
      .createQueryBuilder("sinValidation")
      .select([
        "sinValidation.id",
        "sinValidation.sinStatus",
        "sinValidation.dateReceived",
        "sinValidation.validSINCheck",
        "sinValidation.dateSent",
        "sinValidation.fileSent",
        "sinValidation.givenNameSent",
        "sinValidation.surnameSent",
        "sinValidation.dobSent",
        "sinValidation.temporarySIN",
        "sinValidation.sinExpireDate",
        "user.id",
      ])
      .innerJoin("sinValidation.user", "user")
      .where("sinValidation.id = :sinValidationId", {
        sinValidationId: validationResponse.referenceIndex,
      })
      .getOne();

    if (!existingValidation) {
      throw new Error(
        `Not able to find the SIN validation id ${validationResponse.referenceIndex} to be updated with the ESDC response.`,
      );
    }

    const sinValidationNeverUpdated = !existingValidation.dateReceived;
    const sinStatusChanged =
      existingValidation.sinStatus !== validationResponse.sinCheckStatus;

    // Values t be updated from the ESDC response.
    existingValidation.dateReceived = processDate;
    existingValidation.fileReceived = receivedFileName;
    existingValidation.isValidSIN = isValidSIN;
    existingValidation.sinStatus = validationResponse.sinCheckStatus;
    existingValidation.validSINCheck = validationResponse.sinOkayFlag;
    existingValidation.validBirthdateCheck =
      validationResponse.birthDateOkayFlag;
    existingValidation.validFirstNameCheck =
      validationResponse.firstNameOkayFlag;
    existingValidation.validLastNameCheck = validationResponse.lastNameOkayFlag;
    existingValidation.validGenderCheck = validationResponse.genderOkayFlag;
    existingValidation.modifier = { id: auditUserId } as User;

    if (sinValidationNeverUpdated) {
      // The SIN validation record was never updated before,
      // update it with the information received from ESDC.
      // This will be most common scenario.
      return this.repo.save(existingValidation);
    }

    if (sinStatusChanged) {
      // The SIN validation is already present and the received status is different from
      // the existing one. It can happen when the status received is 2 (under review) and later
      // a new status will be received once the review is done, what means that one request can
      // result in more than one response. In this case, if the received record is the most updated
      // for the student, a "cloned" record will be inserted.
      const mostUpdatedRecordDate = await this.repo
        .createQueryBuilder("sinValidation")
        .select("MAX(sinValidation.dateReceived)", "maxDate")
        .innerJoin("sinValidation.user", "user")
        .where("user.id = :userId", {
          userId: existingValidation.user.id,
        })
        .getRawOne();
      if (processDate > mostUpdatedRecordDate.maxDate) {
        // This will force the record to be inserted with all the values selected
        // during the initial SQL query.
        delete existingValidation.id;
        // Insert the new SIN validation and associate it with the student
        // as the most updated one to be used as a current.
        await this.studentService.updateSINValidationByUserId(
          existingValidation.user.id,
          existingValidation,
          auditUserId,
        );
        return existingValidation;
      }
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
