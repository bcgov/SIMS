import { Injectable } from "@nestjs/common";
import { DataSource, IsNull, UpdateResult } from "typeorm";
import {
  AddressInfo,
  ContactInfo,
  RecordDataModelService,
  SupportingUser,
  SupportingUserPersonalInfo,
  SupportingUserType,
  User,
  configureIdleTransactionSessionTimeout,
} from "@sims/sims-db";
import { removeWhiteSpaces } from "../../utilities/string-utils";
import { SUPPORTING_USERS_TRANSACTION_IDLE_TIMEOUT_SECONDS } from "../../utilities";
import { CustomNamedError } from "@sims/utilities";
import { SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA } from "./constants";
import {
  ReportedSupportingUserData,
  UpdateSupportingUserInfo,
} from "./supporting-user.models";

@Injectable()
export class SupportingUserService extends RecordDataModelService<SupportingUser> {
  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(SupportingUser));
  }

  /**
   * Updates supporting user (e.g. parent/partner).
   * @param applicationId application id to be used to search
   * for the record to be update.
   * @param supportingUserType type of the user to search
   * to have the supporting information updated.
   * @param auditUserId user who is making the changes.
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
    auditUserId: number,
    updateInfo: UpdateSupportingUserInfo,
  ): Promise<SupportingUser> {
    const queryRunner = this.dataSource.createQueryRunner();
    await configureIdleTransactionSessionTimeout(
      queryRunner,
      SUPPORTING_USERS_TRANSACTION_IDLE_TIMEOUT_SECONDS,
    );

    try {
      await queryRunner.startTransaction();
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
      userToUpdate.supportingData = updateInfo.supportingData;
      userToUpdate.user = { id: updateInfo.userId } as User;
      userToUpdate.modifier = { id: auditUserId } as User;
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
   * @param userId user id.
   * @returns supporting user.
   */
  async getSupportingUserByUserId(
    applicationId: number,
    userId: number,
  ): Promise<SupportingUser> {
    return this.repo.findOne({
      where: { application: { id: applicationId }, user: { id: userId } },
    });
  }

  /**
   * Get the supporting users (e.g. parent/partner) associated
   * with the particular Student Application.
   * @param applicationId application id
   * @returns supporting users.
   */
  async getSupportingUsersByApplicationId(
    applicationId: number,
  ): Promise<SupportingUser[]> {
    return this.repo
      .createQueryBuilder("supportingUser")
      .select([
        "supportingUser.id",
        "supportingUser.supportingUserType",
        "supportingUser.supportingData",
        "supportingUser.isAbleToReport",
        "supportingUser.fullName",
      ])
      .innerJoin("supportingUser.application", "application")
      .where("application.id = :applicationId", {
        applicationId,
      })
      .getMany();
  }

  /**
   * Get the supporting users (e.g. parent/partner) details
   * @param supportingUserId supportingUser id
   * @returns supporting users.
   */
  async getSupportingUsersDetails(
    supportingUserId: number,
  ): Promise<SupportingUser> {
    return this.repo
      .createQueryBuilder("supportingUser")
      .select([
        "supportingUser.supportingUserType",
        "supportingUser.contactInfo",
        "supportingUser.sin",
        "supportingUser.birthDate",
        "supportingUser.supportingData",
        "user.firstName",
        "user.lastName",
        "user.email",
        "application.id",
        "programYear.id",
      ])
      .innerJoin("supportingUser.user", "user")
      .innerJoin("supportingUser.application", "application")
      .innerJoin("application.programYear", "programYear")
      .where("supportingUser.id = :supportingUserId", {
        supportingUserId,
      })
      .getOne();
  }

  /**
   * Get the supporting user who is identifiable by the full name.
   * @param supportingUserId supporting user id.
   * @param options options.
   * - `studentId` student id.
   * - `isAbleToReport` is supporting user able to report.
   * - `loadSupportingData` option to load supporting data.
   * @returns supporting user details.
   */
  async getIdentifiableSupportingUser(
    supportingUserId: number,
    options?: {
      studentId?: number;
      isAbleToReport?: boolean;
      loadSupportingData?: boolean;
    },
  ): Promise<SupportingUser> {
    return this.repo.findOne({
      select: {
        id: true,
        fullName: true,
        isAbleToReport: true,
        supportingData: !!options?.loadSupportingData,
        application: {
          id: true,
          programYear: { id: true, startDate: true },
          applicationStatus: true,
          applicationEditStatus: true,
        },
      },
      relations: { application: { programYear: true } },
      where: {
        id: supportingUserId,
        isAbleToReport: options?.isAbleToReport,
        application: { student: { id: options?.studentId } },
        supportingUserType: SupportingUserType.Parent,
      },
    });
  }

  /**
   * Update supporting user reported data for the supporting user who is not able to report.
   * @param supportingUserId supporting user id.
   * @param reportedData reported supporting users data.
   * @param auditUserId user who is making the changes.
   * @returns update result.
   */
  async updateReportedData(
    supportingUserId: number,
    reportedData: ReportedSupportingUserData,
    auditUserId: number,
  ): Promise<UpdateResult> {
    // Get address and contact info.
    const addressInfo: AddressInfo = {
      addressLine1: reportedData.addressLine1,
      addressLine2: reportedData.addressLine2,
      provinceState: reportedData.provinceState,
      country: reportedData.country,
      city: reportedData.city,
      postalCode: reportedData.postalCode,
    };
    const contactInfo: ContactInfo = {
      phone: reportedData.phone,
      address: addressInfo,
    };
    const personalInfo: SupportingUserPersonalInfo = {
      givenNames: reportedData.givenNames,
      lastName: reportedData.lastName,
    };
    // Update supporting user.
    return this.repo.update(
      { id: supportingUserId, isAbleToReport: false, supportingData: IsNull() },
      {
        supportingData: reportedData.supportingData,
        personalInfo,
        contactInfo,
        modifier: { id: auditUserId } as User,
      },
    );
  }
}
