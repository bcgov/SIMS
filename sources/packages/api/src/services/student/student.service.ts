import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Student, User } from "../../database/entities";
import { Connection } from "typeorm";
import { UserInfo } from "../../types";
import { CreateStudentDto } from "../../route-controllers/student/models/student.dto";
import { StudentContact } from "src/types/studentContact";

@Injectable()
export class StudentService extends RecordDataModelService<Student> {
  constructor(@Inject("Connection") connection: Connection) {
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

  async synchronizeUserInfo(userInfo: UserInfo): Promise<any> {
    const studentToSync = await this.getStudentByUserName(userInfo.userName);
    //Error out if user is not found
    if (!studentToSync) {
      throw new Error(
        "Not able to find a student using the username (bcsc name)",
      );
    }

    let mustSave = false;

    if (
      userInfo.email !== studentToSync.user.email ||
      userInfo.lastName !== studentToSync.user.lastName ||
      userInfo.givenNames !== studentToSync.user.firstName
    ) {
      studentToSync.user.email = userInfo.email;
      studentToSync.user.lastName = userInfo.lastName;
      studentToSync.user.firstName = userInfo.givenNames;
      mustSave = true;
    }

    let birthDate = new Date(userInfo.birthdate);
    if (
      birthDate !== studentToSync.birthdate ||
      userInfo.gender !== studentToSync.gender
    ) {
      studentToSync.birthdate = birthDate;
      studentToSync.gender = userInfo.gender;
      mustSave = true;
    }

    if (mustSave) {
      return await this.save(studentToSync);
    }

    //If information between token and SABC db is same, then just returning without the database call
    return studentToSync;
  }
}
