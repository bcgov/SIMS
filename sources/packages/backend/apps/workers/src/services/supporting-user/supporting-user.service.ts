import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  RecordDataModelService,
  Application,
  SupportingUser,
  SupportingUserType,
} from "@sims/sims-db";

@Injectable()
export class SupportingUserService extends RecordDataModelService<SupportingUser> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(SupportingUser));
  }

  async hasSupportingUsers(applicationId: number) {
    const someSupportingUser = await this.repo.findOne({
      select: { id: true },
      where: { application: { id: applicationId } },
    });
    return !!someSupportingUser;
  }

  async getSupportingUserById(
    supportingUserId: number,
  ): Promise<SupportingUser> {
    return this.repo.findOne({
      select: { id: true, supportingData: true },
      where: { id: supportingUserId },
    });
  }

  async createSupportingUsers(
    applicationId: number,
    supportingUserTypes: SupportingUserType[],
  ): Promise<SupportingUser[]> {
    const application = { id: applicationId } as Application;
    const newSupportingUsers = supportingUserTypes.map((supportingUserType) => {
      const newSupportingUser = new SupportingUser();
      newSupportingUser.application = application;
      newSupportingUser.supportingUserType = supportingUserType;
      return newSupportingUser;
    });
    return this.repo.save(newSupportingUsers);
  }
}
