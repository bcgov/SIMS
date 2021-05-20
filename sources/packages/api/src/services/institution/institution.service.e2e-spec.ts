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
import { institutionFactory, userFactory } from "../../database/factories";
import { type } from "ormconfig";

const factory = async (
  userService: UserService,
  service: InstitutionService,
): Promise<[Institution, User, InstitutionUser]> => {
  const user = await userFactory({
    userName: `${faker.random.uuid()}@bceid`,
  });
  const institution = await institutionFactory();
  const iu = await service.createAssociation({
    institution,
    user,
    type: InstitutionUserType.admin,
  });

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

  it("should return all institution users", async () => {
    // Setup
    const [institution, user, institutionUser] = await factory(
      userService,
      service,
    );

    // Create new user
    const newUser = await userFactory();

    // Create new association
    await service.createAssociation({
      institution,
      type: InstitutionUserType.user,
      user: newUser,
    });

    // Test
    const users: InstitutionUser[] = await service.allUsers(institution.id);

    expect(users.length).toEqual(2);

    // User1
    const user1 = users.filter((item) => item.user.id === user.id)[0];
    expect(user1).toBeDefined();
    expect(user1.authorizations.length).toBeGreaterThan(0);
    expect(user1.authorizations[0].authType.type).toEqual(
      InstitutionUserType.admin,
    );

    // User2
    const user2 = users.filter((item) => item.user.id === newUser.id)[0];
    expect(user2).toBeDefined();
    expect(user2.authorizations.length).toBeGreaterThan(0);
    expect(user2.authorizations[0].authType.type).toEqual(
      InstitutionUserType.user,
    );

    // Clean
    service.remove(institution);
    userService.remove(user);
    userService.remove(newUser);
  });

  it("should return types and roles", async () => {
    const results = await service.getUserTypesAndRoles();
    expect(results).toBeDefined();
    expect(results.userTypes).toBeDefined();
    expect(results.userTypes.length).toBeGreaterThanOrEqual(3);
    expect(results.userRoles).toBeDefined();
    expect(results.userRoles.length).toBeGreaterThanOrEqual(2);
  });
});
