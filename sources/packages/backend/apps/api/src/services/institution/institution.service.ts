import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  Institution,
  InstitutionUser,
  InstitutionUserAuth,
  InstitutionUserTypeAndRole,
  User,
  InstitutionLocation,
  InstitutionType,
  Note,
  NoteType,
  IdentityProviders,
  getUserFullNameLikeSearch,
  Application,
  ApplicationStatus,
} from "@sims/sims-db";
import { DataSource, EntityManager, IsNull, Not, Repository } from "typeorm";
import { InstitutionUserType, UserInfo } from "../../types";
import { BCeIDService } from "../bceid/bceid.service";
import { AccountDetails } from "../bceid/account-details.model";
import {
  sortUsersColumnMap,
  PaginationOptions,
  transformAddressDetails,
} from "../../utilities";
import { CustomNamedError } from "@sims/utilities";
import {
  UpdateInstitution,
  InstitutionFormModel,
  InstitutionUserModel,
  InstitutionUserTypeAndRoleModel,
  UserPermissionModel,
} from "./institution.service.model";
import { BCeIDAccountTypeCodes } from "../bceid/bceid.models";
import { InstitutionUserRoles, InstitutionUserTypes } from "../../auth";
import {
  BCEID_ACCOUNT_NOT_FOUND,
  INSTITUTION_MUST_HAVE_AN_ADMIN,
  INSTITUTION_USER_ALREADY_EXISTS,
  LEGAL_SIGNING_AUTHORITY_EXIST,
} from "../../constants";
import { InstitutionUserAuthService } from "../institution-user-auth/institution-user-auth.service";
import { UserService } from "../user/user.service";

@Injectable()
export class InstitutionService extends RecordDataModelService<Institution> {
  institutionUserRepo: Repository<InstitutionUser>;
  institutionUserTypeAndRoleRepo: Repository<InstitutionUserTypeAndRole>;
  applicationRepo: Repository<Application>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly bceidService: BCeIDService,
    private readonly institutionUserAuthService: InstitutionUserAuthService,
    private readonly userService: UserService,
  ) {
    super(dataSource.getRepository(Institution));
    this.institutionUserRepo = dataSource.getRepository(InstitutionUser);
    this.institutionUserTypeAndRoleRepo = dataSource.getRepository(
      InstitutionUserTypeAndRole,
    );
    this.applicationRepo = dataSource.getRepository(Application);
  }

  /**
   * Creates all necessary records to have a new user added to the
   * institution, with the right permissions and ready to login.
   * Records will be creates on sims.users, sims.institution_users
   * and sims.institution_user_auth.
   * @param institutionId Institution to add the user.
   * @param bceidUserAccount BCeID account to be used to create the user.
   * @param permissionInfo Permissions information to be added to the user.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns institution user
   */
  async createInstitutionUser(
    institutionId: number,
    bceidUserAccount: AccountDetails,
    permissionInfo: InstitutionUserModel,
    auditUserId: number,
  ): Promise<InstitutionUser> {
    const userName =
      `${bceidUserAccount.user.guid}@${IdentityProviders.BCeIDBoth}`.toLowerCase();
    const validateUniqueSigningAuthority = this.validateUniqueSigningAuthority(
      institutionId,
      permissionInfo.permissions,
    );
    const doesUserExistsCheck = this.userService.doesUserExists(userName);
    const [doesUserExists] = await Promise.all([
      doesUserExistsCheck,
      validateUniqueSigningAuthority,
    ]);
    if (doesUserExists) {
      throw new CustomNamedError(
        "The user already exists.",
        INSTITUTION_USER_ALREADY_EXISTS,
      );
    }

    // Used to create the relationships with institution.
    const institution = { id: institutionId } as Institution;
    // Create the new user to be added to sims.users table.
    // The user should not be present at the table at this moment.
    const userEntity = new User();
    userEntity.email = bceidUserAccount.user.email;
    userEntity.firstName = bceidUserAccount.user.firstname;
    userEntity.lastName = bceidUserAccount.user.surname;
    userEntity.userName = userName;
    // If an audit user was not provided consider the one that will be created as the audit user.
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    // Create new relationship between institution and the new user.
    const newInstitutionUser = new InstitutionUser();
    newInstitutionUser.user = userEntity;
    newInstitutionUser.institution = institution;
    newInstitutionUser.authorizations = [];
    newInstitutionUser.creator = auditUser;
    newInstitutionUser.createdAt = now;
    // Create the permissions for the user under the institution.
    for (const permission of permissionInfo.permissions) {
      const newAuthorization = new InstitutionUserAuth();
      if (permission.locationId) {
        // Add a location specific permission.
        newAuthorization.location = {
          id: permission.locationId,
        } as InstitutionLocation;
      }
      // Find the correct user type and role.
      const authType = await this.institutionUserTypeAndRoleRepo.findOne({
        where: {
          type: permission.userType,
          role: permission.userRole ?? IsNull(),
        },
      });
      if (!authType) {
        throw new Error(
          "The combination of user type and user role is not valid.",
        );
      }
      newAuthorization.authType = authType;
      newAuthorization.creator = auditUser;
      newAuthorization.createdAt = now;
      newInstitutionUser.authorizations.push(newAuthorization);
    }

    return this.institutionUserRepo.save(newInstitutionUser);
  }

  /**
   * Creates the institution record.
   * @param institutionModel complete information to create the profile.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns primary identifier of the created resource.
   */
  async createInstitution(
    institutionModel: InstitutionFormModel,
    auditUserId: number,
  ): Promise<Institution> {
    const auditUser = { id: auditUserId } as User;
    const institution = this.initializeInstitutionFromFormModel(
      institutionModel,
      auditUser,
    );
    return this.repo.save(institution);
  }

  /**
   * Creates an institution during institution setup process when the
   * institution profile and the user are created and associated altogether.
   * This process happens only for business BCeID institutions because they
   * are allowed to create the institutions by themselves. Basic BCeID institutions
   * need the Ministry to create the institutions on their behalf and have the basic
   * BCeID users associated as well.
   * @param institutionModel information from the institution and the user.
   * @param userInfo user to be associated with the institution.
   * @returns primary identifier of the created resource.
   */
  async createInstitutionWithAssociatedUser(
    institutionModel: InstitutionFormModel,
    userInfo: UserInfo,
  ): Promise<Institution> {
    // New user to be associated with the institution. It will also be considered the audit user.
    const user = new User();
    const now = new Date();
    const institution = this.initializeInstitutionFromFormModel(
      institutionModel,
      user,
    );

    // Only BCeID business users are allowed to create the institution profile
    // and have BCeID users directly associated with the institution.
    // Basic BCeID users must have the Ministry creating the institution profile
    // and creating the basic BCeID users on their behalf.
    const account = await this.bceidService.getAccountDetails(
      userInfo.idp_user_name,
      BCeIDAccountTypeCodes.Business,
    );
    if (account == null) {
      // This scenario occurs if basic BCeID users try to push the bceid account into our application.
      throw new Error("Account information could not be retrieved from BCeID.");
    }

    // Username retrieved from the token.
    user.userName = userInfo.userName;
    user.firstName = account.user.firstname;
    user.lastName = account.user.surname;
    user.email = institutionModel.userEmail;

    institution.businessGuid = account.institution.guid;
    institution.legalOperatingName = account.institution.legalName;
    institution.creator = user;
    institution.createdAt = now;
    // Institution user that has the association between the institution
    // record and the user record.
    const institutionUser = new InstitutionUser();
    institutionUser.creator = user;
    institutionUser.createdAt = now;
    institutionUser.user = user;
    institutionUser.institution = institution;
    // Get admin authorization type.
    const authorizationType =
      await this.institutionUserTypeAndRoleRepo.findOneOrFail({
        where: {
          type: InstitutionUserType.admin,
          role: IsNull(),
        },
      });
    // Assign the new user with an admin authorization.
    const userAuthorization = new InstitutionUserAuth();
    userAuthorization.creator = user;
    userAuthorization.createdAt = now;
    userAuthorization.authType = authorizationType;
    userAuthorization.institutionUser = institutionUser;
    // Associates the authorizations.
    institutionUser.authorizations = [userAuthorization];
    // Saves institution, user, and institution user altogether.
    await this.institutionUserRepo.save(institutionUser);

    return institution;
  }

  /**
   * Converts the model received to create an institution to
   * the actual institution entity model to be persisted to the
   * database.
   * @param institutionModel information to be use to create the
   * institution profile.
   * @param auditUser user that should be considered the one that is causing the changes.
   * @returns institution entity model.
   */
  private initializeInstitutionFromFormModel(
    institutionModel: InstitutionFormModel,
    auditUser: User,
  ): Institution {
    const institution = new Institution();
    institution.creator = auditUser;
    institution.legalOperatingName = institutionModel.legalOperatingName;
    institution.operatingName = institutionModel.operatingName;
    institution.primaryPhone = institutionModel.primaryPhone;
    institution.primaryEmail = institutionModel.primaryEmail;
    institution.website = institutionModel.website;
    institution.regulatingBody = institutionModel.regulatingBody;
    institution.otherRegulatingBody = institutionModel.otherRegulatingBody;
    institution.establishedDate = institutionModel.establishedDate;
    institution.institutionType = {
      id: institutionModel.institutionType,
    } as InstitutionType;

    // Institution Primary Contact Information.
    institution.institutionPrimaryContact = {
      firstName: institutionModel.primaryContactFirstName,
      lastName: institutionModel.primaryContactLastName,
      email: institutionModel.primaryContactEmail,
      phone: institutionModel.primaryContactPhone,
    };

    // Institution Address.
    institution.institutionAddress = {
      mailingAddress: transformAddressDetails(institutionModel.mailingAddress),
    };

    return institution;
  }

  async getInstituteByUserName(userName: string): Promise<Institution> {
    return this.repo
      .createQueryBuilder("institution")
      .leftJoin("institution.users", "institutionUsers")
      .leftJoinAndSelect("institution.institutionType", "institutionType")
      .leftJoin("institutionUsers.user", "user")
      .where("user.userName = :userName", { userName })
      .andWhere("user.isActive = :isActive", { isActive: true })
      .getOneOrFail();
  }

  /**
   * service method to get all institution users with the
   * given institutionId.
   * @param institutionId institution id
   * @param paginationOptions
   * @returns All the institution users for the given institution
   * with total count.
   */
  async getInstitutionUsers(
    institutionId: number,
    paginationOptions: PaginationOptions,
  ): Promise<[InstitutionUser[], number]> {
    // Default sort oder for user summary DataTable
    const DEFAULT_SORT_FIELD_FOR_USER_DATA_TABLE = "displayName";

    const institutionUsers = this.institutionUserRepo
      .createQueryBuilder("institutionUser")
      .select([
        "institutionUser.id",
        "user.id",
        "user.email",
        "user.firstName",
        "user.lastName",
        "user.userName",
        "user.isActive",
        "authorizations",
        "authorizations.authType",
        "authorizations.id",
        "authType.role",
        "authType.type",
        "authorizations.location",
        "location.name",
      ])
      .innerJoin("institutionUser.user", "user")
      .innerJoin("institutionUser.institution", "institution")
      .leftJoin("institutionUser.authorizations", "authorizations")
      .leftJoin("authorizations.location", "location")
      .leftJoin("authorizations.authType", "authType")
      .where("institution.id = :institutionId", { institutionId });

    // search by user's name
    if (paginationOptions.searchCriteria) {
      institutionUsers.andWhere(
        getUserFullNameLikeSearch("user", "searchUser"),
        {
          searchUser: `%${paginationOptions.searchCriteria.trim()}%`,
        },
      );
    }
    // sorting
    sortUsersColumnMap(
      paginationOptions.sortField ?? DEFAULT_SORT_FIELD_FOR_USER_DATA_TABLE,
    ).forEach((sortElement, index) => {
      if (index === 0) {
        institutionUsers.orderBy(sortElement, paginationOptions.sortOrder);
      } else {
        institutionUsers.addOrderBy(sortElement, paginationOptions.sortOrder);
      }
    });

    // pagination
    institutionUsers
      .take(paginationOptions.pageLimit)
      .skip(paginationOptions.page * paginationOptions.pageLimit);
    // result
    return institutionUsers.getManyAndCount();
  }

  async getUserTypesAndRoles(): Promise<InstitutionUserTypeAndRoleModel> {
    const types: {
      type: string;
    }[] = await this.institutionUserTypeAndRoleRepo.query(
      "SELECT DISTINCT user_type as type FROM sims.institution_user_type_roles;",
    );
    const roles: {
      role: string;
    }[] = await this.institutionUserTypeAndRoleRepo.query(
      "SELECT DISTINCT user_role as role FROM sims.institution_user_type_roles;",
    );
    return {
      userTypes: types.map((typeObject) => typeObject.type),
      userRoles: roles
        .filter((roleObject) => roleObject.role !== null)
        .map((roleObject) => roleObject.role),
    };
  }

  async getUser(id: number): Promise<InstitutionUser> {
    return this.institutionUserRepo
      .createQueryBuilder("institutionUser")
      .leftJoinAndSelect("institutionUser.user", "user")
      .leftJoinAndSelect("institutionUser.institution", "institution")
      .leftJoinAndSelect("institutionUser.authorizations", "authorizations")
      .leftJoinAndSelect("authorizations.location", "location")
      .leftJoinAndSelect("authorizations.authType", "authType")
      .where("institutionUser.id = :id", { id })
      .getOne();
  }

  /**
   * Get the user and institution details, including locations,
   * by the institution user id or user id only.
   * @param institutionUserId options to search the institution user.
   * @returns institution, locations, and user details.
   */
  async getInstitutionUserById(
    institutionUserId?: number,
  ): Promise<InstitutionUser> {
    return this.institutionUserRepo
      .createQueryBuilder("institutionUser")
      .select([
        "institutionUser.id",
        "user.id",
        "user.firstName",
        "user.lastName",
        "user.userName",
        "user.isActive",
        "user.email",
        "location.id",
        "location.name",
        "location.data",
        "authType.id",
        "authType.type",
        "authType.role",
        "institution.id",
        "institution.businessGuid",
      ])
      .innerJoinAndSelect("institutionUser.user", "user")
      .innerJoinAndSelect("institutionUser.institution", "institution")
      .innerJoinAndSelect("institutionUser.authorizations", "authorizations")
      .innerJoinAndSelect("authorizations.authType", "authType")
      .leftJoinAndSelect("authorizations.location", "location")
      .where("institutionUser.id = :institutionUserId", { institutionUserId })
      .getOne();
  }

  /**
   * Get the institution user and institution details by the user id.
   * @param userId user id.
   * @returns institution and user details.
   */
  async getInstitutionUserByUserId(userId: number): Promise<InstitutionUser> {
    return this.institutionUserRepo
      .createQueryBuilder("institutionUser")
      .select([
        "institutionUser.id",
        "user.id",
        "user.firstName",
        "user.lastName",
        "institution.id",
        "institution.businessGuid",
        "institution.legalOperatingName",
      ])
      .innerJoinAndSelect("institutionUser.user", "user")
      .innerJoinAndSelect("institutionUser.institution", "institution")
      .where("user.id = :userId", { userId })
      .getOne();
  }

  /**
   * Check if the business guid is already present on DB.
   * @param businessGuid BCeID business guid.
   * @returns true if an institution with the business guid is
   * already present on DB, otherwise false.
   */
  async doesExist(businessGuid: string): Promise<boolean> {
    const institution = await this.repo
      .createQueryBuilder("institution")
      .select("1")
      .where("institution.businessGuid = :businessGuid", { businessGuid })
      .limit(1)
      .getRawOne();
    return !!institution;
  }

  /**
   * Remove all existing permissions from the user and insert the provided ones.
   * @param institutionId institution to have the user updated.
   * @param institutionUserId institution user to be updated.
   * @param permissions complete list of the user permissions that will entirely
   * replace the existing ones.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param ensureHasAdmin if true, will ensure that at least one admin is present, otherwise
   * will allow that all institution admins are removed or disabled.
   */
  async updateInstitutionUser(
    institutionId: number,
    institutionUserId: number,
    permissions: UserPermissionModel[],
    auditUserId: number,
    ensureHasAdmin = true,
  ): Promise<void> {
    const validations: Promise<void>[] = [];
    if (ensureHasAdmin) {
      validations.push(
        this.validateAtLeastOneAdmin(
          institutionId,
          institutionUserId,
          permissions,
        ),
      );
    }
    validations.push(
      this.validateUniqueSigningAuthority(
        institutionId,
        permissions,
        institutionUserId,
      ),
    );
    await Promise.all(validations);

    const auditUser = { id: auditUserId } as User;
    const newAuthorizationEntries = [] as InstitutionUserAuth[];
    // Create the permissions for the user under the institution.
    for (const permission of permissions) {
      const newAuthorization = new InstitutionUserAuth();
      newAuthorization.institutionUser = {
        id: institutionUserId,
      } as InstitutionUser;
      if (permission.locationId) {
        // Add a location specific permission.
        newAuthorization.location = {
          id: permission.locationId,
        } as InstitutionLocation;
      }
      // Find the correct user type and role.
      const authType = await this.institutionUserTypeAndRoleRepo.findOne({
        where: {
          type: permission.userType,
          role: permission.userRole ?? IsNull(),
        },
      });
      if (!authType) {
        throw new Error(
          "The combination of user type and user role is not valid.",
        );
      }
      newAuthorization.authType = authType;
      newAuthorization.creator = auditUser;
      newAuthorizationEntries.push(newAuthorization);
    }

    // Establish database connection.
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      // Open new transaction.
      await queryRunner.startTransaction();
      // Soft-delete existing associations.
      const transactionRepo =
        queryRunner.manager.getRepository(InstitutionUserAuth);
      await transactionRepo.update(
        { institutionUser: { id: institutionUserId } },
        {
          deletedAt: new Date(),
          modifier: { id: auditUserId },
        },
      );
      // Add new associations.
      await queryRunner.manager.save(newAuthorizationEntries);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Validation to ensure that an institution will always have at least one admin user.
   * Upon creation an admin user must be added to the institution as part of its creation process.
   * Once created, any update to the user permissions must ensure that at least one administrator
   * will always be present for the institution.
   * @param institutionId institution to be verified.
   * @param institutionUserId institution user being updated.
   * @param permissions complete list of permissions to be associated with the user.
   * as an user being updated, otherwise it is considered as a new user being added.
   */
  private async validateAtLeastOneAdmin(
    institutionId: number,
    institutionUserId: number,
    permissions: UserPermissionModel[],
  ): Promise<void> {
    const currentAdminUsers =
      await this.institutionUserAuthService.getUsersByUserType(
        institutionId,
        InstitutionUserTypes.admin,
      );
    // If more than one administrator exists, no further verifications are needed.
    if (currentAdminUsers?.length === 1) {
      // If only one is present we need to check if this admin is the one being updated.
      const [currentAdmin] = currentAdminUsers;
      if (currentAdmin.institutionUser.id === institutionUserId) {
        // Case the only admin present in the institution is the one being edited, check
        // if it is not losing his admin permission.
        const isAdmin = permissions.some(
          (permission) => permission.userType === InstitutionUserTypes.admin,
        );
        if (!isAdmin) {
          // If the only admin present in the institution is losing the admin authorization
          // throw the exception to avoid that the only admin become a regular user.
          throw new CustomNamedError(
            "An institution must have at least one user defined as an admin.",
            INSTITUTION_MUST_HAVE_AN_ADMIN,
          );
        }
      }
    }
  }

  /**
   * A legal signing authority role can be added to only one user per institution.
   * Validate and ensure that the institution has only one user assigned with legal signing authority role.
   * Throws an exception in case another user is already defined with the role.
   * @param institutionId institution to be verified.
   * @param permissions complete list of permissions to be associated with the user.
   * @param institutionUserId optional institution user being updated, when provided it is considered
   * as an user being updated, otherwise it is considered as a new user being added.
   */
  private async validateUniqueSigningAuthority(
    institutionId: number,
    permissions: UserPermissionModel[],
    institutionUserId?: number,
  ): Promise<void> {
    // Check if the permissions contains legal signing authority role.
    const hasLegalSigningAuthorityRole = permissions.some(
      (role) => role.userRole === InstitutionUserRoles.legalSigningAuthority,
    );
    if (!hasLegalSigningAuthorityRole) {
      // If there is no legal signing authority role, no further verifications are needed.
      return;
    }
    // Check if there is a current legal signing authority associated with the institution.
    const legalSigningAuthority =
      await this.institutionUserAuthService.getLegalSigningAuthority(
        institutionId,
      );
    if (
      !legalSigningAuthority ||
      (institutionUserId &&
        legalSigningAuthority.institutionUser.id === institutionUserId)
    ) {
      // If there is no legal signing authority or the user being updated it is the
      // current legal signing authority, no further verifications are needed.
      return;
    }
    // A second legal signing authority role cannot be added, throw an exception.
    throw new CustomNamedError(
      "An institution cannot have more then one user defined as legal signing authority.",
      LEGAL_SIGNING_AUTHORITY_EXIST,
    );
  }

  /**
   * Search the institution based on the search criteria.
   * @param legalName legalName of the institution.
   * @param operatingName operatingName of the institution.
   * @returns Searched institution details.
   */
  async searchInstitution(
    legalName: string,
    operatingName: string,
  ): Promise<Institution[]> {
    const searchQuery = this.repo
      .createQueryBuilder("institution")
      .select([
        "institution.legalOperatingName",
        "institution.operatingName",
        "institution.institutionAddress",
        "institution.id",
      ])
      .where("1 = 1");
    if (legalName) {
      searchQuery.andWhere("institution.legalOperatingName Ilike :legalName", {
        legalName: `%${legalName}%`,
      });
    }
    if (operatingName) {
      searchQuery.andWhere("institution.operatingName Ilike :operatingName", {
        operatingName: `%${operatingName}%`,
      });
    }
    return searchQuery.getMany();
  }

  /**
   * Get the institution by ID.
   * @param institutionId Institution id.
   * @returns Location retrieved, if found, otherwise returns null.
   */
  async getInstitutionDetailById(institutionId: number): Promise<Institution> {
    return this.repo
      .createQueryBuilder("institution")
      .select([
        "institution",
        "institution.businessGuid",
        "institution.operatingName",
        "institution.legalOperatingName",
        "institution.primaryEmail",
        "institutionType.id",
        "institutionType.name",
      ])
      .innerJoin("institution.institutionType", "institutionType")
      .where("institution.id = :institutionId", { institutionId })
      .getOne();
  }

  /**
   * Get the institutionType by institution id.
   * @param institutionId Institution id.
   * @returns Institution retrieved, if found, otherwise returns null.
   */
  async getInstitutionTypeById(institutionId: number): Promise<Institution> {
    return this.repo.findOne({
      select: {
        institutionType: {
          id: true,
        },
      },
      relations: {
        institutionType: true,
      },
      where: {
        id: institutionId,
      },
      // TODO:Implement the cache again after updating cache eviction strategy.
    });
  }

  /**
   * Get the basic info of the institution by ID.
   * @param institutionId Institution id.
   * @returns Institution retrieved, if found, otherwise returns null.
   */
  async getBasicInstitutionDetailById(
    institutionId: number,
  ): Promise<Institution> {
    return this.repo
      .createQueryBuilder("institution")
      .select([
        "institution.id",
        "institution.operatingName",
        "institution.businessGuid",
      ])
      .where("institution.id = :institutionId", { institutionId })
      .getOne();
  }

  /**
   * Service to get notes for a student.
   * @param institutionId
   * @param noteType
   * @returns Notes.
   */
  async getInstitutionNotes(
    institutionId: number,
    noteType?: NoteType,
  ): Promise<Note[]> {
    const institutionNoteQuery = this.repo
      .createQueryBuilder("institution")
      .select([
        "institution.id",
        "note.noteType",
        "note.description",
        "note.createdAt",
        "user.firstName",
        "user.lastName",
      ])
      .innerJoin("institution.notes", "note")
      .innerJoin("note.creator", "user")
      .where("institution.id = :institutionId", { institutionId });
    if (noteType) {
      institutionNoteQuery.andWhere("note.noteType = :noteType", { noteType });
    }

    const institution = await institutionNoteQuery
      .orderBy("note.id", "DESC")
      .getOne();
    return institution?.notes;
  }

  /**
   * Service to add note for an Institution.
   * @param institutionId
   * @param note
   * @returns saved Note.
   * @deprecated use {@link createInstitutionNote} instead.
   */
  async saveInstitutionNote(institutionId: number, note: Note): Promise<Note> {
    await this.repo
      .createQueryBuilder()
      .relation(Institution, "notes")
      .of({ id: institutionId } as Institution)
      .add(note);
    return note;
  }

  /**
   * Service to add note for an Institution.
   * @param institutionId institution to have the note added.
   * @param noteType note type.
   * @param noteDescription note description.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns saved Note.
   * @deprecated use {@link createInstitutionNote} instead.
   */
  async addInstitutionNote(
    institutionId: number,
    noteType: NoteType,
    noteDescription: string,
    auditUserId: number,
  ): Promise<Note> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      return this.createInstitutionNote(
        institutionId,
        noteType,
        noteDescription,
        auditUserId,
        transactionalEntityManager,
      );
    });
  }

  /**
   * Creates a new note and associate it with the institution.
   * This method is most likely to be used alongside with some other
   * DB data changes and must be executed in a DB transaction.
   * @param institutionId institution to have the note associated.
   * @param noteType note type.
   * @param noteDescription note description.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager transactional entity manager.
   * @return saved Note.
   */
  async createInstitutionNote(
    institutionId: number,
    noteType: NoteType,
    noteDescription: string,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<Note> {
    const auditUser = { id: auditUserId } as User;
    // Create the note to be associated with the institution.
    const newNote = new Note();
    newNote.description = noteDescription;
    newNote.noteType = noteType;
    newNote.creator = auditUser;
    const savedNote = await entityManager.getRepository(Note).save(newNote);
    // Associate the created note with the institution.
    await entityManager
      .getRepository(Institution)
      .createQueryBuilder()
      .relation(Institution, "notes")
      .of({ id: institutionId } as Institution)
      .add(savedNote);
    return newNote;
  }

  /**
   * Service to get the admin roles .
   * @returns Admin roles.
   */
  async getAdminRoles(): Promise<InstitutionUserTypeAndRole[]> {
    return this.institutionUserTypeAndRoleRepo
      .createQueryBuilder("userRole")
      .select(["userRole.type", "userRole.role"])
      .where("userRole.type = 'admin'")
      .getMany();
  }

  /**
   * Update institution.
   * @param institutionId Institution to be updated.
   * @param auditUserId user who is making the changes.
   * @param updateInstitution payload to update institution.
   * @returns updated Institution
   */
  async updateInstitution(
    institutionId: number,
    auditUserId: number,
    updateInstitution: UpdateInstitution,
    options?: { allowFullUpdate: boolean },
  ): Promise<Institution> {
    const institution = new Institution();
    institution.id = institutionId;
    if (options?.allowFullUpdate) {
      institution.operatingName = updateInstitution.operatingName;
      institution.primaryPhone = updateInstitution.primaryPhone;
      institution.primaryEmail = updateInstitution.primaryEmail;
      institution.website = updateInstitution.website;
      institution.regulatingBody = updateInstitution.regulatingBody;
      institution.otherRegulatingBody = updateInstitution.otherRegulatingBody;
      institution.establishedDate = updateInstitution.establishedDate;
      institution.institutionType = {
        id: updateInstitution.institutionType,
      } as InstitutionType;
    }
    institution.institutionPrimaryContact = {
      firstName: updateInstitution.primaryContactFirstName,
      lastName: updateInstitution.primaryContactLastName,
      email: updateInstitution.primaryContactEmail,
      phone: updateInstitution.primaryContactPhone,
    };

    institution.institutionAddress = {
      mailingAddress: transformAddressDetails(updateInstitution.mailingAddress),
    };
    institution.modifier = { id: auditUserId } as User;
    return this.repo.save(institution);
  }

  /**
   * Synchronize the user/institution information from BCeID.
   * Every time that a user login to the system check is some of the readonly
   * information (that must be changed on BCeID) changed.
   * @param userId user id.
   * @param bceidUserName user name on BCeID.
   */
  async syncBCeIDInformation(userId: number, bceidUserName: string) {
    const institutionUser = await this.getInstitutionUserByUserId(userId);

    const accountType = institutionUser.institution.businessGuid
      ? BCeIDAccountTypeCodes.Business
      : BCeIDAccountTypeCodes.Individual;

    // Find user on BCeID Web Service
    const bceidUserAccount = await this.bceidService.getAccountDetails(
      bceidUserName,
      accountType,
    );
    if (!bceidUserAccount) {
      throw new CustomNamedError(
        "User not found on BCeID.",
        BCEID_ACCOUNT_NOT_FOUND,
      );
    }

    let mustUpdate = false;
    if (
      // Used single equal comparison(!=) to ensure that null and undefined results in
      // the same evaluation due to the possibility of the mononymous names.
      institutionUser.user.firstName != bceidUserAccount.user.firstname ||
      institutionUser.user.lastName !== bceidUserAccount.user.surname
    ) {
      institutionUser.user.firstName = bceidUserAccount.user.firstname;
      institutionUser.user.lastName = bceidUserAccount.user.surname;
      mustUpdate = true;
    }

    if (
      accountType === BCeIDAccountTypeCodes.Business &&
      institutionUser.institution.legalOperatingName !==
        bceidUserAccount.institution.legalName
    ) {
      institutionUser.institution.legalOperatingName =
        bceidUserAccount.institution.legalName;
      mustUpdate = true;
    }

    if (mustUpdate) {
      institutionUser.modifier = { id: userId } as User;
      await this.institutionUserRepo.save(institutionUser);
    }
  }

  /**
   * Find if the institution
   * has access to student data of given student.
   * @param institutionId institution.
   * @param studentId student.
   * @param options options for the query:
   * - `applicationId` application id.
   * @returns value which specifies if the institution
   * has access to student data of given student.
   */
  async hasStudentDataAccess(
    institutionId: number,
    studentId: number,
    options?: {
      applicationId?: number;
    },
  ): Promise<boolean> {
    const institutionStudentDataAccess = await this.applicationRepo.findOne({
      select: { id: true },
      where: {
        student: { id: studentId },
        location: { institution: { id: institutionId } },
        applicationStatus: Not(ApplicationStatus.Overwritten),
        id: options?.applicationId,
      },
      cache: true,
    });
    return !!institutionStudentDataAccess;
  }
}
