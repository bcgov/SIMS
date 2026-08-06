import { Injectable } from "@nestjs/common";
import {
  DataSource,
  EntityManager,
  IsNull,
  LessThanOrEqual,
  Raw,
  Repository,
  UpdateResult,
} from "typeorm";
import {
  DataModelService,
  ORMCacheManager,
  SpecificIdentityProviders,
  Student,
  User,
} from "@sims/sims-db";
import { UserLoginInfo } from "./user.model";
import { BetaUsersAuthorizations } from "@sims/sims-db/entities";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@sims/utilities/config";

@Injectable()
export class UserService extends DataModelService<User> {
  constructor(
    dataSource: DataSource,
    @InjectRepository(BetaUsersAuthorizations)
    private readonly betaUsersAuthorizationsRepo: Repository<BetaUsersAuthorizations>,
    private readonly configService: ConfigService,
    private readonly ormCacheManager: ORMCacheManager,
  ) {
    super(dataSource.getRepository(User));
  }

  /**
   * Retrieves a user by their user name.
   * @param userName The user name to look up.
   * @returns The user if found, otherwise null.
   */
  async getUser(userName: string): Promise<User | null> {
    return this.repo.findOne({
      where: {
        userName,
      },
    });
  }

  /**
   * Retrieves a user email by the user ID, returning only the fields needed for notification (e.g., email).
   * Used to fetch the requester email for notifications.
   * Throws an error if the user does not exist (findOneOrFail).
   * @param userId The user ID to look up.
   * @param options.
   * - `entityManager`: allow it to be part of a larger transaction if needed.
   * @returns User email string.
   */
  async getUserEmail(
    userId: number,
    options?: { entityManager?: EntityManager },
  ): Promise<string> {
    const repo = options?.entityManager?.getRepository(User) ?? this.repo;
    const user = await repo.findOneOrFail({
      select: { email: true },
      where: { id: userId },
    });
    return user.email;
  }

  /**
   * Gets basic information from the user to be used during authorization process.
   * @param userName User name (same from Keycloak).
   * @returns User login info if the user was found, otherwise null.
   */
  async getUserLoginInfo(userName: string): Promise<UserLoginInfo> {
    const user = await this.repo
      .createQueryBuilder("user")
      .select("user.id", "id")
      .addSelect("user.isActive", "isActive")
      .addSelect("student.id", "studentId")
      .addSelect("user.identityProviderType", "identityProviderType")
      .leftJoin(Student, "student", "student.user.id = user.id")
      .where("user.userName = :userName", { userName })
      .cache(this.ormCacheManager.getUserLoginCacheId(userName))
      .getRawOne();

    if (!user) {
      // When users logins for the first time there will be no users records.
      // For instance, Students, Institutions Users and Supporting Users, must complete
      // their profiles in order to have the user persisted to the database.
      return null;
    }

    return {
      id: user.id,
      isActive: user.isActive,
      studentId: user.studentId,
      identityProviderType: user.identityProviderType,
    };
  }

  /**
   * Updates the user identity provider used for authentication.
   * @param userId user to be updated.
   * @param identityProviderType identity provider.
   */
  async updateIdentityProvider(
    userId: number,
    identityProviderType: SpecificIdentityProviders,
  ): Promise<void> {
    await this.repo.update({ id: userId }, { identityProviderType });
  }

  /**
   * Define the user as active or inactive to allow or prevent access to the system.
   * @param userId user to be updated.
   * @param isActive active or inactive value.
   * @param auditUserId user who is making the changes.
   * @returns update result.
   */
  async updateUserStatus(
    userId: number,
    isActive: boolean,
    auditUserId: number,
  ): Promise<UpdateResult> {
    const updateResult = await this.repo
      .createQueryBuilder()
      .update(User)
      .set({
        isActive: isActive,
        modifier: { id: auditUserId } as User,
      })
      .where("id = :id", { id: userId })
      .execute();
    // Ensures the change takes effect immediately instead of waiting for the
    // cached login information to expire.
    const user = await this.repo.findOne({
      select: { userName: true },
      where: { id: userId },
    });
    if (user) {
      await this.ormCacheManager.clearUserLoginCache(user.userName);
    }
    return updateResult;
  }

  /**
   * Updates the user's email address.
   * @param userId The ID of the user to update.
   * @param email The new email address.
   * @returns The result of the update operation.
   */
  async updateUserEmail(userId: number, email: string): Promise<UpdateResult> {
    return this.repo.update(
      { id: userId },
      { email, modifier: { id: userId } as User },
    );
  }

  /**
   * Retrieves an active user by their user name.
   * @param userName The user name to look up.
   * @returns The active user if found, otherwise null.
   */
  async getActiveUser(userName: string): Promise<User | null> {
    return this.repo.findOne({ where: { userName: userName, isActive: true } });
  }

  /**
   * Creates or updates user information.
   * @param userName user name as it is on KeyCloak.
   * @param email email received from identity provider.
   * @param givenNames givenNames received from identity provider.
   * @param lastName lastName received from identity provider.
   * @returns created/updated user.
   */
  async syncUser(
    userName: string,
    email: string,
    givenNames: string,
    lastName: string,
  ): Promise<User> {
    let user = await this.getUser(userName);
    if (!user) {
      user = new User();
      user.userName = userName;
      user.creator = user;
    } else {
      user.modifier = user;
    }
    user.email = email;
    user.firstName = givenNames;
    user.lastName = lastName;
    return this.repo.save(user);
  }

  /**
   * Check if a user already exists on DB by the user name that is a unique column.
   * @param userName unique user name.
   * @returns true if the user exists, otherwise false.
   */
  async doesUserExists(userName: string): Promise<boolean> {
    const user = await this.repo
      .createQueryBuilder("user")
      .select("1")
      .where("user.userName = :userName", { userName })
      .getRawOne();
    return !!user;
  }

  /**
   * Checks if there is a full-time beta user authorization valid for given and last names provided.
   * @param lastName full-time beta user last name.
   * @param givenNames full-time beta user given names.
   * @returns true in case there is a full-time beta user authorization valid for given and last names provided.
   */
  async isUserAuthorizedForFulltime(
    lastName: string,
    givenNames?: string,
  ): Promise<boolean> {
    if (!this.configService.allowBetaUsersOnly) {
      // If the configuration indicates that there is no beta restrictions,
      // then all users are allowed to access full-time applications.
      return true;
    }
    const now = new Date();
    const where = {
      givenNames: Raw((alias) => `LOWER(${alias}) = LOWER(:givenNames)`, {
        givenNames,
      }),
      lastName: Raw((alias) => `LOWER(${alias}) = LOWER(:lastName)`, {
        lastName,
      }),
      enabledFrom: LessThanOrEqual(now),
    };
    if (!givenNames) {
      where.givenNames = IsNull();
    }
    return this.betaUsersAuthorizationsRepo.exists({ where });
  }
}
