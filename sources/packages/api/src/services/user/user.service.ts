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

  async updateUserStatus(userId: number, isActive: boolean){
    return this.repo
    .createQueryBuilder()
    .update(User)
    .set({ isActive: isActive})
    .where("id = :id", { id: userId })
    .execute();
  }

  async getActiveUser(userName: string) {
    return this.repo.findOne({ where: {userName:userName, isActive: true} });
  }

}
