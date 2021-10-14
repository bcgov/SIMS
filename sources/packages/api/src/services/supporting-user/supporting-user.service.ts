import { Inject, Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  Application,
  SupportingUser,
  SupportingUserType,
} from "../../database/entities";

@Injectable()
export class SupportingUserService extends RecordDataModelService<SupportingUser> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(SupportingUser));
  }

  /**
   * Creates a new supporting user with minimal information
   * required to allow the supporting user (e.g. parent/partner)
   * to populate the remaining columns later.
   * @param applicationId application id that requires supporting
   * information.
   * @param supportingUserType type of the user that need provide
   * the supporting information for a particular application.
   * @returns newly created supporting user with minimal information.
   */
  async createSupportingUser(
    applicationId: number,
    supportingUserType: SupportingUserType,
  ): Promise<SupportingUser> {
    const newSupportingUser = new SupportingUser();
    newSupportingUser.application = { id: applicationId } as Application;
    newSupportingUser.supportingUserType = supportingUserType;
    return this.repo.save(newSupportingUser);
  }

  /**
   * Gets the supporting user (e.g. parent/partner) associated
   * with the particular Student Application.
   * @param applicationId application that contains
   * the income verification.
   * @param supportingUserId supporting user id.
   * @returns supporting user.
   */
  async getSupportingUserById(
    applicationId: number,
    supportingUserId: number,
  ): Promise<SupportingUser> {
    return this.repo.findOne({
      id: supportingUserId,
      application: { id: applicationId },
    });
  }
}
