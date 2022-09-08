import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { DataSource, Repository } from "typeorm";
import {
  NoteType,
  SINValidation,
  Student,
  User,
} from "../../database/entities";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import {
  SINValidationRecord,
  SINValidationUpdateResult,
} from "../../esdc-integration/sin-validation/models/sin-validation-models";
import { StudentService } from "../student/student.service";
import { SINValidationFileResponse } from "./sin-validation.service.models";
import { CustomNamedError, removeWhiteSpaces } from "../../utilities";
import {
  SIN_VALIDATION_RECORD_INVALID_OPERATION,
  SIN_VALIDATION_RECORD_NOT_FOUND,
} from "../../constants";

/**
 * Service layer for SIN Validations.
 */
@Injectable()
export class SINValidationService extends RecordDataModelService<SINValidation> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentService: StudentService,
  ) {
    super(dataSource.getRepository(SINValidation));
  }

  /**
   * Get the history of the SIN validations associated with a user.
   * @param studentId student id to be verified.
   * @returns SIN validations history.
   */
  async getSINValidationsByStudentId(
    studentId: number,
  ): Promise<SINValidation[]> {
    return this.repo.find({
      select: {
        id: true,
        sin: true,
        createdAt: true,
        isValidSIN: true,
        sinStatus: true,
        validSINCheck: true,
        validBirthdateCheck: true,
        validFirstNameCheck: true,
        validLastNameCheck: true,
        validGenderCheck: true,
        temporarySIN: true,
        sinExpiryDate: true,
      },
      where: { student: { id: studentId } },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Creates a new SIN validation entry associated with the student.
   * This entry will be updated in the student record as the one that represents
   * the current state of the SIN validation.
   * @param studentId student id to create the SIN validation record.
   * @param sin student SIN.
   * @param skipValidations defines if the ESDC SIN validation must be skipped and the SIN
   * should be considered valid.
   * @param noteDescription note description for the SIN creation.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns newly created SIN record.
   */
  async createSINValidation(
    studentId: number,
    sin: string,
    skipValidations: boolean,
    noteDescription: string,
    auditUserId: number,
  ): Promise<SINValidation> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const student = await this.studentService.getStudentById(studentId);
      const auditUser = { id: auditUserId } as User;
      const savedNote = await this.studentService.createStudentNote(
        studentId,
        NoteType.General,
        noteDescription,
        auditUserId,
        transactionalEntityManager,
      );
      const now = new Date();
      // Create the new SIN validation record.
      const newSINValidation = new SINValidation();
      newSINValidation.sin = removeWhiteSpaces(sin);
      newSINValidation.sinEditedBy = auditUser;
      newSINValidation.sinEditedDate = now;
      newSINValidation.sinEditedNote = savedNote;
      newSINValidation.creator = auditUser;
      newSINValidation.createdAt = now;
      newSINValidation.student = student;
      if (skipValidations) {
        newSINValidation.isValidSIN = true;
        newSINValidation.dateReceived = now;
      }
      const createdSINValidation = await transactionalEntityManager
        .getRepository(SINValidation)
        .save(newSINValidation);
      // Update the student table with the created SIN validation record.
      await transactionalEntityManager
        .getRepository(Student)
        .update(studentId, { sinValidation: createdSINValidation });
      return createdSINValidation;
    });
  }

  /**
   * Updates the SIN validation record adding an expire date.
   * Only a temporary SIN can be updated.
   * @param sinValidationId SIN validation record id to be updated.
   * @param studentId student to receive the note.
   * @param expiryDate expiry date to be set.
   * @param noteDescription note description.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns updated SIN validation record.
   */
  async updateSINValidation(
    sinValidationId: number,
    studentId: number,
    expiryDate: Date,
    noteDescription: string,
    auditUserId: number,
  ): Promise<SINValidation> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Get the record to be updated.
      const sinValidationRepo =
        transactionalEntityManager.getRepository(SINValidation);
      const sinToBeUpdated = await sinValidationRepo
        .createQueryBuilder("sinValidation")
        .select([
          "sinValidation.id",
          "sinValidation.temporarySIN",
          "sinValidation.sinExpiryDate",
        ])
        .where("sinValidation.id = :sinValidationId", { sinValidationId })
        .andWhere("sinValidation.student.id = :studentId", { studentId })
        .getOne();

      if (!sinToBeUpdated) {
        throw new CustomNamedError(
          "SIN validation record not found or it does not belong to the student.",
          SIN_VALIDATION_RECORD_NOT_FOUND,
        );
      }

      if (!sinToBeUpdated.temporarySIN) {
        throw new CustomNamedError(
          "Not able to update the record. Only a temporary SIN ca be updated.",
          SIN_VALIDATION_RECORD_INVALID_OPERATION,
        );
      }

      if (sinToBeUpdated.sinExpiryDate) {
        throw new CustomNamedError(
          "The SIN validation record expiry date is already set and cannot be updated again.",
          SIN_VALIDATION_RECORD_INVALID_OPERATION,
        );
      }

      const auditUser = { id: auditUserId } as User;
      const now = new Date();
      const savedNote = await this.studentService.createStudentNote(
        studentId,
        NoteType.General,
        noteDescription,
        auditUserId,
        transactionalEntityManager,
      );
      // Update the SIN validation record.
      sinToBeUpdated.sinExpiryDate = expiryDate;
      sinToBeUpdated.expiryDateEditedBy = auditUser;
      sinToBeUpdated.expiryDateEditedDate = now;
      sinToBeUpdated.expiryDateEditedNote = savedNote;
      sinToBeUpdated.modifier = auditUser;
      sinToBeUpdated.updatedAt = now;
      return sinValidationRepo.save(sinToBeUpdated);
    });
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
      sinValidation.genderSent = record.gender;
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
   * @returns updated SIN validation record with operation description.
   */
  async updateSINValidationFromESDCResponse(
    validationResponse: SINValidationFileResponse,
    isValidSIN: boolean,
    receivedFileName: string,
    processDate: Date,
    auditUserId: number,
  ): Promise<SINValidationUpdateResult> {
    let operationDescription: string;
    // If the list of the selected columns must be changed please keep in mind that
    // these fields are also the ones used later to "clone" the record if needed,
    // as explained further along the method.
    const existingValidation = await this.repo
      .createQueryBuilder("sinValidation")
      .select([
        "sinValidation.id",
        "sinValidation.sin",
        "sinValidation.sinStatus",
        "sinValidation.dateReceived",
        "sinValidation.validSINCheck",
        "sinValidation.dateSent",
        "sinValidation.fileSent",
        "sinValidation.givenNameSent",
        "sinValidation.surnameSent",
        "sinValidation.dobSent",
        "sinValidation.genderSent",
        "sinValidation.temporarySIN",
        "sinValidation.sinExpiryDate",
        "student.id",
      ])
      .innerJoin("sinValidation.student", "student")
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

    // Values to be updated from the ESDC response.
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
      operationDescription = "SIN validation record updated.";
      const updatedRecord = await this.repo.save(existingValidation);
      return {
        operationDescription,
        record: updatedRecord,
      };
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
        .innerJoin("sinValidation.student", "student")
        .where("student.id = :student", {
          student: existingValidation.student.id,
        })
        .getRawOne();
      if (processDate > mostUpdatedRecordDate.maxDate) {
        // This will force the record to be inserted with all the values selected
        // during the initial SQL query.
        delete existingValidation.id;
        // Insert the new SIN validation and associate it with the student
        // as the most updated one to be used as a current.
        await this.studentService.updateSINValidationByStudentId(
          existingValidation.student.id,
          existingValidation,
          auditUserId,
        );
        operationDescription = `Created a new SIN validation because the record id is already present and updated.`;
        const clonedRecord = await this.repo.save(existingValidation);
        return {
          operationDescription,
          record: clonedRecord,
        };
      }
      operationDescription =
        "No SIN validation was updated because the record id is already present and this is not the most updated.";
      return {
        operationDescription,
        record: existingValidation,
      };
    }
    operationDescription =
      "SIN validation skipped because it is already processed and updated.";
    return {
      operationDescription,
      record: existingValidation,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
