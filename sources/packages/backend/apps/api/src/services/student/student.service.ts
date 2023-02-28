import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  Application,
  ApplicationStatus,
  Student,
  User,
  Note,
  NoteType,
  SINValidation,
  StudentAccountApplication,
  StudentUser,
  DisbursementOveraward,
} from "@sims/sims-db";
import { DataSource, EntityManager } from "typeorm";
import { StudentUserToken } from "../../auth/userToken.interface";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { removeWhiteSpaces, transformAddressDetails } from "../../utilities";
import { CustomNamedError } from "@sims/utilities";
import {
  CreateStudentUserInfo,
  StudentInfo,
  UserInfoMatchData,
} from "./student.service.models";
import { SFASIndividualService } from "@sims/services/sfas";
import * as dayjs from "dayjs";
import {
  STUDENT_ACCOUNT_CREATION_FOUND_SIN_WITH_MISMATCH_DATA,
  STUDENT_ACCOUNT_CREATION_MULTIPLES_SIN_FOUND,
  STUDENT_SIN_CONSENT_NOT_CHECKED,
} from "../../constants";
import { DisbursementOverawardService } from "@sims/services";
import {
  BC_STUDENT_LOAN_AWARD_CODE,
  CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
} from "@sims/services/constants";
import { SystemUsersService } from "@sims/services/system-users";

@Injectable()
export class StudentService extends RecordDataModelService<Student> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly sfasIndividualService: SFASIndividualService,
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super(dataSource.getRepository(Student));
    this.logger.log("[Created]");
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
    const studentFound = await this.repo.findOne({
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
   * @param studentInfo information received to create the student.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param externalEntityManager case provided, should be used to allow the student
   * creation process to happen as part of another process.
   * @param studentAccountApplicationId: when the student is being created as part of
   * a student account application this is the submitted application form id.
   * @returns created student.
   */
  private async internalCreateStudent(
    userInfo: CreateStudentUserInfo,
    studentInfo: StudentInfo,
    auditUserId?: number,
    externalEntityManager?: EntityManager,
    studentAccountApplicationId?: number,
  ): Promise<Student> {
    // SIN to be saved and used for comparisons.
    const studentSIN = removeWhiteSpaces(studentInfo.sinNumber);
    const existingStudent = await this.getExistingStudentForAccountCreation(
      studentSIN,
      userInfo,
    );
    if (!studentInfo.sinConsent) {
      throw new CustomNamedError(
        "Student SIN consent not checked.",
        STUDENT_SIN_CONSENT_NOT_CHECKED,
      );
    }
    const student = existingStudent ?? new Student();

    // Checks if a new user must be created or only updated.
    const user = new User();
    if (userInfo.userId) {
      user.id = userInfo.userId;
    }
    // If a user id was provided, use it as the audit user. It means that
    // the user is being created by the Ministry on behalf of the student.
    const auditUser = auditUserId ? ({ id: auditUserId } as User) : user;
    user.email = userInfo.email.trim();
    user.firstName = userInfo.givenNames?.trim();
    user.lastName = userInfo.lastName.trim();
    if (userInfo.userId) {
      // User id is present and the user wil be updated.
      user.modifier = auditUser;
    } else {
      // User will be create alongside with the student.
      user.userName = userInfo.userName;
      user.creator = auditUser;
    }

    student.user = user;
    student.birthDate = userInfo.birthdate;
    student.gender = studentInfo.gender;
    student.contactInfo = {
      address: transformAddressDetails(studentInfo),
      phone: studentInfo.phone,
    };
    student.user = user;
    student.sinConsent = studentInfo.sinConsent;
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

    return this.dataSource.transaction(async (localEntityManager) => {
      const entityManager = externalEntityManager ?? localEntityManager;
      // Creates or updates the user and student.
      const savedStudent = await entityManager
        .getRepository(Student)
        .save(student);

      // SIN validation record is created only when a new student is created.
      // When a student upgrades to BCSC from BCeID or downgrades from
      // BCSC to BCeID, the SIN validation is not created as student remains the same.
      if (!existingStudent) {
        const sinValidation = new SINValidation();
        sinValidation.sin = studentSIN;
        sinValidation.student = student;
        student.sinValidation = sinValidation;
        await entityManager.getRepository(Student).save(student);
      }

      await this.importSFASOverawards(
        student.id,
        student.user.lastName,
        student.birthDate,
        studentSIN,
        entityManager,
      );

      // Create the new entry in the student/user history/audit.
      const studentUser = new StudentUser();
      studentUser.user = user;
      studentUser.student = student;
      studentUser.creator = auditUser;
      studentUser.accountApplication = {
        id: studentAccountApplicationId,
      } as StudentAccountApplication;
      await entityManager.getRepository(StudentUser).save(studentUser);
      // Returns the newly created student.
      return savedStudent;
    });
  }

  /**
   * Creates the student after a student account application was submitted by the
   * student and approved by the Ministry. User information will be updated and
   * the student will be created.
   * @param userInfo information needed to create or update the user.
   * @param studentInfo information received to create the student.
   * a student account application this is the submitted application form id.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns created student.
   */
  async createStudent(
    userInfo: CreateStudentUserInfo,
    studentInfo: StudentInfo,
    auditUserId?: number,
  ): Promise<Student> {
    return this.internalCreateStudent(userInfo, studentInfo, auditUserId);
  }

  /**
   * Search by an existing student using the SIN number and validates
   * if the student has valid personal data that ensures the same identity.
   * Case the SIN is present but it is not considered valid, exceptions will
   * be thrown with the specific error types.
   * @param studentSIN SIN to be searched.
   * @param userInfo personal student data to be validated.
   * @returns existing and validated student.
   */
  private async getExistingStudentForAccountCreation(
    studentSIN: string,
    userInfo: UserInfoMatchData,
  ): Promise<Student> {
    // Check if there are students with the same SIN.
    const existingStudents = await this.getStudentsBySIN(studentSIN);
    if (existingStudents.length > 1) {
      const logMessage = "More than one student found for the provided SIN.";
      this.logger.warn(logMessage);
      throw new CustomNamedError(
        logMessage,
        STUDENT_ACCOUNT_CREATION_MULTIPLES_SIN_FOUND,
      );
    }
    // Check if a student with the same SIN exists and has the same personal data.
    if (existingStudents.length === 1) {
      this.logger.warn("Found one student with the same SIN.");
      const [studentFound] = existingStudents;
      if (!this.studentMatchesUserInfo(studentFound, userInfo)) {
        const logMessage =
          "Student personal data does not match while trying to link the user to an existing student account.";
        this.logger.warn(logMessage);
        throw new CustomNamedError(
          logMessage,
          STUDENT_ACCOUNT_CREATION_FOUND_SIN_WITH_MISMATCH_DATA,
        );
      }
      // Found the student with same SIN and personal data.
      this.logger.warn(
        "Student personal data matches. The student will be associated with the user.",
      );
      return studentFound;
    }

    return null;
  }

  /**
   * Check if a student has a first name, last name and
   * date of birth that matches with the provided data.
   * @param student student to be verified.
   * @param matchData data to be verified.
   * @returns true if first name, last name and date of birth are the
   * same, otherwise, false.
   */
  private studentMatchesUserInfo(
    student: Student,
    matchData: UserInfoMatchData,
  ): boolean {
    return (
      dayjs(student.birthDate).isSame(matchData.birthdate) &&
      // Using double equals (==) to consider null and undefined comparison as valid.
      student.user.firstName?.toLowerCase() ==
        matchData.givenNames?.toLowerCase() &&
      student.user.lastName.toLowerCase() === matchData.lastName.toLowerCase()
    );
  }

  /**
   * Get students by SIN.
   * @param sin SIN to be searched.
   * @returns students with the same SIN.
   */
  private async getStudentsBySIN(sin: string): Promise<Student[]> {
    return this.repo.find({
      select: {
        id: true,
        birthDate: true,
        user: {
          firstName: true,
          lastName: true,
        },
      },
      relations: {
        user: true,
      },
      where: {
        sinValidation: { sin },
      },
    });
  }

  /**
   * Creates the student checking for an existing user to be used or
   * creating a new one in case the user id is not provided.
   * The user could be already available in the case of the same user
   * was authenticated previously on another portal (e.g. parent/partner).
   * @param userInfo information needed to create or update the user.
   * @param studentInfo information received to create the student.
   * @param externalEntityManager should be used to allow the student
   * creation process to happen as part of another process.
   * @param studentAccountApplicationId when the student is being created as part of
   * a student account application this is the submitted application form id.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns created student.
   */
  async createStudentFromAccountApplication(
    userInfo: CreateStudentUserInfo,
    studentInfo: StudentInfo,
    auditUserId: number,
    externalEntityManager: EntityManager,
    studentAccountApplicationId: number,
  ): Promise<Student> {
    return this.internalCreateStudent(
      userInfo,
      studentInfo,
      auditUserId,
      externalEntityManager,
      studentAccountApplicationId,
    );
  }

  /**
   * Updates student information.
   * @param studentId student to be updated.
   * @param studentInfo student information to be updated.
   * @param auditUserId user who is making the changes.
   * @returns updated student.
   */
  async updateStudentInfo(
    studentId: number,
    studentInfo: StudentInfo,
    auditUserId: number,
  ): Promise<Student> {
    const student = new Student();
    student.id = studentId;
    student.contactInfo = {
      address: transformAddressDetails(studentInfo),
      phone: studentInfo.phone,
    };
    student.modifier = { id: auditUserId } as User;
    student.gender = studentInfo.gender;
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
    const studentToSync = await this.getStudentById(studentToken.studentId);
    let mustSave = false;
    if (studentToken.givenNames === undefined) {
      studentToken.givenNames = null;
    }
    if (
      !dayjs(studentToken.birthdate).isSame(studentToSync.birthDate) ||
      studentToken.lastName !== studentToSync.user.lastName ||
      studentToken.givenNames !== studentToSync.user.firstName
    ) {
      studentToSync.birthDate = studentToken.birthdate;
      studentToSync.user.lastName = studentToken.lastName;
      studentToSync.user.firstName = studentToken.givenNames;
      const sinValidation = new SINValidation();
      sinValidation.student = studentToSync;
      sinValidation.sin = studentToSync.sinValidation.sin;
      studentToSync.sinValidation = sinValidation;
      mustSave = true;
    }
    // This condition is not added above, as email does not trigger SIN validation request.
    if (studentToken.email !== studentToSync.user.email) {
      studentToSync.user.email = studentToken.email;
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
          overwrittenStatus: ApplicationStatus.Overwritten,
        });
    }
    return searchQuery.getMany();
  }

  /**
   * Service to get notes for a student.
   * @param studentId
   * @param noteType
   * @returns Notes.
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
   * Add student note independently.
   * @param studentId student to have the note associated.
   * @param noteType note type.
   * @param noteDescription note description.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns saved Note.
   */
  async addStudentNote(
    studentId: number,
    noteType: NoteType,
    noteDescription: string,
    auditUserId: number,
  ): Promise<Note> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      return this.createStudentNote(
        studentId,
        noteType,
        noteDescription,
        auditUserId,
        transactionalEntityManager,
      );
    });
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

  @InjectLogger()
  logger: LoggerService;

  /**
   * Search for the student's SFAS data and update overaward values in
   * disbursement overawards table if any overaward values for BCSL or CSLF exist.
   * @param studentId student id for the disbursement overaward record.
   * @param lastName last name for sfas individuals.
   * @param sinNumber student's sin number.
   * @param entityManager entityManager to be used to perform the query.
   */
  async importSFASOverawards(
    studentId: number,
    lastName: string,
    birthDate: string,
    sinNumber: string,
    entityManager: EntityManager,
  ): Promise<void> {
    const sfasIndividual = await this.sfasIndividualService.getSFASOverawards(
      lastName,
      birthDate,
      sinNumber,
    );
    const auditUser = await this.systemUsersService.systemUser();
    const overawards: DisbursementOveraward[] = [];
    if (sfasIndividual?.bcslOveraward > 0) {
      overawards.push({
        student: { id: studentId } as Student,
        disbursementValueCode: BC_STUDENT_LOAN_AWARD_CODE,
        overawardValue: sfasIndividual.bcslOveraward,
        creator: { id: auditUser.id } as User,
      } as DisbursementOveraward);
    }
    if (sfasIndividual?.cslOveraward > 0) {
      overawards.push({
        student: { id: studentId } as Student,
        disbursementValueCode: CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
        overawardValue: sfasIndividual.cslOveraward,
        creator: { id: auditUser.id },
      } as DisbursementOveraward);
    }
    await this.disbursementOverawardService.addLegacyOverawards(
      overawards,
      entityManager,
    );
  }
}
