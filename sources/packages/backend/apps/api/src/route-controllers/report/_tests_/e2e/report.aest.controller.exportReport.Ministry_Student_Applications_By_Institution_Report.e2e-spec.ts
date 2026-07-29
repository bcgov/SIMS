import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitution,
  saveFakeApplication,
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
  createSingleApplicationDataSetup,
  createVersionedApplicationsDataSetup,
} from "./student-applications-by-institution-report-utils";
import { ConfigService } from "@sims/utilities/config";
import {
  ApplicationStatus,
  DisbursementScheduleStatus,
} from "@sims/sims-db/entities";

describe("ReportAESTController(e2e)-exportReport(Ministry_Student_Applications_By_Institution_Report)", () => {
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
    const application = await createVersionedApplicationsDataSetup(db, {
      student,
      institution,
      originalSubmissionDate: now,
    });
    // Application with a different program is created to ensure that the report filters out
    // applications using the program, when a program filter is provided.
    await createVersionedApplicationsDataSetup(db, {
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
    const expectedRecord = await buildApplicationsByInstitutionData(
      db,
      application.id,
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
        expect(parsedResult.data).toEqual([expectedRecord]);
      });
  });

  it("Should generate the report when a report generation request is made with the appropriate filters, without optional program.", async () => {
    // Arrange
    const now = new Date();
    const student = await saveFakeStudent(db.dataSource);
    const institution = await db.institution.save(createFakeInstitution());
    const applications = await Promise.all([
      createVersionedApplicationsDataSetup(db, {
        student,
        institution,
        originalSubmissionDate: now,
      }),
      createVersionedApplicationsDataSetup(db, {
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
    const expectedRecords = await Promise.all(
      applications.map((application) =>
        buildApplicationsByInstitutionData(db, application.id),
      ),
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
        expect(parsedResult.data).toEqual(expectedRecords);
      });
  });

  it("Should generate the report, excluding archived application when a report generation request is made with the appropriate filters.", async () => {
    // Arrange
    const now = new Date();
    const student = await saveFakeStudent(db.dataSource);
    const institution = await db.institution.save(createFakeInstitution());
    const [application] = await Promise.all([
      createVersionedApplicationsDataSetup(db, {
        student,
        institution,
        originalSubmissionDate: now,
      }),
      createVersionedApplicationsDataSetup(db, {
        student,
        institution,
        originalSubmissionDate: now,
        // Set the offering end date to be outside the archive date range to ensure that the application is archived.
        currentOfferingEndDateOffset: -applicationArchiveDays - 1,
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
    const expectedRecord = await buildApplicationsByInstitutionData(
      db,
      application.id,
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
        expect(parsedResult.data).toEqual([expectedRecord]);
      });
  });

  it("Should generate the report with disbursed as Yes when a report generation request is made and the parent application has one disbursement sent.", async () => {
    // Arrange
    const now = new Date();
    const student = await saveFakeStudent(db.dataSource);
    const institution = await db.institution.save(createFakeInstitution());
    const application = await createVersionedApplicationsDataSetup(db, {
      student,
      institution,
      originalSubmissionDate: now,
      // Ensure response will be Yes.
      parentApplicationFirstDisbursementInitialValues: {
        disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
      },
    });
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
    const expectedRecord = await buildApplicationsByInstitutionData(
      db,
      application.id,
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
        expect(parsedResult.data).toEqual([expectedRecord]);
      });
  });

  it("Should generate the report including application in different statuses (Completed, Assessment, Enrolment) when a report generation request is made.", async () => {
    // Arrange
    const [twoDaysAgo, yesterday, today] = [
      addDays(-2, new Date()),
      addDays(-1, new Date()),
      new Date(),
    ];
    const student = await saveFakeStudent(db.dataSource);
    const institution = await db.institution.save(createFakeInstitution());
    const applicationInCompletedStatus = await createSingleApplicationDataSetup(
      db,
      {
        student,
        institution,
        applicationStatus: ApplicationStatus.Completed,
        submissionDate: today,
        firstDisbursementInitialValues: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      },
    );
    const applicationInEnrolmentStatus = await createSingleApplicationDataSetup(
      db,
      {
        student,
        institution,
        applicationStatus: ApplicationStatus.Assessment,
        submissionDate: yesterday,
      },
    );
    const applicationInAssessmentStatus =
      await createSingleApplicationDataSetup(db, {
        student,
        institution,
        applicationStatus: ApplicationStatus.Enrolment,
        submissionDate: twoDaysAgo,
      });
    const payload = {
      reportName: "Ministry_Student_Applications_By_Institution_Report",
      params: {
        institution: institution.id,
        program: "",
        // Use a day only period to ensure the report filters out applications
        // based on the submission of the first ever submitted application.
        startDate: twoDaysAgo,
        endDate: addDays(1, today),
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
    const expectedRecords = await Promise.all([
      buildApplicationsByInstitutionData(db, applicationInAssessmentStatus.id),
      buildApplicationsByInstitutionData(db, applicationInEnrolmentStatus.id),
      buildApplicationsByInstitutionData(db, applicationInCompletedStatus.id),
    ]);

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
        expect(parsedResult.data).toEqual(expectedRecords);
      });
  });

  it("Should generate the report for an in-progress application when a report generation request is made.", async () => {
    // Arrange
    const now = new Date();
    const student = await saveFakeStudent(db.dataSource);
    const institution = await db.institution.save(createFakeInstitution());
    const application = await saveFakeApplication(
      db.dataSource,
      {
        student,
        institution,
      },
      {
        initialValues: {
          applicationStatus: ApplicationStatus.InProgress,
          submittedDate: now,
        },
      },
    );
    application.versions = [application];
    application.parentApplication = application;
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
    const expectedRecord = await buildApplicationsByInstitutionData(
      db,
      application.id,
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
        expect(parsedResult.data).toEqual([expectedRecord]);
      });
  });
});
