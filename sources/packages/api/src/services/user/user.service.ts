import { Injectable, Inject } from "@nestjs/common";
import { Connection } from "typeorm";
import { DataModelService } from "../../database/data.model.service";
import { User } from "../../database/entities";

@Injectable()
export class UserService extends DataModelService<User> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(User));
  }

  async getUser(userName: string) {
    return this.repo.findOne({
      userName,
    });
  }

  /**
   * Gets basic information from the user to be used during authorization process.
   * @param userName User name (same from Keycloak).
   * @returns User login info if the user was found, otherwise null.
   */
  async getUserLoginInfo(
    userName: string,
  ): Promise<{ id: number; isActive: boolean }> {
    const user = await this.repo
      .createQueryBuilder("user")
      .where("user.user_name = :userName", { userName })
      .select(["user.id", "user.is_active"])
      .getRawOne();

    if (!user) {
      // When Students and Institutions users logins for the first time
      // there will no users records until the Institution Profile or
      // Student Profile is finalized, and this is expected.
      return null;
    }

    return {
      id: user.user_id,
      isActive: user.is_active,
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

  async getActiveUser(userName: string) {
    return this.repo.findOne({ userName: userName, isActive: true });
  }

  /**
   * Creates or updates Ministry user information.
   * @param userName user name as it is on KeyCloak.
   * @param email email received from identity provider.
   * @param givenNames givenNames received from identity provider.
   * @param lastName lastName received from identity provider.
   * @returns created/updated user.
   */
  async syncAESTUser(
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
    user.isActive = true;
    return this.repo.save(user);
  }
}
