import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DesignationAgreement, InstitutionLocation } from "@sims/sims-db";
import {
  createFakeDesignationAgreement,
  createMultipleFakeInstitutionLocations,
} from "@sims/test-utils";
import { Repository } from "typeorm";
import { DataSeed, DataSeedMethod } from "../../seed-executors";
import { InstitutionHelperService } from "../../services";
import { SIMS_COLL_F_LEGAL_SIGNING_USER } from "../constants";

@Injectable()
@DataSeed()
export class DesignationAgreementService {
  constructor(
    @InjectRepository(DesignationAgreement)
    private readonly designationAgreementRepo: Repository<DesignationAgreement>,
    @InjectRepository(InstitutionLocation)
    private readonly institutionLocationRepo: Repository<InstitutionLocation>,
    private readonly institutionHelperService: InstitutionHelperService,
  ) {}

  /**
   * Method to seed fake pending designation agreement.
   */
  @DataSeedMethod()
  async createPendingDesignationAgreement(): Promise<void> {
    // Get fake institution.
    const fakeInstitution =
      await this.institutionHelperService.getInstitutionByUserName(
        SIMS_COLL_F_LEGAL_SIGNING_USER,
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
