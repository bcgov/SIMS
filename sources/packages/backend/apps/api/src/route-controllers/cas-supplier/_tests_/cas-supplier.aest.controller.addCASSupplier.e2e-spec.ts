import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";

describe("CASSupplierAESTController(e2e)-addCASSupplier", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should add a new CAS supplier manually when provided supplier info for a student.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const payload = {
      supplierNumber: "0001234",
      supplierSiteCode: "987",
    };

    const endpoint = `/aest/cas-supplier/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then(async (response) => {
        const casSupplier = response.body;
        const savedCASSupplier = await db.casSupplier.findOneBy({
          student: { id: student.id },
        });
        expect(casSupplier.id).toBe(savedCASSupplier.id);
      });
  });

  it("Should validate site code length when value is greater then max length.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const payload = {
      supplierNumber: "0001234",
      supplierSiteCode: "1234",
    };

    const endpoint = `/aest/cas-supplier/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "supplierSiteCode must be shorter than or equal to 3 characters",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should validate site code length when value is less then min length.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const payload = {
      supplierNumber: "0001234",
      supplierSiteCode: "",
    };

    const endpoint = `/aest/cas-supplier/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "supplierSiteCode must contain only digits.",
          "supplierSiteCode should not be empty",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should validate supplier number to contain only digits when value anything else than digits.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const payload = {
      supplierNumber: "12345",
      supplierSiteCode: "1A3",
    };

    const endpoint = `/aest/cas-supplier/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: ["supplierSiteCode must contain only digits."],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should validate supplier number length when value is greater then max length.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const payload = {
      supplierNumber: "0123456789012345678901234567890",
      supplierSiteCode: "123",
    };

    const endpoint = `/aest/cas-supplier/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "supplierNumber must be shorter than or equal to 30 characters",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should validate supplier number length when value is less then min length.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const payload = {
      supplierNumber: "",
      supplierSiteCode: "123",
    };

    const endpoint = `/aest/cas-supplier/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "supplierNumber must contain only digits.",
          "supplierNumber should not be empty",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should validate supplier number to contain only digits when value anything else than digits.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const payload = {
      supplierNumber: "00000a1111",
      supplierSiteCode: "123",
    };

    const endpoint = `/aest/cas-supplier/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: ["supplierNumber must contain only digits."],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });
});
