import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Student, User } from "../../database/entities";
import { Connection } from "typeorm";
import { UserInfo } from "../../types";
import { CreateStudentDto } from "../../route-controllers/student/models/student.dto";
import { StudentContact } from "../../types/studentContact";
import { IUserToken } from "../../auth/userToken.interface";
import { ArchiveDbService } from "../archive-db/archive-db.service";
import { StudentLegacyData } from "../../types";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";

@Injectable()
export class StudentService extends RecordDataModelService<Student> {
  @InjectLogger()
  logger: LoggerService;
  constructor(
    @Inject("Connection") connection: Connection,
    private readonly archiveDB: ArchiveDbService,
  ) {
    super(connection.getRepository(Student));
    this.logger.log("[Created]");
  }

  async getStudentByUserName(userName: string): Promise<Student> {
    const student = await this.repo
      .createQueryBuilder("student")
      .leftJoinAndSelect("student.user", "user")
      .where("user.userName = :userNameParam", { userNameParam: userName })
      .getOneOrFail();
    return student;
  }

  async getStudentByUserId(userId: number): Promise<Student> {
    return this.repo.findOne({ user: { id: userId } });
  }

  async createStudent(
    userInfo: UserInfo,
    otherInfo: CreateStudentDto,
  ): Promise<Student> {
    const student = this.create();
    const user = new User();
    user.userName = userInfo.userName;
    user.email = userInfo.email;
    user.firstName = userInfo.givenNames;
    user.lastName = userInfo.lastName;
    student.birthdate = new Date(userInfo.birthdate);
    student.gender = userInfo.gender;
    student.sin = otherInfo.sinNumber;
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
    } catch (excp) {
      this.logger.warn(
        `Unable to get archived information of student with exception: ${excp}`,
      );
    }
    return await this.save(student);
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

    const birthDate = new Date(userToken.birthdate);
    if (
      birthDate !== studentToSync.birthdate ||
      userToken.gender !== studentToSync.gender
    ) {
      studentToSync.birthdate = birthDate;
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
}
