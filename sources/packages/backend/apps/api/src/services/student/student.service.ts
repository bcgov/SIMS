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
  RestrictionNotificationType,
  StudentRestriction,
  DisabilityStatus,
  SFASIndividual,
  SFASRestriction,
  CASSupplier,
  SupplierStatus,
} from "@sims/sims-db";
import { DataSource, EntityManager, UpdateResult } from "typeorm";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { removeWhiteSpaces, transformAddressDetails } from "../../utilities";
import { CustomNamedError } from "@sims/utilities";
import {
  CreateStudentUserInfo,
  StudentInfo,
  StudentUserData,
  UserInfoMatchData,
} from "./student.service.models";
import { SFASIndividualService } from "@sims/services/sfas";
import * as dayjs from "dayjs";
import {
  STUDENT_ACCOUNT_CREATION_FOUND_SIN_WITH_MISMATCH_DATA,
  STUDENT_ACCOUNT_CREATION_MULTIPLES_SIN_FOUND,
  STUDENT_SIN_CONSENT_NOT_CHECKED,
} from "../../constants";
import {
  DisbursementOverawardService,
  NoteSharedService,
  NotificationActionsService,
  SystemUsersService,
} from "@sims/services";

@Injectable()
export class StudentService extends RecordDataModelService<Student> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly sfasIndividualService: SFASIndividualService,
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly noteSharedService: NoteSharedService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super(dataSource.getRepository(Student));
    this.logger.log("[Created]");
  }

  /**
   * Gets the student by id.
   * @param studentId student id.
   * @param options options to include legacy data.
   * - `includeLegacy`: if true, include legacy profile data.
   * @returns the student found or null.
   */
  async getStudentById(
    studentId: number,
    options?: { includeLegacy?: boolean },
  ): Promise<Student> {
    const studentQuery = this.repo
      .createQueryBuilder("student")
      .select([
        "student.id",
        "student.birthDate",
        "student.gender",
        "student.contactInfo",
        "student.studentPDSentAt",
        "student.studentPDUpdateAt",
        "student.disabilityStatus",
        "sinValidation.id",
        "sinValidation.sin",
        "sinValidation.isValidSIN",
        "user.id",
        "user.firstName",
        "user.lastName",
        "user.email",
        "user.identityProviderType",
      ])
      .innerJoin("student.user", "user")
      .leftJoin("student.sinValidation", "sinValidation")
      .where("student.id = :studentId", { studentId });
    if (options?.includeLegacy) {
      studentQuery
        .addSelect([
          "sfasIndividuals.id",
          "sfasIndividuals.firstName",
          "sfasIndividuals.lastName",
          "sfasIndividuals.birthDate",
          "sfasIndividuals.sin",
        ])
        .leftJoin("student.sfasIndividuals", "sfasIndividuals")
        .orderBy("sfasIndividuals.updatedAt", "DESC");
    }
    return studentQuery.getOne();
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
    let sfasIndividual: SFASIndividual;
    try {
      // Get PD status from SFAS integration data.
      sfasIndividual = await this.sfasIndividualService.getIndividualStudent(
        user.lastName,
        student.birthDate,
        studentSIN,
      );
      // If SFAS individual exist with matching details, read the disability status and effective date.
      if (sfasIndividual) {
        student.disabilityStatus = this.getDisabilityStatus(
          sfasIndividual.pdStatus,
          sfasIndividual.ppdStatus,
        );
        student.disabilityStatusEffectiveDate = this.getDisabilityEffectiveDate(
          sfasIndividual.ppdStatusDate,
          student.disabilityStatus,
        );
      } else {
        // If sfasIndividual wasn't found, check for a partial match
        await this.checkLegacyIndividualPartialMatch(
          user,
          student,
          studentSIN,
          auditUserId,
          externalEntityManager,
        );
      }
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
        student.casSupplier = this.createPendingCASSupplier(
          student.id,
          auditUserId,
        );
        await entityManager.getRepository(Student).save(student);
      }

      if (sfasIndividual) {
        // For the newly created student, update the Processed status in the
        // SFAS Restrictions table to false. This will enable for the SFAS
        // Restrictions from previous imports that were originally marked as
        // processed to be re-processed when the SFAS Integration Scheduler
        // runs again, thus causing the restrictions imported from SFAS to be
        // applied to the newly created student account.
        await entityManager
          .getRepository(SFASRestriction)
          .update({ individualId: sfasIndividual.id }, { processed: false });

        // If there is a match in SFAS, record that information is available from legacy system with a note attached to the student.
        await this.noteSharedService.createStudentNote(
          student.id,
          NoteType.General,
          "Successful match with legacy systems - data has been transferred.",
          this.systemUsersService.systemUser.id,
          entityManager,
        );
      }

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
   * Check for a partial match for a student in SFAS.
   * @param user user to be matched against.
   * @param student student to be matched against.
   * @param studentSIN sin to be matched against.
   * @param auditUserId audit user for the notification.
   * @param externalEntityManager entityManager to be used to perform the query and if needed, save the notification.
   */
  private async checkLegacyIndividualPartialMatch(
    user: User,
    student: Student,
    studentSIN: string,
    auditUserId: number,
    externalEntityManager: EntityManager,
  ): Promise<void> {
    const partialMatch: SFASIndividual =
      await this.sfasIndividualService.getIndividualStudentPartialMatch(
        user.lastName,
        student.birthDate,
        studentSIN,
      );

    if (partialMatch) {
      // Send out a notification of a partial match for the student information.
      let matches = "";
      if (
        user.lastName.toLowerCase() === partialMatch.lastName.toLowerCase() &&
        student.birthDate === partialMatch.birthDate
      ) {
        matches = "Last name and birth date match.";
      } else if (
        user.lastName.toLowerCase() === partialMatch.lastName.toLowerCase() &&
        studentSIN === partialMatch.sin
      ) {
        matches = "Last name and SIN match.";
      } else if (
        studentSIN === partialMatch.sin &&
        student.birthDate === partialMatch.birthDate
      ) {
        matches = "Birth date and SIN match.";
      }
      await this.notificationActionsService.savePartialStudentMatchNotification(
        {
          givenNames: student.user.firstName,
          lastName: student.user.lastName,
          birthDate: new Date(student.birthDate),
          matches: matches,
          studentEmail: student.user.email,
          matchTime: new Date(),
        },
        auditUserId,
        externalEntityManager,
      );
    }
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
   * Updates the user and student data currently on DB.
   * @param studentUserData student user data to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns true if the profile was updated, false if no changes were detected that required the student data to be saved.
   */
  async updateStudentUserData(
    studentUserData: StudentUserData,
    auditUserId: number,
  ): Promise<boolean> {
    // TODO: Remove the trim function below once the DTO sanitization is done.
    studentUserData.givenNames = studentUserData.givenNames?.trim();
    studentUserData.lastName = studentUserData.lastName.trim();
    studentUserData.email = studentUserData.email.trim();
    const studentToSync = await this.getStudentById(studentUserData.studentId);
    let mustSave = false;
    if (!studentUserData.givenNames) {
      studentUserData.givenNames = null;
    }
    if (
      !dayjs(studentUserData.birthdate).isSame(studentToSync.birthDate) ||
      studentUserData.lastName.toLowerCase() !==
        studentToSync.user.lastName.toLowerCase() ||
      studentUserData.givenNames?.toLowerCase() !==
        studentToSync.user.firstName?.toLowerCase()
    ) {
      studentToSync.birthDate = studentUserData.birthdate;
      studentToSync.user.lastName = studentUserData.lastName;
      studentToSync.user.firstName = studentUserData.givenNames;
      const sinValidation = new SINValidation();
      sinValidation.student = studentToSync;
      sinValidation.sin = studentToSync.sinValidation.sin;
      studentToSync.sinValidation = sinValidation;
      mustSave = true;
    }
    // This condition is not added above, as email does not trigger SIN validation request.
    if (
      studentUserData.email.toLowerCase() !==
      studentToSync.user.email.toLowerCase()
    ) {
      studentToSync.user.email = studentUserData.email;
      mustSave = true;
    }

    if (mustSave) {
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        await this.noteSharedService.createStudentNote(
          studentToSync.id,
          NoteType.General,
          studentUserData.noteDescription,
          auditUserId,
          transactionalEntityManager,
        );
        studentToSync.modifier = { id: auditUserId } as User;
        await transactionalEntityManager
          .getRepository(Student)
          .save(studentToSync);
      });
    }
    return mustSave;
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
   * Search students based on the search criteria and institution id if provided.
   * @param searchCriteria options to search by firstName,
   * lastName, appNumber or sin.
   * @param institutionId id of the institution that the student applied to.
   * @returns list of student details.
   */
  async searchStudent(
    searchCriteria: {
      firstName?: string;
      lastName?: string;
      appNumber?: string;
      sin?: string;
    },
    institutionId?: number,
  ): Promise<Student[]> {
    const searchQuery = this.repo
      .createQueryBuilder("student")
      .select([
        "student.id",
        "student.birthDate",
        "user.firstName",
        "user.lastName",
        "sinValidation.sin",
      ]);
    if (institutionId) {
      searchQuery
        .innerJoin(
          Application,
          "application",
          "application.student.id = student.id",
        )
        .innerJoin("application.location", "institutionLocation")
        .innerJoin("institutionLocation.institution", "institution");
    } else {
      searchQuery.leftJoin(
        Application,
        "application",
        "application.student.id = student.id",
      );
    }
    searchQuery
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .where("user.isActive = true");
    if (institutionId) {
      searchQuery.andWhere("institution.id = :institutionId", {
        institutionId,
      });
    }
    if (institutionId || searchCriteria.appNumber) {
      searchQuery.andWhere("application.applicationStatus != :editedStatus", {
        editedStatus: ApplicationStatus.Edited,
      });
    }
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
      searchQuery.andWhere("application.applicationNumber Ilike :appNumber", {
        appNumber: `%${searchCriteria.appNumber}%`,
      });
    }
    return searchQuery.getMany();
  }

  /**
   * Get notes for a student and note type. Options can be used to filter notes.
   * @param studentId student id.
   * @param noteType note type.
   * @param options options to filter notes:
   * - `filterNoEffectRestrictionNotes`: if true, do not include notes for student restrictions with notification type = "No effect".
   * @returns student notes.
   */
  async getStudentNotes(
    studentId: number,
    noteType?: NoteType,
    options?: {
      filterNoEffectRestrictionNotes?: boolean;
    },
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
    if (options?.filterNoEffectRestrictionNotes) {
      const filterOutRestrictionNoteSubQuery = this.dataSource
        .getRepository(StudentRestriction)
        .createQueryBuilder("studentRestriction")
        .select("note.id")
        .innerJoin("studentRestriction.restrictionNote", "note")
        .innerJoin("studentRestriction.restriction", "restriction")
        .innerJoin("studentRestriction.student", "student")
        .where("student.id = :studentId", { studentId })
        .andWhere(
          "restriction.notificationType = :restrictionNotificationType",
          { restrictionNotificationType: RestrictionNotificationType.NoEffect },
        );
      const filterOutResolutionNoteSubQuery = this.dataSource
        .getRepository(StudentRestriction)
        .createQueryBuilder("studentRestriction")
        .select("note.id")
        .innerJoin("studentRestriction.resolutionNote", "note")
        .innerJoin("studentRestriction.restriction", "restriction")
        .innerJoin("studentRestriction.student", "student")
        .where("student.id = :studentId", { studentId })
        .andWhere(
          "restriction.notificationType = :restrictionNotificationType",
          { restrictionNotificationType: RestrictionNotificationType.NoEffect },
        );
      studentNoteQuery
        .andWhere(
          `note.id not in (${filterOutRestrictionNoteSubQuery.getQuery()})`,
        )
        .andWhere(
          `note.id not in (${filterOutResolutionNoteSubQuery.getQuery()})`,
        )
        .setParameters(filterOutRestrictionNoteSubQuery.getParameters())
        .setParameters(filterOutResolutionNoteSubQuery.getParameters());
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
      return this.noteSharedService.createStudentNote(
        studentId,
        noteType,
        noteDescription,
        auditUserId,
        transactionalEntityManager,
      );
    });
  }

  @InjectLogger()
  logger: LoggerService;

  /**
   * Get student disability status.
   * @param pdStatus SFAS PD status.
   * @param ppdStatus SFAS PPD status.
   * @returns disability status.
   */
  private getDisabilityStatus(
    pdStatus: boolean,
    ppdStatus: boolean,
  ): DisabilityStatus {
    if (pdStatus) {
      return DisabilityStatus.PD;
    } else if (ppdStatus) {
      return DisabilityStatus.PPD;
    }
    return DisabilityStatus.NotRequested;
  }

  /**
   * Gets the disability effective date based on the disability status.
   * If the disability status is a PD status, the disability effective date should be the current date.
   * If the disability status is a PPD status, the disability effective date should be the ppd status date.
   * @param ppdStatusDate PPD status date.
   * @param disabilityStatus student disability status.
   */
  private getDisabilityEffectiveDate(
    ppdStatusDate: string,
    disabilityStatus: DisabilityStatus,
  ): Date | null {
    if (disabilityStatus === DisabilityStatus.PD) {
      return new Date();
    } else if (disabilityStatus === DisabilityStatus.PPD) {
      return new Date(ppdStatusDate);
    }
    return null;
  }

  /**
   * Update student disability status with note.
   * @param studentId student id.
   * @param disabilityStatus disability status.
   * @param noteDescription note created for disability status update.
   * @param auditUserId user who modifies the disability status.
   * @returns update result.
   */
  async updateDisabilityStatus(
    studentId: number,
    disabilityStatus: DisabilityStatus,
    noteDescription: string,
    auditUserId: number,
  ): Promise<UpdateResult> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      await this.noteSharedService.createStudentNote(
        studentId,
        NoteType.General,
        noteDescription,
        auditUserId,
        transactionalEntityManager,
      );
      const auditUser = { id: auditUserId } as User;
      const now = new Date();
      return transactionalEntityManager.getRepository(Student).update(
        { id: studentId },
        {
          disabilityStatus,
          disabilityStatusEffectiveDate: now,
          modifier: auditUser,
          updatedAt: now,
        },
      );
    });
  }

  /**
   * Create a pending CAS supplier for a student to save.
   * @param studentId student id.
   * @param auditUserId audit user id.
   * @returns casSupplier.
   */
  createPendingCASSupplier(
    studentId: number,
    auditUserId: number,
  ): CASSupplier {
    const auditUser = { id: auditUserId } as User;
    const casSupplier = new CASSupplier();
    casSupplier.supplierStatus = SupplierStatus.PendingSupplierVerification;
    casSupplier.supplierStatusUpdatedOn = new Date();
    casSupplier.isValid = false;
    casSupplier.creator = auditUser;
    casSupplier.student = { id: studentId } as Student;
    return casSupplier;
  }
}
