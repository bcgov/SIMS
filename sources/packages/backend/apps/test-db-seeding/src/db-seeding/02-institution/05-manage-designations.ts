import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DesignationAgreement,
  DesignationAgreementStatus,
  InstitutionLocation,
} from "@sims/sims-db";
import {
  createFakeDesignationAgreement,
  createMultipleFakeInstitutionLocations,
} from "@sims/test-utils";
import { Repository } from "typeorm";
import { InstitutionHelperService } from "../../test-helper-services";
import {
  DataSeed,
  DataSeedMethod,
  SeedPriorityOrder,
} from "../../test-organizer/data-seed.decorator";
import { institutionEmail01, institutionEmail02 } from "../constants";

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
   * Method to seed fake approved designation agreement.
   */
  @DataSeedMethod("method")
  async createApprovalDesignationAgreement(): Promise<void> {
    const InstitutionLegalSigningUser = institutionEmail01;

    // Get fake institution.
    const fakeInstitution =
      await this.institutionHelperService.getInstitutionByUserName(
        InstitutionLegalSigningUser,
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
      DesignationAgreementStatus.Approved,
    );
    await this.designationAgreementRepo.save(fakeDesignationAgreement);
  }

  /**
   * Method to seed fake pending designation agreement.
   */
  @DataSeedMethod("method")
  async createPendingDesignationAgreement(): Promise<void> {
    const InstitutionAdminUser = institutionEmail02;
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
