import { KeycloakService } from "../../services";
import { TokenResponse } from "../../services/auth/keycloak/token-response.model";
import { Student, User } from "@sims/sims-db";
import { DataSource } from "typeorm";

const studentClientId = "student";

export enum FakeStudentUsersTypes {
  /**
   * Fake student user type used for simple tests.
   * This student has a valid SIN and SIN consent.
   */
  FakeStudentUserType1,
}

/**
 * Get the token for a student user persisted by the test DB seeding.
 * @param fakeStudentTestUser a fake student test user persisted in the test DB.
 * @returns a student user token to be used in the tests.
 */
export async function getStudentToken(
  fakeStudentTestUser: FakeStudentUsersTypes,
): Promise<string> {
  let studentToken: TokenResponse;
  if (fakeStudentTestUser === FakeStudentUsersTypes.FakeStudentUserType1) {
    studentToken = await KeycloakService.shared.getToken(
      process.env.E2E_TEST_STUDENT_USERNAME,
      process.env.E2E_TEST_STUDENT_PASSWORD,
      studentClientId,
    );
  }
  return studentToken.access_token;
}

/**
 * Get a student by one of the {@link FakeStudentUsersTypes}.
 * @param fakeStudentUserType a fake student user type.
 * @param dataSource the application data source.
 * @returns a student.
 */
export async function getStudentByFakeStudentUserType(
  fakeStudentUserType: FakeStudentUsersTypes,
  dataSource: DataSource,
): Promise<Student> {
  if (fakeStudentUserType === FakeStudentUsersTypes.FakeStudentUserType1) {
    return getStudentByUsername(
      process.env.E2E_TEST_STUDENT_USERNAME,
      dataSource,
    );
  }
}

/**
 * Get a student by user name.
 * @param userName user name of the student.
 * @param dataSource the application data source.
 * @returns a student.
 */
async function getStudentByUsername(
  userName: string,
  dataSource: DataSource,
): Promise<Student> {
  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.findOneBy({ userName });
  const studentRepo = dataSource.getRepository(Student);
  return await studentRepo.findOneBy({ user: { id: user.id } });
}
