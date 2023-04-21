import { IdentityProviders, Student } from "@sims/sims-db";
import { FakeStudentUsersTypes, getStudentToken } from "../auth";
import { MockedMethods } from "../testing-modules/testing-modules-helper";

export async function mockStudentUserAndGetUserToken(
  student: Student,
  mockedMethods: MockedMethods,
) {
  mockedMethods.getUserLoginInfoReturn = {
    id: student.user.id,
    isActive: true,
    studentId: student.id,
    identityProviderType: IdentityProviders.BCSC,
  };
  return getStudentToken(FakeStudentUsersTypes.FakeStudentUserType1);
}
