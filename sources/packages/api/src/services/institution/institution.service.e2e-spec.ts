require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import * as faker from "faker";
import { InstitutionService } from "./institution.service";
import { DatabaseModule } from "../../database/database.module";
import { BCeIDService } from "../bceid/bceid.service";
import { ConfigService } from "../config/config.service";
import { UserService } from "../user/user.service";
import { Institution, InstitutionUser, User } from "../../database/entities";
import { DatabaseService } from "../../database/database.service";
import { InstitutionUserType } from "../../types";

const factory = async (
  userService: UserService,
  service: InstitutionService,
): Promise<[Institution, User, InstitutionUser]> => {
  const user = userService.create();
  user.email = faker.internet.email();
  user.firstName = faker.name.firstName();
  user.lastName = faker.name.lastName();
  user.userName = `${faker.random.uuid()}@bceid`;
  const institution = service.create();
  institution.legalOperatingName = faker.company.companyName();
  institution.operatingName = institution.legalOperatingName;
  institution.guid = faker.random.uuid();
  institution.establishedDate = faker.date.past();
  institution.website = faker.internet.url();
  institution.institutionAddress = {
    phone: faker.phone.phoneNumber(),
    addressLine1: faker.address.streetAddress(),
    city: "Victoria",
    country: "Canada",
    postalCode: "V8V1M9",
    provinceState: "BC",
  };
  institution.primaryEmail = faker.internet.email();
  institution.primaryPhone = faker.phone.phoneNumber();
  institution.institutionPrimaryContact = {
    primaryContactEmail: faker.internet.email(),
    primaryContactLastName: faker.name.lastName(),
    primaryContactFirstName: faker.name.firstName(),
    primaryContactPhone: faker.phone.phoneNumber(),
  };
  institution.legalAuthorityContact = {
    legalAuthorityEmail: faker.internet.email(),
    legalAuthorityLastName: faker.name.lastName(),
    legalAuthorityFirstName: faker.name.firstName(),
    legalAuthorityPhone: faker.phone.phoneNumber(),
  };
  institution.regulatingBody = "ICBC";

  const iu = await service.createAssociation(
    institution,
    user,
    InstitutionUserType.admin,
  );

  return [institution, user, iu];
};

describe("InstitutionService", () => {
  let service: InstitutionService;
  let userService: UserService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [InstitutionService, BCeIDService, ConfigService, UserService],
    }).compile();
    await module.init();

    service = module.get<InstitutionService>(InstitutionService);
    userService = module.get<UserService>(UserService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await dbService.connection.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should get institution using user name", async () => {
    const [institution, user, institutionUser] = await factory(
      userService,
      service,
    );
    const result = await service.getInstituteByUserName(user.userName);
    expect(result).toBeDefined();
    expect(result.id).toEqual(institution.id);
    expect(result.guid).toEqual(institution.guid);
    await service.institutionUserRepo.remove(institutionUser);
    await service.remove(institution);
    await service.remove(user);
  });
});
