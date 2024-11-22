import { TestingModule } from "@nestjs/testing";
import { IdentityProviders, Student } from "@sims/sims-db";
import { getProviderInstanceForModule } from "@sims/test-utils";
import { AuthModule } from "../../auth/auth.module";
import { UserService } from "../../services";

/**
 * Mocks user log info from student service to return the passed student.
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
  jest.spyOn(userService, "getUserLoginInfo").mockReset();
}
