import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { StudentAccountApplication, User } from "../../database/entities";
import { DataSource, IsNull } from "typeorm";
import { StudentAccountApplicationCreateModel } from "./student-account-applications.models";

@Injectable()
export class StudentAccountApplicationsService extends RecordDataModelService<StudentAccountApplication> {
  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(StudentAccountApplication));
  }

  async getStudentAccountApplicationsById(
    id: number,
  ): Promise<StudentAccountApplication> {
    return this.repo.findOne({
      select: { id: true, submittedData: true },
      where: { id },
    });
  }

  async getPendingStudentAccountApplications(): Promise<
    StudentAccountApplication[]
  > {
    return this.repo.find({
      select: {
        id: true,
        submittedDate: true,
        user: { firstName: true, lastName: true },
      },
      relations: {
        user: true,
      },
      where: {
        assessedBy: IsNull(),
      },
    });
  }

  async createStudentAccountApplication(
    userName: string,
    studentProfile: StudentAccountApplicationCreateModel,
  ): Promise<StudentAccountApplication> {
    const newUser = new User();
    newUser.userName = userName;
    newUser.email = studentProfile.email;
    newUser.firstName = studentProfile.firstName;
    newUser.lastName = studentProfile.lastName;
    newUser.creator = newUser;

    const newAccountApplication = new StudentAccountApplication();
    newAccountApplication.user = newUser;
    newAccountApplication.creator = newUser;
    newAccountApplication.submittedData = studentProfile;
    newAccountApplication.submittedDate = new Date();
    return this.repo.save(newAccountApplication);
  }
}
