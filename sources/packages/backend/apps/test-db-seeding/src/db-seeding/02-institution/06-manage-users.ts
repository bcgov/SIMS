import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Institution,
  InstitutionUser,
  InstitutionUserAuth,
  User,
} from "@sims/sims-db";
import {
  InstitutionUserRoles,
  InstitutionUserTypes,
} from "@sims/sims-db/entities/user-types.enum";
import {
  createFakeInstitution,
  createFakeInstitutionUser,
  createFakeInstitutionUserAuth,
  createFakeUser,
} from "@sims/test-utils";
import { Repository } from "typeorm";
import { UserTypeRoleHelperService } from "../../test-helper-services";
import {
  DataSeed,
  DataSeedMethod,
  SeedPriorityOrder,
} from "../../test-organizer/data-seed.decorator";
import { institutionEmail01, institutionEmail02 } from "../constants";

@Injectable()
@DataSeed("provider", SeedPriorityOrder.FirstBatch)
export class InstitutionUserService {
  constructor(
    @InjectRepository(InstitutionUser)
    private institutionUserRepo: Repository<InstitutionUser>,
    @InjectRepository(Institution)
    private institutionRepo: Repository<Institution>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(InstitutionUserAuth)
    private institutionUserAuthRepo: Repository<InstitutionUserAuth>,
    private userTypeRoleHelperService: UserTypeRoleHelperService,
  ) {}

  /**
   * Method to seed fake institution legal signing user.
   */
  @DataSeedMethod("method")
  async createInstitutionLegalSigningAuthUser(): Promise<void> {
    // Create fake user.
    const institutionUserName = institutionEmail01;
    const fakeUser = createFakeUser(institutionUserName);
    const createdFakeUser = await this.userRepo.save(fakeUser);

    // Create fake institution.
    const fakeInstitution = createFakeInstitution();
    const createdFakeInstitution = await this.institutionRepo.save(
      fakeInstitution,
    );

    // Create institution user.
    const fakeInstitutionUser = createFakeInstitutionUser(
      createdFakeUser,
      createdFakeInstitution,
    );
    const createdFakeInstitutionUser = await this.institutionUserRepo.save(
      fakeInstitutionUser,
    );
    // Get 'legal-signing-authority'  user type role.
    const userTypeRole =
      await this.userTypeRoleHelperService.getInstitutionUserTypeAndRole(
        InstitutionUserTypes.admin,
        InstitutionUserRoles.legalSigningAuthority,
      );

    // Create institution user auth.
    const fakeInstitutionUserAuth = createFakeInstitutionUserAuth(
      createdFakeInstitutionUser,
      userTypeRole,
    );

    this.institutionUserAuthRepo.save(fakeInstitutionUserAuth);
  }

  /**
   * Method to seed fake institution admin.
   */
  @DataSeedMethod("method")
  async createInstitutionAdmin(): Promise<void> {
    // Create fake user.
    const institutionUserName = institutionEmail02;
    const fakeUser = createFakeUser(institutionUserName);
    const createdFakeUser = await this.userRepo.save(fakeUser);

    // Create fake institution.
    const fakeInstitution = createFakeInstitution();
    const createdFakeInstitution = await this.institutionRepo.save(
      fakeInstitution,
    );

    // Create institution user.
    const fakeInstitutionUser = createFakeInstitutionUser(
      createdFakeUser,
      createdFakeInstitution,
    );
    const createdFakeInstitutionUser = await this.institutionUserRepo.save(
      fakeInstitutionUser,
    );
    // Get 'admin'  user type role.
    const userTypeRole =
      await this.userTypeRoleHelperService.getInstitutionUserTypeAndRole(
        InstitutionUserTypes.admin,
        null,
      );

    // Create institution user auth.
    const fakeInstitutionUserAuth = createFakeInstitutionUserAuth(
      createdFakeInstitutionUser,
      userTypeRole,
    );

    await this.institutionUserAuthRepo.save(fakeInstitutionUserAuth);
  }
}
