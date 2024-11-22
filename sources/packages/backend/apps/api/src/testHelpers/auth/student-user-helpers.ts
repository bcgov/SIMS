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
) {
  const userService = await getProviderInstanceForModule(
    testingModule,
    AuthModule,
    UserService,
  );
  userService.getUserLoginInfo = jest.fn().mockResolvedValueOnce({
    id: student.user.id,
    isActive: true,
    studentId: student.id,
    identityProviderType: IdentityProviders.BCSC,
  });
}
