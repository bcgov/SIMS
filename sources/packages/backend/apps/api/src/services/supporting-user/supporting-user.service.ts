import { Injectable } from "@nestjs/common";
import { Brackets, DataSource, IsNull, UpdateResult } from "typeorm";
import {
  AddressInfo,
  ApplicationEditStatus,
  ApplicationStatus,
  ContactInfo,
  RecordDataModelService,
  SupportingUser,
  SupportingUserPersonalInfo,
  SupportingUserType,
  User,
} from "@sims/sims-db";
import { removeWhiteSpaces } from "../../utilities/string-utils";
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
   * Updates supporting user (e.g. parent/partner) data.
   * @param supportingUserId The ID of the supporting user record to be updated.
   * @param auditUserId The user performing the update.
   * @param updateInfo The information to be updated.
   * @returns The result of the update operation.
   */
  async updateSupportingUserReportedData(
    supportingUserId: number,
    auditUserId: number,
    updateInfo: UpdateSupportingUserInfo,
  ): Promise<UpdateResult> {
    const sinWithNoSpaces = updateInfo.sin
      ? removeWhiteSpaces(updateInfo.sin)
      : null;
    const personalInfo = updateInfo.hasValidSIN
      ? { hasValidSIN: updateInfo.hasValidSIN }
      : null;

    const auditUser = { id: auditUserId } as User;
    const user = { id: updateInfo.userId } as User;
    return this.repo.update(
      { id: supportingUserId, user: { id: IsNull() } },
      {
        contactInfo: updateInfo.contactInfo,
        sin: sinWithNoSpaces,
        birthDate: updateInfo.birthDate,
        supportingData: updateInfo.supportingData,
        user,
        personalInfo,
        modifier: auditUser,
      },
    );
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
        "supportingUser.personalInfo",
        "supportingUser.isAbleToReport",
        "supportingUser.fullName",
        "user.firstName",
        "user.lastName",
        "user.email",
        "application.id",
        "programYear.id",
      ])
      .leftJoin("supportingUser.user", "user")
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

  /**
   * Get supporting user for application based on type and payload.
   * Unified method that handles both Parent and Partner supporting user types.
   * @param supportingUserType type of supporting user (Parent/Partner).
   * @param applicationNumber application number.
   * @param studentsLastName students last name.
   * @param options options.
   * - `fullName` parent full name.
   * - `studentsDateOfBirth` students date of birth.
   * @returns supporting user.
   */
  async getSupportingUserForApplication(
    supportingUserType: SupportingUserType,
    applicationNumber: string,
    studentsLastName: string,
    options?: {
      fullName?: string;
      studentsDateOfBirth?: string;
    },
  ): Promise<SupportingUser> {
    // Query to get the application for the supporting user.
    const query = this.repo
      .createQueryBuilder("supportingUser")
      .select([
        "supportingUser.id",
        "supportingUser.fullName",
        "supportingUser.isAbleToReport",
        "supportingUser.supportingData",
        "student.id",
        "user.id",
        "user.userName",
        "application.id",
        "application.offeringIntensity",
        "programYear.id",
        "programYear.startDate",
      ])
      .innerJoin("supportingUser.application", "application")
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("application.applicationNumber = :applicationNumber", {
        applicationNumber,
      })
      .andWhere("user.lastName ILIKE :lastName", {
        lastName: studentsLastName,
      })
      .andWhere("supportingUser.supportingUserType = :supportingUserType", {
        supportingUserType,
      })
      .andWhere("supportingUser.isAbleToReport = true")
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            "application.applicationStatus = :inProgressApplicationStatus",
            {
              inProgressApplicationStatus: ApplicationStatus.InProgress,
            },
          ).orWhere(
            "application.applicationEditStatus = :changeInProgressApplicationEditStatus",
            {
              changeInProgressApplicationEditStatus:
                ApplicationEditStatus.ChangeInProgress,
            },
          );
        }),
      );
    if (options?.fullName) {
      query.andWhere("supportingUser.fullName ILIKE :fullName", {
        fullName: options.fullName,
      });
    }
    if (options?.studentsDateOfBirth) {
      query.andWhere("student.birthDate = :birthDate", {
        birthDate: options.studentsDateOfBirth,
      });
    }

    return query.getOne();
  }
}
