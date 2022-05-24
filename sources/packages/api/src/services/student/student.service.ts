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
import { Connection } from "typeorm";
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

@Injectable()
export class StudentService extends RecordDataModelService<Student> {
  constructor(
    connection: Connection,
    private readonly sfasIndividualService: SFASIndividualService,
  ) {
    super(connection.getRepository(Student));
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
      select: ["id"],
      where: { id: studentId },
    });
    return !!studentFound;
  }

  async getStudentByUserId(userId: number): Promise<Student> {
    return this.repo.findOne({ user: { id: userId } });
  }

  /**
   Creates the student checking for an existing user to be used or
   creating a new one in case the user id is not provided.
   * The user could be already available in the case of the same user
   * was authenticated previously on another portal (e.g. parent/partner).
   * @param userInfo information needed to create/update the user.
   * @param otherInfo information received to create the student.
   * @returns created student.
   */
  async createStudent(
    userInfo: UserInfo,
    otherInfo: StudentInfo,
  ): Promise<Student> {
    let user: User;
    if (userInfo.userId) {
      user = { id: userInfo.userId } as User;
    } else {
      user = new User();
    }
    const sinValidation = new SINValidation();
    sinValidation.user = user;
    user.userName = userInfo.userName;
    user.email = userInfo.email;
    user.firstName = userInfo.givenNames;
    user.lastName = userInfo.lastName;

    const student = new Student();
    student.user = user;
    student.birthDate = getDateOnly(userInfo.birthdate);
    student.gender = userInfo.gender;
    student.sin = removeWhiteSpaces(otherInfo.sinNumber);
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
        student.sin,
      );
    } catch (error) {
      this.logger.error("Unable to get SFAS information of student.");
      this.logger.error(error);
      throw error;
    }
    return this.save(student);
  }

  async updateStudentContactByUserName(
    userName: string,
    contact: StudentInfo,
  ): Promise<Student> {
    const student = await this.getStudentByUserName(userName);
    if (!student) {
      throw new Error(
        `Not able to find a student using the user name ${userName}`,
      );
    }

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
        "student.sin",
        "student.birthDate",
        "user.firstName",
        "user.lastName",
        "user.id",
        "sinValidation.id",
      ])
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .where("sinValidation.isValidSIN is null")
      .andWhere("sinValidation.dateSent is null")
      .andWhere("sinValidation.dateReceived is null")
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
      .select(["sinValidation.isValidSIN", "student.id"])
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
      id: studentId,
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
      id: studentId,
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
      .where("student.studentPDSentAt is not null")
      .andWhere("student.studentPDUpdateAt is null")
      .andWhere("student.studentPDVerified is null")
      .getMany();
  }

  /**
   * Search the student based on the search criteria.
   * @param firstName firsName of the student.
   * @param lastName lastName of the student.
   * @param appNumber application number of the student.
   * @returns Searched student details.
   */
  async searchStudentApplication(
    firstName: string,
    lastName: string,
    appNumber: string,
  ): Promise<Student[]> {
    const searchQuery = this.repo
      .createQueryBuilder("student")
      .leftJoin(
        Application,
        "application",
        "application.student.id = student.id",
      )
      .select([
        "student.id",
        "student.birthDate",
        "user.firstName",
        "user.lastName",
      ])
      .innerJoin("student.user", "user")
      .where("user.isActive = true");
    if (firstName) {
      searchQuery.andWhere("user.firstName Ilike :firstName", {
        firstName: `%${firstName}%`,
      });
    }
    if (lastName) {
      searchQuery.andWhere("user.lastName Ilike :lastName", {
        lastName: `%${lastName}%`,
      });
    }
    if (appNumber) {
      searchQuery
        .andWhere("application.applicationNumber Ilike :appNumber")
        .andWhere("application.applicationStatus != :overwrittenStatus")
        .setParameters({
          appNumber: `%${appNumber}%`,
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
   * @param studentId
   * @param note
   */
  async saveStudentNote(studentId: number, note: Note): Promise<void> {
    const student = await this.repo.findOne(studentId, {
      relations: ["notes"],
    });
    student.notes.push(note);
    await this.repo.save(student);
  }

  @InjectLogger()
  logger: LoggerService;
}
