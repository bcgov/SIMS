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

  /**
   * Checks if the supporting users are already present for an application.
   * @param applicationId application to be verified.
   * @returns true if the application already have the supporting users,
   * otherwise, false.
   */
  async hasSupportingUsers(applicationId: number) {
    const someSupportingUser = await this.repo.findOne({
      select: { id: true },
      where: { application: { id: applicationId } },
    });
    return !!someSupportingUser;
  }

  /**
   * Get the supporting user data by its id.
   * @param supportingUserId supporting user id.
   * @returns supporting user data.
   */
  async getSupportingUserById(
    supportingUserId: number,
  ): Promise<SupportingUser> {
    return this.repo.findOne({
      select: { id: true, supportingData: true },
      where: { id: supportingUserId },
    });
  }

  /**
   * Create the supporting users of provided types.
   * @param applicationId application to have the supporting users created.
   * @param supportingUserTypes types to be create. This method accepts, for instance,
   * - ['Parent', 'Parent']: two parents will be created;
   * - ['Partner', 'Parent']: one parent and one partner will be created.
   * @returns created supporting users.
   */
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
