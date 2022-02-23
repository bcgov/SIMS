import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  Application,
  SupportingUser,
  SupportingUserType,
  User,
} from "../../database/entities";
import { removeWhiteSpaces } from "../../utilities/string-utils";
import { configureIdleTransactionSessionTimeout } from "../../utilities/database";
import {
  CustomNamedError,
  SUPPORTING_USERS_TRANSACTION_IDLE_TIMEOUT_SECONDS,
} from "../../utilities";
import { SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA } from "./constants";
import { UpdateSupportingUserInfo } from "./supporting-user.models";

@Injectable()
export class SupportingUserService extends RecordDataModelService<SupportingUser> {
  constructor(private readonly connection: Connection) {
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
   * @param updateInfo information that must be updated
   * altogether when a supporting user is providing
   * the supporting data for a Student Application.
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
    updateInfo: UpdateSupportingUserInfo,
  ): Promise<SupportingUser> {
    const queryRunner = this.connection.createQueryRunner();
    await configureIdleTransactionSessionTimeout(
      queryRunner,
      SUPPORTING_USERS_TRANSACTION_IDLE_TIMEOUT_SECONDS,
    );

    try {
      queryRunner.startTransaction();
      // Query to select the supporting user to be update.
      // The record must have the user id as null to ensure that it was never update before.
      // The table could also contains more than one record for parents so while defining
      // the record to be updated we must ensure that only one record will be updated.
      // The below query will lock the specific records in the select for updates. Case
      // two parents tries to update the record at the same time the second one will wait
      // till the first one finishes it.
      const transactionRepo = queryRunner.manager.getRepository(SupportingUser);
      const possibleUsersToUpdate = await transactionRepo
        .createQueryBuilder("supportingUser")
        .setLock("pessimistic_write")
        .select("supportingUser.id")
        .innerJoin("supportingUser.application", "application")
        .where("supportingUser.supportingUserType = :supportingUserType", {
          supportingUserType,
        })
        .andWhere("supportingUser.user.id is null")
        .andWhere("application.id = :applicationId", { applicationId })
        .orderBy("supportingUser.id")
        .getMany();

      // Case there are more than one records (e.g. two parents), just selected one
      // to execute the update.
      const userToUpdate = possibleUsersToUpdate.shift();
      if (!userToUpdate) {
        throw new CustomNamedError(
          `The application is not expecting supporting information from a ${supportingUserType.toLowerCase()} to be provided at this time.`,
          SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA,
        );
      }

      // The SIN can be received with a few white spaces in the middle, so we need remove then
      // before inserting it because the DB will accept only 9 characters.
      const sinWithNoSpaces = removeWhiteSpaces(updateInfo.sin);
      userToUpdate.contactInfo = updateInfo.contactInfo;
      userToUpdate.sin = sinWithNoSpaces;
      userToUpdate.birthDate = updateInfo.birthDate;
      userToUpdate.gender = updateInfo.gender;
      userToUpdate.supportingData = updateInfo.supportingData;
      userToUpdate.user = { id: updateInfo.userId } as User;
      const updatedUser = await transactionRepo.save(userToUpdate);
      await queryRunner.commitTransaction();
      return updatedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
