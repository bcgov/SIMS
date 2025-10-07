import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  RecordDataModelService,
  NoteType,
  SINValidation,
  Student,
  User,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { removeWhiteSpaces } from "../../utilities";
import {
  SIN_VALIDATION_RECORD_INVALID_OPERATION,
  SIN_VALIDATION_RECORD_NOT_FOUND,
} from "../../constants";
import { NoteSharedService } from "@sims/services";

/**
 * Service layer for SIN Validations.
 */
@Injectable()
export class SINValidationService extends RecordDataModelService<SINValidation> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly noteSharedService: NoteSharedService,
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
      const auditUser = { id: auditUserId } as User;
      const savedNote = await this.noteSharedService.createStudentNote(
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
      newSINValidation.student = { id: studentId } as Student;
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
    expiryDate: string,
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
      const savedNote = await this.noteSharedService.createStudentNote(
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
}
