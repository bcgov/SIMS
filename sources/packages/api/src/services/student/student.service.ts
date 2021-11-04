import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  Application,
  ApplicationStatus,
  Student,
  User,
} from "../../database/entities";
import { Connection, Repository } from "typeorm";
import { UserInfo } from "../../types";
import { StudentContact } from "../../types/studentContact";
import { IUserToken } from "../../auth/userToken.interface";
import { ArchiveDbService } from "../archive-db/archive-db.service";
import { StudentLegacyData } from "../../types";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import { getDateOnly, getUTCNow, removeWhiteSpaces } from "../../utilities";
import { CreateStudentInfo } from "./student.service.models";

@Injectable()
export class StudentService extends RecordDataModelService<Student> {
  private readonly applicationRepo: Repository<Application>;
  @InjectLogger()
  logger: LoggerService;
  constructor(
    @Inject("Connection") connection: Connection,
    private readonly archiveDB: ArchiveDbService,
  ) {
    super(connection.getRepository(Student));
    this.applicationRepo = connection.getRepository(Application);
    this.logger.log("[Created]");
  }

  async getStudentByUserName(userName: string): Promise<Student> {
    const student = await this.repo
      .createQueryBuilder("student")
      .leftJoinAndSelect("student.user", "user")
      .where("user.userName = :userNameParam", { userNameParam: userName })
      .getOne();
    return student;
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
    otherInfo: CreateStudentInfo,
  ): Promise<Student> {
    let user: User;
    if (userInfo.userId) {
      user = { id: userInfo.userId } as User;
    } else {
      user = new User();
    }

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
      addresses: [
        {
          addressLine1: otherInfo.addressLine1,
          addressLine2: otherInfo.addressLine2,
          city: otherInfo.city,
          province: otherInfo.provinceState,
          country: otherInfo.country,
          postalCode: otherInfo.postalCode,
        },
      ],
      phone: otherInfo.phone,
    };
    student.user = user;

    // Get PD status from Archive DB
    try {
      const result: StudentLegacyData[] =
        await this.archiveDB.getIndividualPDStatus(student);
      if (result && result.length > 0 && result[0].disability === "Y") {
        student.studentPDVerified = true;
      }
    } catch (error) {
      this.logger.warn(
        `Unable to get archived information of student with exception: ${error}`,
      );
    }
    return this.save(student);
  }

  async updateStudentContactByUserName(
    userName: string,
    contact: StudentContact,
  ): Promise<Student> {
    const student = await this.getStudentByUserName(userName);
    if (!student) {
      throw new Error(
        `Not able to find a student using the user name ${userName}`,
      );
    }

    student.contactInfo = {
      addresses: [
        {
          addressLine1: contact.addressLine1,
          addressLine2: contact.addressLine2,
          city: contact.city,
          province: contact.provinceState,
          country: contact.country,
          postalCode: contact.postalCode,
        },
      ],
      phone: contact.phone,
    };

    return this.save(student);
  }

  async synchronizeFromUserInfo(userToken: IUserToken): Promise<Student> {
    const studentToSync = await this.getStudentByUserName(userToken.userName);
    if (!studentToSync) {
      throw new Error(
        "Not able to find a student using the username (bcsc name)",
      );
    }

    let mustSave = false;

    if (
      userToken.email !== studentToSync.user.email ||
      userToken.lastName !== studentToSync.user.lastName ||
      userToken.givenNames !== studentToSync.user.firstName
    ) {
      studentToSync.user.email = userToken.email;
      studentToSync.user.lastName = userToken.lastName;
      studentToSync.user.firstName = userToken.givenNames;
      mustSave = true;
    }

    const userTokenBirthdate = getDateOnly(userToken.birthdate);
    if (
      userTokenBirthdate !== studentToSync.birthDate ||
      userToken.gender !== studentToSync.gender
    ) {
      studentToSync.birthDate = userTokenBirthdate;
      studentToSync.gender = userToken.gender;
      mustSave = true;
    }

    if (mustSave) {
      return await this.save(studentToSync);
    }

    // If information between token and SABC db is same, then just returning without the database call
    return studentToSync;
  }

  /**
   * Gets all the students that have the SIN validation pending.
   * @returns Students pending SIN validation.
   */
  async getStudentsPendingSinValidation(): Promise<Student[]> {
    return this.repo.find({ validSIN: null });
  }

  /**
   * Update the SIN validation information on a student that
   * is marked with a pending validation.
   * If the SIN validation status is already set, it needs to be
   * set as NULL before it is processed again.
   * @param sin
   * @param validSIN
   * @returns pending sin validation
   */
  async updatePendingSinValidation(
    sin: string,
    validSIN: boolean,
  ): Promise<void> {
    // Only allow updates on a student that has pending SIN validation.
    const studentToUpdate = await this.repo.findOne({
      sin,
      validSIN: null,
    });
    if (studentToUpdate) {
      studentToUpdate.validSIN = validSIN;
      this.repo.save(studentToUpdate);
    }
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
      .leftJoinAndSelect(
        Application,
        "application",
        "application.student_id = student.id",
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
}
