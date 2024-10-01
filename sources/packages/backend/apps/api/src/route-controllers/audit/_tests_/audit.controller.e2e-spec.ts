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
import { AuditEvent } from "../../../services/audit/audit-event.enum";
import { AppModule } from "../../../../src/app.module";
import { AuditService } from "../../../../src/services/audit/audit.service";

describe("AuditController(e2e)-audit", () => {
  let app: INestApplication;
  let auditService: AuditService;

  beforeAll(async () => {
    const { nestApplication, module } = await createTestingAppModule();
    app = nestApplication;
    auditService = await getProviderInstanceForModule(
      module,
      AppModule,
      AuditService,
    );
  });

  it(`Should log 'Logged In' message when ${AuditEvent.LoggedIn} is requested.`, async () => {
    // Arrange
    const endpoint = `/audit/${AuditEvent.LoggedIn}`;
    const token = await getAESTToken(AESTGroups.Operations);
    auditService.logger.log = jest.fn();
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);

    expect(auditService.logger.log).toHaveBeenCalledWith(
      "SIMS Audit Event From ::ffff:127.0.0.1 | User GUID: ministry-user-aest-operations@e2e-tests, Event: Logged In, Portal: Ministry.",
    );
  });

  it(`Should log 'Logged Out' message when ${AuditEvent.LoggedOut} is requested.`, async () => {
    // Arrange
    const endpoint = `/audit/${AuditEvent.LoggedOut}`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    auditService.logger.log = jest.fn();
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);

    expect(auditService.logger.log).toHaveBeenCalledWith(
      "SIMS Audit Event From ::ffff:127.0.0.1 | User GUID: b225cb76cfd6486d85da90ec5b775f2d@bceidboth, Event: Logged Out, Portal: Institution.",
    );
  });

  it(`Should log 'Session Timed Out' message when ${AuditEvent.SessionTimedOut} is requested.`, async () => {
    // Arrange
    const endpoint = `/audit/${AuditEvent.SessionTimedOut}`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    auditService.logger.log = jest.fn();
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);

    expect(auditService.logger.log).toHaveBeenCalledWith(
      "SIMS Audit Event From ::ffff:127.0.0.1 | User GUID: student_e2e_test, Event: Session Timed Out, Portal: Student.",
    );
  });

  it(`Should log 'Browser Closed' message when ${AuditEvent.BrowserClosed} is requested.`, async () => {
    // Arrange
    const endpoint = `/audit/${AuditEvent.BrowserClosed}`;
    const token = await getAESTToken(AESTGroups.Operations);
    auditService.logger.log = jest.fn();
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);

    expect(auditService.logger.log).toHaveBeenCalledWith(
      "SIMS Audit Event From ::ffff:127.0.0.1 | User GUID: ministry-user-aest-operations@e2e-tests, Event: Browser Closed, Portal: Ministry.",
    );
  });

  it(`Should log 'Browser Reopened' message when ${AuditEvent.BrowserReopened} is requested.`, async () => {
    // Arrange
    const endpoint = `/audit/${AuditEvent.BrowserReopened}`;
    const token = await getAESTToken(AESTGroups.Operations);
    auditService.logger.log = jest.fn();
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
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
