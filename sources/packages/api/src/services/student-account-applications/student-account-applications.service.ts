import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { StudentAccountApplication, User } from "../../database/entities";
import { DataSource, IsNull } from "typeorm";
import {
  StudentAccountApplicationApprovalModel,
  StudentAccountApplicationCreateModel,
} from "./student-account-applications.models";
import { StudentService } from "../student/student.service";
import { CustomNamedError, getISODateOnlyString } from "../../utilities";
import { STUDENT_ACCOUNT_APPLICATION_NOT_FOUND } from "../../constants";

@Injectable()
export class StudentAccountApplicationsService extends RecordDataModelService<StudentAccountApplication> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentService: StudentService,
  ) {
    super(dataSource.getRepository(StudentAccountApplication));
  }

  /**
   * Get the student account application previously submitted
   * by the student for the basic BCeID student account creation.
   * @param id student account application id.
   * @returns student account application.
   */
  async getStudentAccountApplicationsById(
    id: number,
  ): Promise<StudentAccountApplication | null> {
    return this.repo.findOne({
      select: { id: true, submittedData: true },
      where: { id },
    });
  }

  /**
   * Get the list of all student account applications
   * waiting to be assessed by the Ministry.
   * @returns list of pending student account applications.
   */
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
        assessedDate: IsNull(),
      },
      order: {
        submittedDate: "ASC",
      },
    });
  }

  /**
   * Create a new student account application to be reviewed by
   * the Ministry to confirm the student's basic BCeID identity.
   * @param userName user name that uniquely identifies this user.
   * @param studentProfile information to be assessed by the Ministry.
   * @returns student account application created id.
   */
  async createStudentAccountApplication(
    userName: string,
    studentProfile: StudentAccountApplicationCreateModel,
  ): Promise<StudentAccountApplication> {
    const newUser = new User();
    const now = new Date();
    newUser.userName = userName;
    newUser.email = studentProfile.email;
    newUser.firstName = studentProfile.firstName;
    newUser.lastName = studentProfile.lastName;
    newUser.creator = newUser;
    newUser.createdAt = now;

    const newAccountApplication = new StudentAccountApplication();
    newAccountApplication.user = newUser;
    newAccountApplication.creator = newUser;
    newAccountApplication.createdAt = now;
    newAccountApplication.submittedData = studentProfile;
    newAccountApplication.submittedDate = now;
    return this.repo.save(newAccountApplication);
  }

  /**
   * Approve the student account application associating the user
   * with a student account. The Ministry can also adjust any student
   * data that will then be used to create the student account.
   * @param id student account application id.
   * @param studentProfile user and student data to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   */
  async approveStudentAccountApplication(
    id: number,
    studentProfile: StudentAccountApplicationApprovalModel,
    auditUserId: number,
  ) {
    const accountApplication = await this.repo.findOne({
      select: { id: true, user: { id: true } },
      relations: { user: true },
      where: { id },
    });

    if (!accountApplication) {
      throw new CustomNamedError(
        "Student account application not found.",
        STUDENT_ACCOUNT_APPLICATION_NOT_FOUND,
      );
    }

    const userInfo = {
      userId: accountApplication.user.id,
      lastName: studentProfile.lastName,
      givenNames: studentProfile.firstName,
      email: studentProfile.email,
      birthdate: getISODateOnlyString(studentProfile.dateOfBirth),
      gender: studentProfile.gender,
    };

    const studentInfo = {
      phone: studentProfile.phone,
      sinNumber: studentProfile.sinNumber,
      addressLine1: studentProfile.addressLine1,
      addressLine2: studentProfile.addressLine2,
      provinceState: studentProfile.provinceState,
      country: studentProfile.country,
      city: studentProfile.city,
      postalCode: studentProfile.postalCode,
      selectedCountry: studentProfile.selectedCountry,
    };

    return this.dataSource.transaction(async (entityManager) => {
      // Update the student account application with the approval.
      const auditUser = { id: auditUserId } as User;
      const now = new Date();
      accountApplication.assessedBy = auditUser;
      accountApplication.modifier = auditUser;
      accountApplication.updatedAt = now;
      accountApplication.assessedDate = now;
      await entityManager
        .getRepository(StudentAccountApplication)
        .save(accountApplication);
      // Create the new student and updates the user.
      return this.studentService.createStudentFromAccountApplication(
        userInfo,
        studentInfo,
        auditUserId,
        entityManager,
        accountApplication.id,
      );
    });
  }

  /**
   * Declines the student account application.
   * @param id student account application id.
   * @param auditUserId user that should be considered the one that is causing the changes.
   */
  async declineStudentAccountApplication(
    id: number,
    auditUserId: number,
  ): Promise<void> {
    // Soft-delete the account application and associate the modifier.
    const updateResult = await this.repo.update(id, {
      deletedAt: new Date(),
      modifier: { id: auditUserId },
    });
    if (!updateResult.affected) {
      throw new CustomNamedError(
        "Student account application not found.",
        STUDENT_ACCOUNT_APPLICATION_NOT_FOUND,
      );
    }
  }

  /**
   * Checks if the user has a pending student account applications.
   * @param userId user to be verified.
   * @returns true, if there is a pending student account application,
   * otherwise, false.
   */
  async hasPendingStudentAccountApplication(userId: number): Promise<boolean> {
    const accountApplication = await this.repo.findOne({
      select: {
        id: true,
      },
      where: {
        assessedDate: IsNull(),
        user: {
          id: userId,
        },
      },
    });
    return !!accountApplication;
  }
}
