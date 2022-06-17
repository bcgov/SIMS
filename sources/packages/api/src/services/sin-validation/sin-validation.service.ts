import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, EntityManager, Repository } from "typeorm";
import { SINValidation } from "../../database/entities";
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
   * @param sinValidationRepo when provided, it is used instead of the
   * local repository (this.repo). Useful when the command must be executed,
   * for instance, as part of an existing transaction manage externally to this
   * service.
   * @returns the result of the update.
   */
  async updateSentRecords(
    sinValidationRecords: SINValidationRecord[],
    fileSent: string,
    sinValidationRepo?: Repository<SINValidation>,
  ): Promise<SINValidation[]> {
    const dateSent = new Date();
    const recordsToUpdate = sinValidationRecords.map((record) => {
      const sinValidation = new SINValidation();
      sinValidation.id = record.sinValidationId;
      sinValidation.dateSent = dateSent;
      sinValidation.fileSent = fileSent;
      sinValidation.givenNameSent = record.firstName;
      sinValidation.surnameSent = record.lastName;
      sinValidation.dobSent = record.birthDate;
      return sinValidation;
    });
    const repo = sinValidationRepo ?? this.repo;
    return repo.save(recordsToUpdate);
  }

  async updateSINValidationFromESDCResponse(
    validationResponse: SINValidationFileResponse,
    isValidSIN: boolean,
    receivedFileName: string,
    processDate: Date,
  ): Promise<SINValidation> {
    const existingValidation = await this.repo
      .createQueryBuilder("sinValidation")
      .select([
        "sinValidation.dateReceived",
        "sinValidation.validSIN",
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
      .where("sinValidation.id = sinValidationId:", {
        sinValidationId: validationResponse.referenceIndex,
      })
      .getOne();

    if (!existingValidation) {
      throw new Error(
        `Not able to find the SIN validation id ${validationResponse.referenceIndex} to be updated with the ESDC response.`,
      );
    }

    const sinValidationNeverUpdated = !existingValidation.dateReceived;
    // Values t be updated from the ESDC response.
    const sinStatusString = (+validationResponse.sinCheckStatus).toString();
    existingValidation.dateReceived = processDate;
    existingValidation.fileReceived = receivedFileName;
    existingValidation.isValidSIN = isValidSIN;
    existingValidation.sinStatus = sinStatusString;
    existingValidation.validSIN = validationResponse.sinOkayFlag;
    existingValidation.validBirthdate = validationResponse.birthDateOkayFlag;
    existingValidation.validFirstName = validationResponse.firstNameOkayFlag;
    existingValidation.validLastName = validationResponse.lastNameOkayFlag;
    existingValidation.validGender = validationResponse.genderOkayFlag;

    if (sinValidationNeverUpdated) {
      // The SIN validation record was never updated before,
      // update it with the information received from ESDC.
      // This will be most common scenario.
      return this.repo.save(existingValidation);
    }

    if (existingValidation.sinStatus !== sinStatusString) {
      // The SIN validation is already present and the received status is different from
      // the existing one. It can happen when the status received is 2 (under review) and later
      // a new status will be received once the review is done, what means that one request can
      // result in more than one response. In this case, if the received record is the most updated
      // for the student a "cloned" record will be inserted.
      const mostUpdatedRecordDate = await this.repo
        .createQueryBuilder("sinValidation")
        .select("sinValidation.dateReceived")
        .innerJoin("sinValidation.user", "user")
        .where("user.id = :userId", {
          userId: existingValidation.user.id,
        })
        .getRawOne<Date>();
      if (processDate > mostUpdatedRecordDate) {
        // This will force the record to be inserted with all the values selected
        // during the initial SQL query.
        delete existingValidation.id;
        // Insert the new SIN validation and associate it with the student
        // as the most updated one to be used as a current.
        await this.studentService.updateSINValidationByUserId(
          existingValidation.user.id,
          existingValidation,
        );
        return existingValidation;
      }
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
