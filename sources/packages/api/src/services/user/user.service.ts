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

  async getActiveUser(userName: string) {
    return this.repo.findOne({ userName: userName, isActive: true });
  }
}
