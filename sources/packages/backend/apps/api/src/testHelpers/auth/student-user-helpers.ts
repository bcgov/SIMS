import { TestingModule } from "@nestjs/testing";
import { IdentityProviders, Student, User } from "@sims/sims-db";
import { getProviderInstanceForModule } from "@sims/test-utils";
import { AuthModule } from "../../auth/auth.module";
import { UserService } from "../../services";
import { JwtStrategy } from "../../auth/jwt.strategy";
import { IUserToken } from "../../auth";

/**
 * Mocks user log info from student service to return the passed student.
 * Please use the method {@link mockUserLoginInfo} instead, which mocks only
 * the user info in the JWT token to allow the user to be retrieved from the DB
 * during the validation of the JWT token.
 * @param testingModule nest testing module.
 * @param student a persisted student object.
 */
export async function mockUserLoginInfo(
  testingModule: TestingModule,
  student: Student,
): Promise<jest.SpyInstance> {
  const userService = await getProviderInstanceForModule(
    testingModule,
    AuthModule,
    UserService,
  );
  return jest.spyOn(userService, "getUserLoginInfo").mockImplementation(() => {
    return Promise.resolve({
      id: student.user.id,
      isActive: true,
      studentId: student.id,
      identityProviderType: IdentityProviders.BCSC,
    });
  });
}

/**
 * Mocks the user login info, replacing the user info by the mocked one, to allow
 * it to be retrieved from the DB during the validation of the JWT token.
 * @param testingModule nest testing module.
 * @param user mocked user.
 */
export async function mockJWTUserInfo(
  testingModule: TestingModule,
  user: User,
): Promise<jest.SpyInstance> {
  const jwtStrategy = await getProviderInstanceForModule(
    testingModule,
    AuthModule,
    JwtStrategy,
  );
  // Keep the original validate method to call it after modifying the payload.
  const originalValidate = jwtStrategy.validate.bind(jwtStrategy);
  return jest
    .spyOn(jwtStrategy, "validate")
    .mockImplementation((payload: IUserToken) => {
      payload.userName = user.userName;
      payload.lastName = user.lastName;
      payload.givenNames = user.firstName;
      return originalValidate(payload);
    });
}

/**
 * Resets the user login info mock.
 * This could used to reset the mock after each test.
 * @param testingModule testing module.
 */
export async function resetMockUserLoginInfo(testingModule: TestingModule) {
  const userService = await getProviderInstanceForModule(
    testingModule,
    AuthModule,
    UserService,
  );
  jest.spyOn(userService, "getUserLoginInfo").mockRestore();
}

/**
 * Resets the JWT user name mock.
 * This could used to reset the mock after each test.
 * @param testingModule testing module.
 */
export async function resetMockJWTUserInfo(testingModule: TestingModule) {
  const jwtStrategy = await getProviderInstanceForModule(
    testingModule,
    AuthModule,
    JwtStrategy,
  );
  jest.spyOn(jwtStrategy, "validate").mockRestore();
}
