import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, IsNull, Not } from "typeorm";
import {
  RecordDataModelService,
  Application,
  SupportingUser,
  SupportingUserType,
} from "@sims/sims-db";
import { IdentifiableSupportingUser } from "..";
import { SystemUsersService } from "@sims/services";

@Injectable()
export class SupportingUserService extends RecordDataModelService<SupportingUser> {
  constructor(
    dataSource: DataSource,
    private readonly systemUserService: SystemUsersService,
  ) {
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
   * @param supportingUserTypes types to be created. This method accepts, for instance,
   * - ['Parent', 'Parent']: two parents will be created;
   * - ['Partner']: one partner will be created.
   * - ['Partner', 'Parent']: one parent and one partner will be created.
   * - ['Parent', 'Parent', 'Partner', 'Partner']: multiple parents and multiples partners.
   * These examples represent what this method can do and are not necessarily
   * the current business logic.
   * @param entityManager entity manager to execute in transaction.
   * @returns created supporting users.
   */
  async createSupportingUsers(
    applicationId: number,
    supportingUserTypes: SupportingUserType[],
    entityManager: EntityManager,
  ): Promise<SupportingUser[]> {
    const application = { id: applicationId } as Application;
    const newSupportingUsers = supportingUserTypes.map((supportingUserType) => {
      const newSupportingUser = new SupportingUser();
      newSupportingUser.application = application;
      newSupportingUser.supportingUserType = supportingUserType;
      newSupportingUser.isAbleToReport = true;
      newSupportingUser.creator = this.systemUserService.systemUser;
      return newSupportingUser;
    });
    return entityManager.getRepository(SupportingUser).save(newSupportingUsers);
  }

  /**
   * Create a new identifiable supporting user if one does not already exist.
   * @param supportingUser data to create the supporting user.
   * @param entityManager entity manager to execute in transaction.
   * @returns the ID of the created or existing supporting user.
   */
  async createIdentifiableSupportingUser(
    supportingUser: IdentifiableSupportingUser,
    entityManager: EntityManager,
  ): Promise<number> {
    const newSupportingUser = new SupportingUser();
    newSupportingUser.application = {
      id: supportingUser.applicationId,
    } as Application;
    newSupportingUser.supportingUserType = supportingUser.supportingUserType;
    newSupportingUser.fullName = supportingUser.fullName;
    newSupportingUser.isAbleToReport = supportingUser.isAbleToReport;
    newSupportingUser.creator = this.systemUserService.systemUser;
    const supportingUserRepo = entityManager.getRepository(SupportingUser);
    const insertResult = await supportingUserRepo
      .createQueryBuilder()
      .insert()
      .into(SupportingUser)
      .values(newSupportingUser)
      .orIgnore(
        "ON CONSTRAINT supporting_users_application_id_full_name DO NOTHING",
      )
      .execute();
    // If the user was created, return its ID.
    const [identifier] = insertResult.identifiers;
    if (identifier) {
      return +identifier.id;
    }
    // If the user was not created, it means that it already exists.
    // Return the ID of the existing user.
    const existingSupportingUser = await supportingUserRepo.findOne({
      select: { id: true },
      where: {
        application: { id: supportingUser.applicationId },
        fullName: supportingUser.fullName,
      },
    });
    return existingSupportingUser.id;
  }

  /**
   * Check if the supporting user can execute income verification.
   * @param supportingUserId supporting user ID.
   * @returns true if the supporting user can execute income verification,
   * false otherwise.
   */
  async canExecuteIncomeVerification(
    supportingUserId: number,
  ): Promise<boolean> {
    return this.repo.exists({
      where: { id: supportingUserId, sin: Not(IsNull()) },
    });
  }
}
