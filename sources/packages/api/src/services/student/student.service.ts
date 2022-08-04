import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  Application,
  ApplicationStatus,
  Student,
  User,
  Note,
  NoteType,
  SINValidation,
} from "../../database/entities";
import { DataSource, EntityManager } from "typeorm";
import { UserInfo } from "../../types";
import { StudentUserToken } from "../../auth/userToken.interface";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import {
  getDateOnly,
  getUTCNow,
  removeWhiteSpaces,
  transformAddressDetails,
} from "../../utilities";
import { StudentInfo } from "./student.service.models";
import { SFASIndividualService } from "../sfas/sfas-individual.service";
import * as dayjs from "dayjs";
import { StudentUser } from "../../database/entities/student-user.model";

@Injectable()
export class StudentService extends RecordDataModelService<Student> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly sfasIndividualService: SFASIndividualService,
  ) {
    super(dataSource.getRepository(Student));
    this.logger.log("[Created]");
  }

  async getStudentByUserName(userName: string): Promise<Student> {
    const student = await this.repo
      .createQueryBuilder("student")
      .leftJoinAndSelect("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .select([
        "student",
        "user",
        "sinValidation.isValidSIN",
        "sinValidation.id",
      ])
      .where("user.userName = :userNameParam", { userNameParam: userName })
      .getOne();
    return student;
  }

  /**
   * Gets the student by id.
   * @param studentId student id.
   * @returns the student found or null.
   */
  async getStudentById(studentId: number): Promise<Student> {
    return this.repo
      .createQueryBuilder("student")
      .select([
        "student.id",
        "student.birthDate",
        "student.gender",
        "student.contactInfo",
        "student.studentPDVerified",
        "student.studentPDSentAt",
        "student.studentPDUpdateAt",
        "sinValidation.id",
        "sinValidation.sin",
        "sinValidation.isValidSIN",
        "user.id",
        "user.firstName",
        "user.lastName",
        "user.email",
      ])
      .innerJoin("student.user", "user")
      .leftJoin("student.sinValidation", "sinValidation")
      .where("student.id = :studentId", { studentId })
      .getOne();
  }

  /**
   * Check if the student id exists on DB.
   * @param studentId student to be verified.
   * @returns true if the student was found, otherwise false.
   */
  async studentExists(studentId: number): Promise<boolean> {
    const studentFound = this.repo.findOne({
      select: { id: true },
      where: { id: studentId },
    });
    return !!studentFound;
  }

  async getStudentByUserId(userId: number): Promise<Student> {
    return this.repo.findOne({ where: { user: { id: userId } } });
  }

  /**
   * Creates the student checking for an existing user to be used or
   * creating a new one in case the user id is not provided.
   * The user could be already available in the case of the same user
   * was authenticated previously on another portal (e.g. parent/partner).
   * @param userInfo information needed to create the user.
   * @param otherInfo information received to create the student.
   * @returns created student.
   */
  async createStudent(
    userInfo: UserInfo,
    otherInfo: StudentInfo,
  ): Promise<Student> {
    const user = new User();
    if (userInfo.userId) {
      user.id = userInfo.userId;
    }

    const studentSIN = removeWhiteSpaces(otherInfo.sinNumber);
    const sinValidation = new SINValidation();
    sinValidation.sin = studentSIN;
    sinValidation.user = user;
    user.userName = userInfo.userName;
    user.email = userInfo.email;
    user.firstName = userInfo.givenNames;
    user.lastName = userInfo.lastName;
    user.creator = user;

    const student = new Student();
    student.user = user;
    student.birthDate = getDateOnly(userInfo.birthdate);
    student.gender = userInfo.gender;
    student.contactInfo = {
      address: transformAddressDetails(otherInfo),
      phone: otherInfo.phone,
    };
    student.user = user;
    student.sinValidation = sinValidation;

    try {
      // Get PD status from SFAS integration data.
      student.studentPDVerified = await this.sfasIndividualService.getPDStatus(
        user.lastName,
        student.birthDate,
        studentSIN,
      );
    } catch (error) {
      this.logger.error("Unable to get SFAS information of student.");
      this.logger.error(error);
      throw error;
    }

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Creates the new user and student.
      const newStudent = await transactionalEntityManager
        .getRepository(Student)
        .save(student);
      // Create the new entry in the student/user history/audit.
      const studentUser = new StudentUser();
      studentUser.user = user;
      studentUser.student = student;
      studentUser.creator = user;
      await transactionalEntityManager
        .getRepository(StudentUser)
        .save(studentUser);
      // Returns the newly created student.
      return newStudent;
    });
  }

  /**
   * Updates the student contact information.
   * @param studentId student to be updated.
   * @param contact contact information to be updated.
   * @returns updated student.
   */
  async updateStudentContactByStudentId(
    studentId: number,
    contact: StudentInfo,
  ): Promise<Student> {
    const student = new Student();
    student.id = studentId;
    student.contactInfo = {
      address: transformAddressDetails(contact),
      phone: contact.phone,
    };

    return this.save(student);
  }

  /**
   * Use the information available in the authentication token to update
   * the user and student data currently on DB.
   * @param studentToken student authentication token.
   * @returns updated student, if some data was changed.
   */
  async synchronizeFromUserToken(
    studentToken: StudentUserToken,
  ): Promise<Student> {
    const studentToSync = await this.getStudentByUserName(
      studentToken.userName,
    );
    let mustSave = false;
    if (studentToken.givenNames === undefined) {
      studentToken.givenNames = null;
    }
    if (
      !dayjs(studentToken.birthdate).isSame(studentToSync.birthDate) ||
      studentToken.lastName !== studentToSync.user.lastName ||
      studentToken.givenNames !== studentToSync.user.firstName
    ) {
      const sinValidation = new SINValidation();
      studentToSync.birthDate = getDateOnly(studentToken.birthdate);
      studentToSync.user.lastName = studentToken.lastName;
      studentToSync.user.firstName = studentToken.givenNames;
      sinValidation.user = studentToSync.user;
      studentToSync.sinValidation = sinValidation;
      mustSave = true;
    }
    // This condition is not added above, as email and gender does not trigger SIN validation request.
    if (
      studentToken.email !== studentToSync.user.email ||
      studentToken.gender !== studentToSync.gender
    ) {
      studentToSync.user.email = studentToken.email;
      studentToSync.gender = studentToken.gender;
      mustSave = true;
    }

    if (mustSave) {
      studentToSync.modifier = { id: studentToken.userId } as User;
      return await this.save(studentToSync);
    }

    // If information between token and SABC DB is same, then just returning without the database call.
    return studentToSync;
  }

  /**
   * Gets all the students that have the SIN validation pending.
   * @returns Students pending SIN validation.
   */
  async getStudentsPendingSinValidation(): Promise<Student[]> {
    return this.repo
      .createQueryBuilder("student")
      .select([
        "student.id",
        "student.birthDate",
        "student.gender",
        "user.firstName",
        "user.lastName",
        "user.id",
        "sinValidation.id",
        "sinValidation.sin",
      ])
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .where("sinValidation.isValidSIN is null")
      .andWhere("sinValidation.dateSent is null")
      .getMany();
  }

  /**
   * Gets a student's valid sin status
   * @returns Students SIN validation status.
   * @param userId information needed to select the user.
   */
  async getStudentSinStatus(userId: number): Promise<boolean | null> {
    const student = await this.repo
      .createQueryBuilder("student")
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .where("user.id= :userId ", { userId })
      .select(["student.id", "sinValidation.id", "sinValidation.isValidSIN"])
      .getOne();
    return student?.sinValidation.isValidSIN;
  }

  /**
   * Update the PD Sent Date
   * @param studentId
   */
  async updatePDSentDate(studentId: number): Promise<Student> {
    // get the Student Object
    const studentToUpdate = await this.repo.findOneOrFail({
      where: { id: studentId },
    });
    if (studentToUpdate) {
      // Date in UTC
      studentToUpdate.studentPDSentAt = getUTCNow();
      return this.repo.save(studentToUpdate);
    }
  }

  /**
   * Update the PD Sent Date
   * @param studentId
   * @param status
   */
  async updatePDStatusNDate(
    studentId: number,
    status: boolean,
  ): Promise<Student> {
    // get the Student Object
    const studentToUpdate = await this.repo.findOneOrFail({
      where: { id: studentId },
    });
    if (studentToUpdate) {
      studentToUpdate.studentPDVerified = status;
      // Date in UTC format
      studentToUpdate.studentPDUpdateAt = getUTCNow();
      return this.repo.save(studentToUpdate);
    }
  }

  async getStudentsAppliedForPD(): Promise<Student[]> {
    return this.repo
      .createQueryBuilder("student")
      .select(["student.id", "sinValidation.id", "sinValidation.sin"])
      .innerJoin("student.sinValidation", "sinValidation")
      .where("student.studentPDSentAt is not null")
      .andWhere("student.studentPDUpdateAt is null")
      .andWhere("student.studentPDVerified is null")
      .getMany();
  }

  /**
   * Search students based on the search criteria.
   * @param searchCriteria options to search by firstName,
   * lastName, appNumber or sin.
   * @returns list of students.
   */
  async searchStudentApplication(searchCriteria: {
    firstName?: string;
    lastName?: string;
    appNumber?: string;
    sin?: string;
  }): Promise<Student[]> {
    const searchQuery = this.repo
      .createQueryBuilder("student")
      .select([
        "student.id",
        "student.birthDate",
        "user.firstName",
        "user.lastName",
        "sinValidation.sin",
      ])
      .leftJoin(
        Application,
        "application",
        "application.student.id = student.id",
      )
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .where("user.isActive = true");

    if (searchCriteria.sin) {
      searchQuery.andWhere("sinValidation.sin = :sin", {
        sin: removeWhiteSpaces(searchCriteria.sin),
      });
    }
    if (searchCriteria.firstName) {
      searchQuery.andWhere("user.firstName Ilike :firstName", {
        firstName: `%${searchCriteria.firstName}%`,
      });
    }
    if (searchCriteria.lastName) {
      searchQuery.andWhere("user.lastName Ilike :lastName", {
        lastName: `%${searchCriteria.lastName}%`,
      });
    }
    if (searchCriteria.appNumber) {
      searchQuery
        .andWhere("application.applicationNumber Ilike :appNumber")
        .andWhere("application.applicationStatus != :overwrittenStatus")
        .setParameters({
          appNumber: `%${searchCriteria.appNumber}%`,
          overwrittenStatus: ApplicationStatus.overwritten,
        });
    }
    return searchQuery.getMany();
  }

  /**
   * Service to get notes for a student.
   * @param studentId
   * @param noteType
   * @returns Notes
   */
  async getStudentNotes(
    studentId: number,
    noteType?: NoteType,
  ): Promise<Note[]> {
    const studentNoteQuery = this.repo
      .createQueryBuilder("student")
      .select([
        "student.id",
        "note.noteType",
        "note.description",
        "note.createdAt",
        "user.firstName",
        "user.lastName",
      ])
      .innerJoin("student.notes", "note")
      .innerJoin("note.creator", "user")
      .where("student.id = :studentId", { studentId });
    if (noteType) {
      studentNoteQuery.andWhere("note.noteType = :noteType", { noteType });
    }
    const student = await studentNoteQuery.orderBy("note.id", "DESC").getOne();
    return student?.notes;
  }

  /**
   * Service to add note for an Institution.
   * ! Deprecated, please use the alternative method createStudentNote.
   * @param studentId
   * @param note
   */
  async saveStudentNote(studentId: number, note: Note): Promise<void> {
    const student = await this.repo.findOne({
      where: { id: studentId },
      relations: { notes: true },
    });
    student.notes.push(note);
    await this.repo.save(student);
  }

  /**
   * Creates a new note and associate it with the student.
   * This method is most likely to be used alongside with some other
   * DB data changes and must be executed in a DB transaction.
   * @param studentId student to have the note associated.
   * @param noteType note type.
   * @param noteDescription note description.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager transactional entity manager.
   */
  async createStudentNote(
    studentId: number,
    noteType: NoteType,
    noteDescription: string,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<Note> {
    const auditUser = { id: auditUserId } as User;
    // Create the note to be associated with the student.
    const newNote = new Note();
    newNote.description = noteDescription;
    newNote.noteType = noteType;
    newNote.creator = auditUser;
    const savedNote = await entityManager.getRepository(Note).save(newNote);
    // Associate the created note with the student.
    await entityManager
      .getRepository(Student)
      .createQueryBuilder()
      .relation(Student, "notes")
      .of({ id: studentId } as Student)
      .add(savedNote);
    return newNote;
  }

  /**
   * Uses the user id to identify a student that must have his
   * SIN validation active record updated.
   * @param userId user id related to the student.
   * @param sinValidation SIN validation record to have the
   * relationship created with the student.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns updated student.
   */
  async updateSINValidationByUserId(
    userId: number,
    sinValidation: SINValidation,
    auditUserId: number,
  ): Promise<Student> {
    const studentToUpdate = await this.repo
      .createQueryBuilder("student")
      .select("student.id")
      .where("student.user.id = :userId", { userId })
      .getOne();
    studentToUpdate.modifier = { id: auditUserId } as User;
    studentToUpdate.sinValidation = sinValidation;
    return this.repo.save(studentToUpdate);
  }

  @InjectLogger()
  logger: LoggerService;
}
