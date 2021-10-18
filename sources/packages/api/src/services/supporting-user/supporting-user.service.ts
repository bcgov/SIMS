import { Inject, Injectable } from "@nestjs/common";
import { ContactInfo } from "../../types";
import { Connection, UpdateResult } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  Application,
  SupportingUser,
  SupportingUserType,
} from "../../database/entities";
import { removeWhiteSpaces } from "../../utilities/string-utils";

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
   * Updates supporting user (e.g. parent/partner).
   * @param applicationId application id to be used to search
   * for the record to be update.
   * @param supportingUserType type of the user to search
   * to have the supporting information updated.
   * @param contactInfo contact information provided by the
   * supporting user.
   * @param sin SIN provided by the supporting user.
   * @param birthDate birth date present on the supporting user
   * authentication information.
   * @param gender gender present on the the supporting user
   * authentication information.
   * @param supportingData additional questions answered by
   * the supporting user.
   * @param userId id of the user that represents this
   * supporting user.
   * @returns update result. Expected one and only one
   * row to be updated. If no rows are updated it means that
   * there is no supporting user record to be updated at
   * this moment. These records must be created by the workflow
   * and must exists prior of the supporting user logging to
   * provide the information.
   */
  async updateSupportingUser(
    applicationId: number,
    supportingUserType: SupportingUserType,
    contactInfo: ContactInfo,
    sin: string,
    birthDate: Date,
    gender: string,
    supportingData: any,
    userId: number,
  ): Promise<UpdateResult> {
    // Sub query to select the supporting user to be update.
    // The record must have the user id as null to ensure that it was never update before.
    // The table could also contains more than one record for parents so while defining
    // the record to be updated we must ensure that only one record will be updated.
    const selectRecordToUpdate = this.repo
      .createQueryBuilder("supportingUserSubQuery")
      .select("supportingUserSubQuery.id")
      .innerJoin("supportingUserSubQuery.application", "application")
      .where("supportingUserSubQuery.supportingUserType = :supportingUserType")
      .andWhere("supportingUserSubQuery.user.id is null")
      .andWhere("application.id = :applicationId")
      .orderBy("supportingUserSubQuery.id")
      .limit(1);
    // The SIN can come from with a few white spaces in the middle, so we need remove then
    // before inserting it because the DB will accept only 9 characters.
    const sinWithNoSpaces = removeWhiteSpaces(sin);
    return this.repo
      .createQueryBuilder("supportingUser")
      .update()
      .set({
        contactInfo,
        sin: sinWithNoSpaces,
        birthDate,
        gender,
        supportingData,
        user: { id: userId },
      })
      .where(`id = (${selectRecordToUpdate.getQuery()})`)
      .setParameters({ supportingUserType, applicationId })
      .execute();
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

  /**
   * Gets the supporting user (e.g. parent/partner) associated
   * with the particular Student Application.
   * @param applicationId application that contains
   * the income verification.
   * @param userId user id.
   * @returns supporting user.
   */
  async getSupportingUserByUserId(
    applicationId: number,
    userId: number,
  ): Promise<SupportingUser> {
    return this.repo.findOne({
      application: { id: applicationId },
      user: { id: userId },
    });
  }
}
