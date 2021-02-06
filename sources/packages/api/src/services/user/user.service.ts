import { Injectable, Inject } from "@nestjs/common";
import { Connection } from "typeorm";
import { DataModelService } from "../../database/data.model.service";
import { User } from "../../database/entities";
import { UserInfo } from "../../types";

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

  async synchronizeUserInfo(userInfoBCServiceCard: UserInfo): Promise<User> {
    let userToSync = await this.getUser(userInfoBCServiceCard.userName);

    //Initializing a new user if one is not found
    if (!userToSync) {
      userToSync = new User();
    }

    if (
      userInfoBCServiceCard.email != userToSync.email ||
      userInfoBCServiceCard.lastName != userToSync.lastName ||
      userInfoBCServiceCard.givenNames != userToSync.firstName
    ) {
      userToSync.email = userInfoBCServiceCard.email;
      userToSync.lastName = userInfoBCServiceCard.lastName;
      userToSync.firstName = userInfoBCServiceCard.givenNames;
      return this.save(userToSync);
    }
    //If information between token and SABC db is same, then just returning without the database call
    return userToSync;
  }
}
