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
    const userToSync = await this.getUser(userInfoBCServiceCard.userName)
    if(userInfoBCServiceCard.email!=userToSync.email){
      userToSync.email = userInfoBCServiceCard.email;
    }
    return this.save(userToSync);
  }
}
