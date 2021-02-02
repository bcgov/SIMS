import { Injectable, Inject } from '@nestjs/common';
import { RecordDataModelService } from '../../database/data.model.service';
import { Student, User } from '../../database/entities';
import { Connection } from 'typeorm';
import { UserInfo } from '../../types';
import { CreateStudentDto } from '../../route-controllers/student/models/student.dto';
import { StudentContact } from 'src/types/studentContact';

@Injectable()
export class StudentService extends RecordDataModelService<Student> {
  constructor(@Inject('Connection') connection: Connection) {
    super(connection.getRepository(Student));
  }

  async createStudent(userInfo: UserInfo, otherInfo: CreateStudentDto): Promise<Student> {
    const student = this.create();
    const user = new User();
    user.userName = userInfo.userName;
    user.email = userInfo.email;
    user.firstName = userInfo.givenNames;
    user.lastName = userInfo.lastName;
    student.sin = otherInfo.sinNumber;
    student.contactInfo = {
      addresses: [{
        addressLine1: otherInfo.addressLine1,
        addressLine2: otherInfo.addressLine2,
        city: otherInfo.city,
        province: otherInfo.provinceState,
        country: otherInfo.country,
        postalCode: otherInfo.postalCode
      }],
      phone: otherInfo.phone
    };
    student.user = user;
    return await this.save(student);
  }

  async getStudentByUserName(userName: string): Promise<Student> {
    const student = await this.repo.createQueryBuilder("student")
      .leftJoinAndSelect("student.user", "user")
      .where("user.userName = :userNameParam", { userNameParam: userName })
      .getOneOrFail();
    return student;
  }

  async updateStudentContact(userName: string, contact: StudentContact): Promise<Student> {
    const student = await this.getStudentByUserName(userName);
    // TODO: Update the student contact.
    return student;
  }
}
