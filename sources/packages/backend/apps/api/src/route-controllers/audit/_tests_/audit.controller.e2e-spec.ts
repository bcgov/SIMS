import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getAESTToken,
  getInstitutionToken,
  getStudentToken,
  InstitutionTokenTypes,
} from "../../../testHelpers";
import { getProviderInstanceForModule } from "@sims/test-utils";
import { AppModule } from "../../../app.module";
import { AuditEvent, AuditService } from "../../../services";

describe("AuditController(e2e)-audit", () => {
  let app: INestApplication;
  let auditService: AuditService;
  const endpoint = "/audit";

  beforeAll(async () => {
    const { nestApplication, module } = await createTestingAppModule();
    app = nestApplication;
    auditService = await getProviderInstanceForModule(
      module,
      AppModule,
      AuditService,
    );
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    auditService.logger.log = jest.fn();
  });

  it(`Should log 'Logged In' message when ${AuditEvent.LoggedIn} is requested.`, async () => {
    // Arrange
    const payload = { event: AuditEvent.LoggedIn };
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);

    expect(auditService.logger.log).toHaveBeenCalledWith(
      "SIMS Audit Event From ::ffff:127.0.0.1 | User GUID: ministry-user-aest-operations@e2e-tests, Event: Logged In, Portal: Ministry.",
    );
  });

  it(`Should log 'Logged Out' message when ${AuditEvent.LoggedOut} is requested.`, async () => {
    // Arrange
    const payload = { event: AuditEvent.LoggedOut };
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);

    expect(auditService.logger.log).toHaveBeenCalledWith(
      "SIMS Audit Event From ::ffff:127.0.0.1 | User GUID: b225cb76cfd6486d85da90ec5b775f2d@bceidboth, Event: Logged Out, Portal: Institution.",
    );
  });

  it(`Should log 'Session Timed Out' message when ${AuditEvent.SessionTimedOut} is requested.`, async () => {
    // Arrange
    const payload = { event: AuditEvent.SessionTimedOut };
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);

    expect(auditService.logger.log).toHaveBeenCalledWith(
      "SIMS Audit Event From ::ffff:127.0.0.1 | User GUID: student_e2e_test, Event: Session Timed Out, Portal: Student.",
    );
  });

  it(`Should log 'Browser Closed' message when ${AuditEvent.BrowserClosed} is requested.`, async () => {
    // Arrange
    const payload = { event: AuditEvent.BrowserClosed };
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);

    expect(auditService.logger.log).toHaveBeenCalledWith(
      "SIMS Audit Event From ::ffff:127.0.0.1 | User GUID: ministry-user-aest-operations@e2e-tests, Event: Browser Closed, Portal: Ministry.",
    );
  });

  it(`Should log 'Browser Reopened' message when ${AuditEvent.BrowserReopened} is requested.`, async () => {
    // Arrange
    const payload = { event: AuditEvent.BrowserReopened };
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);

    expect(auditService.logger.log).toHaveBeenCalledWith(
      "SIMS Audit Event From ::ffff:127.0.0.1 | User GUID: ministry-user-aest-operations@e2e-tests, Event: Browser Reopened, Portal: Ministry.",
    );
  });

  afterAll(async () => {
    await app.close();
  });
});
