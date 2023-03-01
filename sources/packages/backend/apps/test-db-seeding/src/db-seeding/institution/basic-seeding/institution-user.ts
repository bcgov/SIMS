import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Institution,
  InstitutionUser,
  InstitutionUserAuth,
  InstitutionUserRoles,
  InstitutionUserTypes,
  User,
} from "@sims/sims-db";
import {
  createFakeInstitution,
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
  SIMS_COLL_F_LEGAL_SIGNING_USER,
  SIMS_COLL_C_ADMIN,
} from "../../constants";

@Injectable()
@DataSeed({ order: SeedPriorityOrder.Priority1 })
export class InstitutionUserService {
  constructor(
    @InjectRepository(InstitutionUser)
    private readonly institutionUserRepo: Repository<InstitutionUser>,
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(InstitutionUserAuth)
    private readonly institutionUserAuthRepo: Repository<InstitutionUserAuth>,
    private readonly userTypeRoleHelperService: UserTypeRoleHelperService,
  ) {}

  /**
   * Seed fake institution legal signing user.
   */
  @DataSeedMethod()
  async createInstitutionLegalSigningAuthUser(): Promise<void> {
    // Create fake user.
    const fakeUser = createFakeUser(SIMS_COLL_F_LEGAL_SIGNING_USER);
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
    // Get 'legal-signing-authority' user type role.
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
  @DataSeedMethod()
  async createInstitutionAdmin(): Promise<void> {
    // Create fake user.
    const fakeUser = createFakeUser(SIMS_COLL_C_ADMIN);
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
