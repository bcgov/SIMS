import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DesignationAgreement, InstitutionLocation } from "@sims/sims-db";
import {
  createFakeDesignationAgreement,
  createMultipleFakeInstitutionLocations,
} from "@sims/test-utils";
import { Repository } from "typeorm";
import {
  DataSeed,
  DataSeedMethod,
  SeedPriorityOrder,
} from "../../seed-executors";
import { InstitutionHelperService } from "../../test-seed-helper-services";
import { institutionUserName01 } from "../constants";

@Injectable()
@DataSeed("provider", SeedPriorityOrder.LastBatch)
export class DesignationAgreementService {
  constructor(
    @InjectRepository(DesignationAgreement)
    private designationAgreementRepo: Repository<DesignationAgreement>,
    @InjectRepository(InstitutionLocation)
    private institutionLocationRepo: Repository<InstitutionLocation>,
    private institutionHelperService: InstitutionHelperService,
  ) {}

  /**
   * Method to seed fake pending designation agreement.
   */
  @DataSeedMethod("method")
  async createPendingDesignationAgreement(): Promise<void> {
    const InstitutionAdminUser = institutionUserName01;
    // Get fake institution.
    const fakeInstitution =
      await this.institutionHelperService.getInstitutionByUserName(
        InstitutionAdminUser,
      );
    const [fakeInstitutionUser] = fakeInstitution.users;

    // Create fake institution locations.
    const fakeInstitutionLocations = createMultipleFakeInstitutionLocations(
      fakeInstitution,
      2,
    );
    const createdFakInstitutionLocations =
      await this.institutionLocationRepo.save(fakeInstitutionLocations);

    // Create fake designation agreement.
    const fakeDesignationAgreement = createFakeDesignationAgreement(
      fakeInstitution,
      fakeInstitutionUser.user,
      createdFakInstitutionLocations,
    );
    await this.designationAgreementRepo.save(fakeDesignationAgreement);
  }
}
