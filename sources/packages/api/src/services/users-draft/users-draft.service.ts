import { Inject, Injectable } from "@nestjs/common";
import { DataModelService } from "../../database/data.model.service";
import { UsersDraft } from "../../database/entities";
import { Connection } from "typeorm";

@Injectable()
export class UsersDraftService extends DataModelService<UsersDraft> {
  constructor(
    @Inject("Connection")
    private readonly connection: Connection,
  ) {
    super(connection.getRepository(UsersDraft));
  }

  async getDraft(formPath: string, userName: string): Promise<UsersDraft> {
    return this.repo.findOne({
      formPath,
      userName,
    });
  }

  async saveDraft(formPath: string, userName: string, data: any) {
    let existing: UsersDraft = await this.getDraft(formPath, userName);
    if (existing) {
      existing.updatedAt = new Date();
    } else {
      existing = this.repo.create();
      existing.formPath = formPath;
      existing.userName = userName;
    }
    existing.data = data;
    return await this.save(existing);
  }

  async deleteDraft(formPath: string, userName: string) {
    let existing: UsersDraft = await this.getDraft(formPath, userName);
    if (existing) {
      await this.remove(existing);
    }
  }
}
