require("../../../env_setup");
import { closeDB, setupDB } from "../../testHelpers";
import { Connection, Repository } from "typeorm";
import * as faker from "faker";
import {
  User,
  InstitutionUser,
  InstitutionUserAuth,
  InstitutionUserTypeAndRole,
  Institution,
} from "../entities";
import { InstitutionUserType, InstitutionUserRole } from "../../types";
import {
  userFactory,
  institutionUserTypeAndRoleFactory,
  institutionFactory,
  institutionUserFactory,
  institutionLocationFactory,
  institutionUserAuthFactory,
} from "../factories";
import { InstitutionLocation } from "../entities/institution-location.model";

describe.skip("Test institution user and auth model", () => {
  let connection: Connection;
  let typeAndRoleRepo: Repository<InstitutionUserTypeAndRole>;
  let userAuthRepo: Repository<InstitutionUserAuth>;
  let institutionUserRepo: Repository<InstitutionUser>;
  let userRepo: Repository<User>;
  let institutionRepo: Repository<Institution>;
  let locationRepo: Repository<InstitutionLocation>;
  beforeAll(async () => {
    connection = await setupDB();
    typeAndRoleRepo = connection.getRepository<InstitutionUserTypeAndRole>(
      InstitutionUserTypeAndRole,
    );
    userAuthRepo = connection.getRepository<InstitutionUserAuth>(
      InstitutionUserAuth,
    );
    institutionUserRepo = connection.getRepository<InstitutionUser>(
      InstitutionUser,
    );
    userRepo = connection.getRepository(User);
    institutionRepo = connection.getRepository(Institution);
    locationRepo = connection.getRepository(InstitutionLocation);
  });
  afterAll(async () => {
    await closeDB();
  });

  it("should create/fetch institution user", async () => {
    const type = await institutionUserTypeAndRoleFactory(typeAndRoleRepo, {
      type: InstitutionUserType.admin,
      role: InstitutionUserRole.signingAuthority,
    });

    expect(type).toBeDefined();

    const uuid = faker.random.uuid();
    const user: User = await userFactory({
      userName: `${uuid}@bceid`,
    });
    const institution = await institutionFactory();
    // institution.users = [user];
    await institutionRepo.save([institution]);
    await userRepo.save([user]);

    const institutionUser = await institutionUserFactory({
      user,
      institution,
    });

    await institutionUserRepo.save([institutionUser]);
    expect(institutionUser.id).toBeDefined();
    const location = await institutionLocationFactory({
      institution,
    });
    await locationRepo.save([location]);
    const auth = await institutionUserAuthFactory({
      location,
      institutionUser,
      authType: type,
    });
    await userAuthRepo.save([auth]);
    expect(auth.id).toBeDefined();

    // Fetch institution user
    const subject = await institutionUserRepo.findOneOrFail(institutionUser.id);
    const subjectAuth = subject.authorizations.filter(
      (item) => item.id === auth.id,
    );
    expect(subject).toBeDefined();
    expect(subject.id).toEqual(institutionUser.id);
    expect(subject.authorizations).toBeDefined();
    expect(subject.institution.id).toEqual(institution.id);
    expect(subjectAuth.length).toBeGreaterThan(0);
    expect(subjectAuth[0].location.id).toEqual(location.id);

    // Clean
    await institutionUserRepo.remove([institutionUser]);
    await locationRepo.remove([location]);
    await institutionRepo.remove([institution]);
  });
});
