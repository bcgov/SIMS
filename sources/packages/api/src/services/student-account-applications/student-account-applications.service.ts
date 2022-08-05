import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { StudentAccountApplication } from "../../database/entities";
import { DataSource } from "typeorm";

@Injectable()
export class StudentAccountApplicationsService extends RecordDataModelService<StudentAccountApplication> {
  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(StudentAccountApplication));
  }

  // TODO: Save the request received from the student.
  async createStudentAccountApplication(
    userName: string,
  ): Promise<StudentAccountApplication> {
    // const user = new User();
    // user.userName = userInfo.userName;
    // user.email = userInfo.email;
    // user.firstName = userInfo.givenNames;
    // user.lastName = userInfo.lastName;
    // user.creator = user;

    // const newAccountApplication = new StudentAccountApplication();
    // newAccountApplication.submittedDate = new Date();
    // const student = await this.repo
    //   .createQueryBuilder("student")
    //   .leftJoinAndSelect("student.user", "user")
    //   .innerJoin("student.sinValidation", "sinValidation")
    //   .select([
    //     "student",
    //     "user",
    //     "sinValidation.isValidSIN",
    //     "sinValidation.id",
    //   ])
    //   .where("user.userName = :userNameParam", { userNameParam: userName })
    //   .getOne();
    // return student;
    return null;
  }
}
