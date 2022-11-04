import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DesignationAgreement,
  DesignationAgreementStatus,
  Institution,
  InstitutionLocation,
  User,
} from "@sims/sims-db";
import {
  createFakeDesignationAgreement,
  createFakeInstitution,
  createFakeUser,
  createMultipleFakeInstitutionLocations,
} from "@sims/test-utils";
import { Repository } from "typeorm";
import {
  DataSeed,
  DataSeedMethod,
  SeedPriorityOrder,
} from "../test-organizer/data-seed.decorator";
// notes
// // todo: 1. check with team, in actual scenario only one pending designation are allowed - during seeding do we need to consider that
// // todo: 2. if db doesn't exits its is not creating a new DB
// // todo: make all function even helpers async, if required

@Injectable()
@DataSeed("provider", SeedPriorityOrder.SecondBach)
export class DesignationAgreementApprovalService {
  constructor(
    @InjectRepository(DesignationAgreement)
    private designationAgreementRepo: Repository<DesignationAgreement>,
    @InjectRepository(Institution)
    private institutionRepo: Repository<Institution>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(InstitutionLocation)
    private institutionLocationRepo: Repository<InstitutionLocation>,
  ) {}

  /**
   * Method to seed fake approved designation agreement.
   */
  @DataSeedMethod("method", SeedPriorityOrder.SecondBach)
  async createApprovalDesignationAgreement(): Promise<void> {
    // Create fake institution.
    const fakeInstitution = createFakeInstitution();
    const createdFakeInstitution = await this.institutionRepo.save(
      fakeInstitution,
    );

    // Create fake user.
    const fakeUser = createFakeUser();
    const createdFakeUser = await this.userRepo.save(fakeUser);

    // Create fake institution locations.
    const fakeInstitutionLocations = createMultipleFakeInstitutionLocations(
      fakeInstitution,
      2,
    );
    const createdFakInstitutionLocations =
      await this.institutionLocationRepo.save(fakeInstitutionLocations);

    // Create fake designation agreement.
    const fakeDesignationAgreement = createFakeDesignationAgreement(
      createdFakeInstitution,
      createdFakeUser,
      createdFakInstitutionLocations,
      DesignationAgreementStatus.Approved,
    );
    this.designationAgreementRepo.save(fakeDesignationAgreement);
    console.info("completed !!");
  }
}
