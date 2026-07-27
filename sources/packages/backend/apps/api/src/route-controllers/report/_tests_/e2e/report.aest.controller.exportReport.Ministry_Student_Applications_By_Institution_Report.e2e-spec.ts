import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitution,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { parse } from "papaparse";
import request from "supertest";
import { addDays } from "@sims/utilities";
import {
  buildApplicationsByInstitutionData,
  createApplicationsByInstitutionDataSetup,
} from "./student-applications-by-institution-report-utils";
import { ConfigService } from "@sims/utilities/config";

describe("ReportAestController(e2e)-exportReport(Ministry_Student_Applications_By_Institution_Report)", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let applicationArchiveDays: number;
  const endpoint = "/aest/report";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    applicationArchiveDays = app.get(ConfigService).applicationArchiveDays;
  });

  it("Should generate the report when a report generation request is made with the appropriate filters, including optional program.", async () => {
    // Arrange
    const now = new Date();
    const student = await saveFakeStudent(db.dataSource);
    const institution = await db.institution.save(createFakeInstitution());
    const application = await createApplicationsByInstitutionDataSetup(db, {
      student,
      institution,
      originalSubmissionDate: now,
    });
    // Application with a different program is created to ensure that the report filters out
    // applications using the program, when a program filter is provided.
    await createApplicationsByInstitutionDataSetup(db, {
      student,
      institution,
      originalSubmissionDate: now,
    });
    const payload = {
      reportName: "Ministry_Student_Applications_By_Institution_Report",
      params: {
        institution: institution.id,
        program: application.currentAssessment.offering.educationProgram.id,
        // Use a day only period to ensure the report filters out applications
        // based on the submission of the first ever submitted application.
        startDate: now,
        endDate: addDays(1, now),
        isLimitedByArchiveDate: true,
        offeringIntensity: {
          "Full Time": true,
          "Part Time": true,
        },
      },
    };

    const ministryUserToken = await getAESTToken(
      AESTGroups.BusinessAdministrators,
    );
    // Expected report records.
    const expectedRecord = buildApplicationsByInstitutionData(application);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(ministryUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        const fileContent = response.request.res["text"];
        const parsedResult = parse(fileContent, {
          header: true,
        });
        expect(parsedResult.data).toEqual([expectedRecord]);
      });
  });

  it("Should generate the report when a report generation request is made with the appropriate filters, without optional program.", async () => {
    // Arrange
    const now = new Date();
    const student = await saveFakeStudent(db.dataSource);
    const institution = await db.institution.save(createFakeInstitution());
    const applications = await Promise.all([
      createApplicationsByInstitutionDataSetup(db, {
        student,
        institution,
        originalSubmissionDate: now,
      }),
      createApplicationsByInstitutionDataSetup(db, {
        student,
        institution,
        originalSubmissionDate: now,
      }),
    ]);
    const payload = {
      reportName: "Ministry_Student_Applications_By_Institution_Report",
      params: {
        institution: institution.id,
        program: "",
        // Use a day only period to ensure the report filters out applications
        // based on the submission of the first ever submitted application.
        startDate: now,
        endDate: addDays(1, now),
        isLimitedByArchiveDate: true,
        offeringIntensity: {
          "Full Time": true,
          "Part Time": true,
        },
      },
    };

    const ministryUserToken = await getAESTToken(
      AESTGroups.BusinessAdministrators,
    );
    // Expected report records.
    const expectedRecords = applications.map((application) =>
      buildApplicationsByInstitutionData(application),
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(ministryUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        const fileContent = response.request.res["text"];
        const parsedResult = parse(fileContent, {
          header: true,
        });
        expect(parsedResult.data).toEqual(
          expect.arrayContaining(expectedRecords),
        );
      });
  });

  it("Should generate the report, excluding archived application when a report generation request is made with the appropriate filters.", async () => {
    // Arrange
    const now = new Date();
    const student = await saveFakeStudent(db.dataSource);
    const institution = await db.institution.save(createFakeInstitution());
    const [application] = await Promise.all([
      createApplicationsByInstitutionDataSetup(db, {
        student,
        institution,
        originalSubmissionDate: now,
      }),
      createApplicationsByInstitutionDataSetup(db, {
        student,
        institution,
        originalSubmissionDate: now,
        // Set the offering end date to be outside the archive date range to ensure that the application is archived.
        currentOfferingEndDateOffSet: -applicationArchiveDays - 1,
      }),
    ]);
    const payload = {
      reportName: "Ministry_Student_Applications_By_Institution_Report",
      params: {
        institution: institution.id,
        program: "",
        // Use a day only period to ensure the report filters out applications
        // based on the submission of the first ever submitted application.
        startDate: now,
        endDate: addDays(1, now),
        isLimitedByArchiveDate: true,
        offeringIntensity: {
          "Full Time": true,
          "Part Time": true,
        },
      },
    };

    const ministryUserToken = await getAESTToken(
      AESTGroups.BusinessAdministrators,
    );
    // Expected report records.
    const expectedRecord = buildApplicationsByInstitutionData(application);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(ministryUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        const fileContent = response.request.res["text"];
        const parsedResult = parse(fileContent, {
          header: true,
        });
        expect(parsedResult.data).toEqual([expectedRecord]);
      });
  });
});
