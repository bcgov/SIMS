import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DesignationAgreement,
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

@DataSeed("provider", SeedPriorityOrder.Three)
@Injectable()
export class DesignationAgreementPendingService {
  constructor(
    @InjectRepository(DesignationAgreement)
    private designationAgreementRepo: Repository<DesignationAgreement>,
    @InjectRepository(Institution)
    private institutionRepo: Repository<Institution>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(InstitutionLocation)
    private institutionLocationRepo: Repository<InstitutionLocation>,
  ) {
    console.log("constructorr --->>>");
  }

  @DataSeedMethod("method", SeedPriorityOrder.One)
  async createApprovalDesignationAgreement(): Promise<void> {
    // Create fake institution.
    const fakeInstitution = createFakeInstitution();
    // console.log(fakeInstitution, "+++fakeInstitution");
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
    );
    // console.log(fakeDesignationAgreement);
    this.designationAgreementRepo.save(fakeDesignationAgreement);
    console.info("completed !!");
  }

  @DataSeedMethod("method")
  async createApprovalDesignationAgreement1111(): Promise<void> {
    // Create fake institution.
    const fakeInstitution = createFakeInstitution();
    // console.log(fakeInstitution, "+++fakeInstitution");
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
    );
    // console.log(fakeDesignationAgreement);
    this.designationAgreementRepo.save(fakeDesignationAgreement);
    console.info("completed !!");
  }
}
