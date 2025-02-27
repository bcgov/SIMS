import { Student } from "@sims/sims-db";
import { DataSource } from "typeorm";
import { getCachedToken } from "./token-helpers";
import { UserPasswordCredential } from "@sims/utilities/config";
import { AuthorizedParties } from "../../auth";

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
  let credential: UserPasswordCredential;
  if (fakeStudentTestUser === FakeStudentUsersTypes.FakeStudentUserType1) {
    credential = {
      userName: process.env.E2E_TEST_STUDENT_USERNAME,
      password: process.env.E2E_TEST_STUDENT_PASSWORD,
    };
  }
  return getCachedToken(AuthorizedParties.student, {
    userPasswordCredential: credential,
    uniqueTokenCache: fakeStudentTestUser.toString(),
  });
}

/**
 * Get a student by one of the {@link FakeStudentUsersTypes}.
 * !Do not use this method to get the student if the intention is to modify its data.
 * !To perform E2E tests targeting the student client API, please create a new student
 * !and use the method mockUserLoginInfo.
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
  const studentRepo = dataSource.getRepository(Student);
  return studentRepo.findOne({
    where: { user: { userName } },
  });
}
