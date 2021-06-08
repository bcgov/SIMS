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

  async getUserLoginInfo(
    userName: string,
  ): Promise<{ id: number; isActive: boolean }> {
    const user = await this.repo
      .createQueryBuilder("user")
      .where("user.user_name = :userName", { userName })
      .select(["user.id"])
      .getRawOne();
    return {
      id: user.id,
      isActive: true,
    };
  }
}
