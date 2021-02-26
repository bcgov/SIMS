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

@Injectable()
export class StudentService extends RecordDataModelService<Student> {
  constructor(
    @Inject("Connection") connection: Connection,
    private readonly archiveDB: ArchiveDbService,
  ) {
    super(connection.getRepository(Student));
  }

  async getStudentByUserName(userName: string): Promise<Student> {
    const student = await this.repo
      .createQueryBuilder("student")
      .leftJoinAndSelect("student.user", "user")
      .where("user.userName = :userNameParam", { userNameParam: userName })
      .getOneOrFail();
    return student;
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
    const result: StudentLegacyData [] = await this.archiveDB.getIndividualPDStatus(student);
    if (result[0].disability === "Y") {
      student.studentPDVerified = true;
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
}
