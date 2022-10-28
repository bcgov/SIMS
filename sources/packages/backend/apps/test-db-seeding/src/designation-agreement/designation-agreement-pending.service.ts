import { Injectable } from "@nestjs/common";
import {
  DesignationAgreement,
  Institution,
  InstitutionLocation,
  RecordDataModelService,
  User,
} from "@sims/sims-db";
import {
  createFakeDesignationAgreement,
  createFakeInstitution,
  createFakeUser,
  multipleFakeInstitutionLocations,
} from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";

// todo: 1. check with team, in actual scenario only one pending designation are allowed - during seeding do we need to consider that
// todo: 2. if db doesn't exits its is not creating a new DB
// todo: make all function even helpers async, if required
@Injectable()
export class DesignationAgreementPendingService extends RecordDataModelService<DesignationAgreement> {
  private readonly institutionRepo: Repository<Institution>;
  private readonly userRepo: Repository<User>;
  private readonly institutionLocationRepo: Repository<InstitutionLocation>;

  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(DesignationAgreement));
    this.institutionRepo = dataSource.getRepository(Institution);
    this.userRepo = dataSource.getRepository(User);
    this.institutionLocationRepo =
      dataSource.getRepository(InstitutionLocation);
  }
  async createPendingDesignationAgreement(): Promise<void> {
    const fakeInstitution = createFakeInstitution();
    const createdFakeInstitution = await this.institutionRepo.save(
      fakeInstitution,
    );
    console.log("heloow", fakeInstitution);

    const fakeUser = createFakeUser();
    const createdFakeUser = await this.userRepo.save(fakeUser);
    console.log("user", createdFakeUser);
    console.log("2==================", createdFakeUser.id);

    const fakeInstitutionLocations = multipleFakeInstitutionLocations(
      fakeInstitution,
      2,
    );

    const createdFakInstitutionLocations =
      await this.institutionLocationRepo.save(fakeInstitutionLocations);
    console.log("user", createdFakInstitutionLocations);

    const fakeDesignationAgreement = createFakeDesignationAgreement(
      createdFakeInstitution,
      createdFakeUser,
      createdFakInstitutionLocations,
    );
    console.log(fakeDesignationAgreement);
    await this.repo.save(fakeDesignationAgreement);
    console.log("after");
  }
}
