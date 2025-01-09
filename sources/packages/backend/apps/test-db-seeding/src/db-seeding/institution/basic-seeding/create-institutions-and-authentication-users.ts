import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Institution,
  InstitutionLocation,
  InstitutionType,
  InstitutionUser,
  InstitutionUserAuth,
  InstitutionUserTypes,
  User,
} from "@sims/sims-db";
import {
  createFakeInstitution,
  createFakeInstitutionLocation,
  createFakeInstitutionUser,
  createFakeInstitutionUserAuth,
  createFakeUser,
} from "@sims/test-utils";
import {
  DataSeed,
  DataSeedMethod,
  SeedPriorityOrder,
} from "../../../seed-executors";
import { Repository } from "typeorm";
import { UserTypeRoleHelperService } from "../../../services";
import {
  InstitutionBaseData,
  INSTITUTIONS_INITIAL_DATA,
} from "./create-institutions-and-authentication-users.model";

@Injectable()
@DataSeed({ order: SeedPriorityOrder.Priority1 })
export class CreateInstitutionsAndAuthenticationUsers {
  constructor(
    @InjectRepository(InstitutionUser)
    private readonly institutionUserRepo: Repository<InstitutionUser>,
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
    @InjectRepository(InstitutionLocation)
    private readonly institutionLocationRepo: Repository<InstitutionLocation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(InstitutionUserAuth)
    private readonly institutionUserAuthRepo: Repository<InstitutionUserAuth>,
    private readonly userTypeRoleHelperService: UserTypeRoleHelperService,
  ) {}

  /**
   * Create institutions with associated users ready to be authenticated.
   */
  @DataSeedMethod()
  async createInstitutions(): Promise<void> {
    const institutionsCreationPromises = INSTITUTIONS_INITIAL_DATA.map(
      (institutionData) => this.createInstitution(institutionData),
    );
    await Promise.all(institutionsCreationPromises);
  }

  /**
   * Create an institution and associated users.
   * For non-admin users, a default location will be also created.
   * @param institutionsData basic data to create an institution and its users.
   */
  private async createInstitution(
    institutionsData: InstitutionBaseData,
  ): Promise<void> {
    // Create fake institution.
    const fakeInstitution = createFakeInstitution();
    fakeInstitution.legalOperatingName = institutionsData.legalOperatingName;
    fakeInstitution.operatingName = institutionsData.operatingName;
    fakeInstitution.businessGuid = institutionsData.businessGuid;
    fakeInstitution.institutionType = {
      id: institutionsData.institutionTypeId,
    } as InstitutionType;
    const savedInstitution = await this.institutionRepo.save(fakeInstitution);
    // Create the users associated with the institution.
    for (const user of institutionsData.users) {
      // Create fake user.
      const fakeUser = createFakeUser(user.userName);
      fakeUser.firstName = user.firstName;
      fakeUser.lastName = user.lastName;
      // Save user to DB.
      const savedUser = await this.userRepo.save(fakeUser);
      // Create institution user.
      const fakeInstitutionUser = createFakeInstitutionUser(
        savedUser,
        savedInstitution,
      );
      // Associate the new users with the institution.
      const savedInstitutionUser = await this.institutionUserRepo.save(
        fakeInstitutionUser,
      );
      // Get the user role to be associated.
      const userTypeRole =
        await this.userTypeRoleHelperService.getInstitutionUserTypeAndRole(
          user.userType,
          user.userRole,
        );
      // Check if a default location need to be created.
      // Only read-only and regular users must be associated with a location.
      let location: InstitutionLocation;
      if (user.userType !== InstitutionUserTypes.admin) {
        // Crate a default location.
        // Create a default location to have it associated with the regular user.
        const fakeInstitutionDefaultLocation = createFakeInstitutionLocation({
          institution: savedInstitution,
        });
        fakeInstitutionDefaultLocation.name = "Default Location";
        location = await this.institutionLocationRepo.save(
          fakeInstitutionDefaultLocation,
        );
      }
      // Create the institution user auth.
      const fakeInstitutionUserAuth = createFakeInstitutionUserAuth(
        savedInstitutionUser,
        userTypeRole,
        location,
      );
      // Save the new user access.
      await this.institutionUserAuthRepo.save(fakeInstitutionUserAuth);
    }
  }
}
