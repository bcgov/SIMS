import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { OfferingIntensity } from "@sims/sims-db";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  getExternalUserToken,
} from "../../../../testHelpers";
import {
  StudentSearchAPIInDTO,
  StudentSearchResultAPIOutDTO,
} from "../../models/student-external-search.dto";

describe("StudentExternalController(e2e)-searchStudents", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  const endpoint = "/external/student";
  const VALID_SIN = "656173713";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    // Set the sin validation of the used in tests to be invalid to not interfere with other tests.
    await db.sinValidation.update(
      {
        sin: VALID_SIN,
      },
      { isValidSIN: false },
    );
  });

  it(
    "Should return student information from SIMS when the student with provided SIN exist in SIMS" +
      ` but not in SFAS and the student does not have any ${OfferingIntensity.fullTime} applications`,
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: { sin: VALID_SIN },
        includeAddressLine2: true,
      });
      const studentSIN = student.sinValidation.sin;
      const address = student.contactInfo.address;
      const searchPayload: StudentSearchAPIInDTO = {
        sin: studentSIN,
      };
      const token = await getExternalUserToken();
      const expectedStudentServiceResult: StudentSearchResultAPIOutDTO = {
        isLegacy: false,
        givenNames: student.user.firstName,
        lastName: student.user.lastName,
        sin: student.sinValidation.sin,
        birthDate: student.birthDate,
        phoneNumber: student.contactInfo.phone,
        address: {
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          provinceState: address.provinceState,
          country: address.country,
          postalCode: address.postalCode,
        },
        applications: [],
      };
      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(searchPayload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect(expectedStudentServiceResult);
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
