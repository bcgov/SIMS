import { Injectable } from "@nestjs/common";
import { SERVICE_ACCOUNT_DEFAULT_USER_EMAIL } from "../../utilities";
import { DataSource } from "typeorm";
import { DataModelService } from "../../database/data.model.service";
import { Student, User } from "../../database/entities";
import { UserLoginInfo } from "./user.model";

@Injectable()
export class UserService extends DataModelService<User> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(User));
  }

  async getUser(userName: string) {
    return this.repo.findOne({
      where: {
        userName,
      },
    });
  }

  /**
   * Gets basic information from the user to be used during authorization process.
   * @param userName User name (same from Keycloak).
   * @returns User login info if the user was found, otherwise null.
   */
  async getUserLoginInfo(userName: string): Promise<UserLoginInfo> {
    const user = await this.repo
      .createQueryBuilder("user")
      .select("user.id", "id")
      .addSelect("user.isActive", "isActive")
      .addSelect("student.id", "studentId")
      .leftJoin(Student, "student", "student.user.id = user.id")
      .where("user.userName = :userName", { userName })
      .getRawOne();

    if (!user) {
      // When users logins for the first time there will be no users records.
      // For instance, Students, Institutions Users and Supporting Users, must complete
      // their profiles in order to have the user persisted to the database.
      return null;
    }

    return {
      id: user.id,
      isActive: user.isActive,
      studentId: user.studentId,
    };
  }

  async updateUserStatus(userId: number, isActive: boolean) {
    return this.repo
      .createQueryBuilder()
      .update(User)
      .set({ isActive: isActive })
      .where("id = :id", { id: userId })
      .execute();
  }

  async updateUserEmail(userId: number, email: string) {
    return this.repo.update({ id: userId }, { email });
  }

  async getActiveUser(userName: string): Promise<User> {
    return this.repo.findOne({ where: { userName: userName, isActive: true } });
  }

  /**
   * Creates or updates user information.
   * @param userName user name as it is on KeyCloak.
   * @param email email received from identity provider.
   * @param givenNames givenNames received from identity provider.
   * @param lastName lastName received from identity provider.
   * @returns created/updated user.
   */
  async syncUser(
    userName: string,
    email: string,
    givenNames: string,
    lastName: string,
  ) {
    let user = await this.getUser(userName);
    if (!user) {
      user = new User();
      user.userName = userName;
    }
    user.email = email;
    user.firstName = givenNames;
    user.lastName = lastName;
    return this.repo.save(user);
  }

  /**
   * Creates an user associated with the a service account.
   * @param userName user name to create the user for the service account.
   * @returns new user created.
   */
  async createServiceAccountUser(userName: string) {
    const user = new User();
    user.userName = userName;
    user.email = SERVICE_ACCOUNT_DEFAULT_USER_EMAIL;
    user.firstName = null;
    user.lastName = userName;
    return this.repo.save(user);
  }
}
