import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  Institution,
  OfferingIntensity,
  Student,
} from "@sims/sims-db";

import { addDays, getISODateOnlyString } from "@sims/utilities";
import { PaginatedResultsAPIOutDTO } from "../../../models/pagination.dto";
import { COESummaryAPIOutDTO } from "../../models/confirmation-of-enrollment.dto";
import { getUserFullName } from "../../../../utilities";
import { EnrollmentPeriod } from "@sims/services";

describe("ConfirmationOfEnrollmentInstitutionsController(e2e)-getCOESummary", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let applicationRepo: Repository<Application>;
  let disbursementScheduleRepo: Repository<DisbursementSchedule>;
  let collegeC: Institution;
  let sharedStudent: Student;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    applicationRepo = dataSource.getRepository(Application);
    disbursementScheduleRepo = dataSource.getRepository(DisbursementSchedule);

    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeC = institution;
    // Shared student with SIN validation.
    sharedStudent = await saveFakeStudent(appDataSource);
  });

  it("Should get the COE current summary when there are 2 COEs available.", async () => {
    // Arrange
    const collegeCLocation = createFakeInstitutionLocation({
      institution: collegeC,
    });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    // Application A
    const applicationA = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
        student: sharedStudent,
      },
      {
        applicationStatus: ApplicationStatus.Enrolment,
        createSecondDisbursement: true,
      },
    );
    const [applicationAFirstSchedule] =
      applicationA.currentAssessment.disbursementSchedules;
    // Application B
    const applicationB = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
        student: sharedStudent,
      },
      {
        applicationStatus: ApplicationStatus.Enrolment,
        createSecondDisbursement: true,
      },
    );
    const [applicationBFirstSchedule] =
      applicationB.currentAssessment.disbursementSchedules;
    // Adjust the date to ensure the proper order on the return.
    applicationBFirstSchedule.disbursementDate = getISODateOnlyString(
      addDays(1, applicationAFirstSchedule.disbursementDate),
    );
    await disbursementScheduleRepo.save(applicationBFirstSchedule);

    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/enrollmentPeriod/${EnrollmentPeriod.Current}?page=0&pageLimit=10&sortField=disbursementDate&sortOrder=ASC`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect((response) => {
        const paginatedResults =
          response.body as PaginatedResultsAPIOutDTO<COESummaryAPIOutDTO>;
        expect(paginatedResults.count).toBe(2);
        const [firstCOE, secondCOE] = paginatedResults.results;
        expect(firstCOE).toStrictEqual({
          applicationNumber: applicationA.applicationNumber,
          applicationId: applicationA.id,
          offeringIntensity: firstCOE.offeringIntensity,
          studentNumber: firstCOE.studentNumber,
          studyStartDate:
            applicationA.currentAssessment.offering.studyStartDate,
          studyEndDate: applicationA.currentAssessment.offering.studyEndDate,
          coeStatus: COEStatus.required,
          fullName: getUserFullName(applicationA.student.user),
          disbursementScheduleId: applicationAFirstSchedule.id,
          disbursementDate: applicationAFirstSchedule.disbursementDate,
        });
        expect(secondCOE).toStrictEqual({
          applicationNumber: applicationB.applicationNumber,
          applicationId: applicationB.id,
          offeringIntensity: applicationB.offeringIntensity,
          studentNumber: applicationB.studentNumber,
          studyStartDate:
            applicationB.currentAssessment.offering.studyStartDate,
          studyEndDate: applicationB.currentAssessment.offering.studyEndDate,
          coeStatus: COEStatus.required,
          fullName: getUserFullName(applicationB.student.user),
          disbursementScheduleId: applicationBFirstSchedule.id,
          disbursementDate: applicationBFirstSchedule.disbursementDate,
        });
      });
  });

  it(
    "Should get the COE current summary only from the provided institution location" +
      " when there are 2 COEs available for the current location and more available for other locations.",
    async () => {
      // Arrange
      const collegeCLocation = createFakeInstitutionLocation({
        institution: collegeC,
      });
      await authorizeUserTokenForLocation(
        appDataSource,
        InstitutionTokenTypes.CollegeCUser,
        collegeCLocation,
      );
      // Application for a different location which is not expected in COE summary.
      await saveFakeApplicationDisbursements(
        appDataSource,
        {
          student: sharedStudent,
        },
        {
          applicationStatus: ApplicationStatus.Enrolment,
          createSecondDisbursement: true,
        },
      );
      // Application A for current location.
      const applicationA = await saveFakeApplicationDisbursements(
        appDataSource,
        {
          institution: collegeC,
          institutionLocation: collegeCLocation,
          student: sharedStudent,
        },
        {
          applicationStatus: ApplicationStatus.Enrolment,
          createSecondDisbursement: true,
        },
      );
      const [applicationAFirstSchedule] =
        applicationA.currentAssessment.disbursementSchedules;
      // Application B for current location.
      const applicationB = await saveFakeApplicationDisbursements(
        appDataSource,
        {
          institution: collegeC,
          institutionLocation: collegeCLocation,
          student: sharedStudent,
        },
        {
          applicationStatus: ApplicationStatus.Enrolment,
          createSecondDisbursement: true,
        },
      );
      const [applicationBFirstSchedule] =
        applicationB.currentAssessment.disbursementSchedules;
      // Adjust the date to ensure the proper order on the return.
      applicationBFirstSchedule.disbursementDate = getISODateOnlyString(
        addDays(1, applicationAFirstSchedule.disbursementDate),
      );
      await disbursementScheduleRepo.save(applicationBFirstSchedule);

      const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/enrollmentPeriod/${EnrollmentPeriod.Current}?page=0&pageLimit=10&sortField=disbursementDate&sortOrder=ASC`;
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(
          await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
          BEARER_AUTH_TYPE,
        )
        .expect(HttpStatus.OK)
        .expect({
          count: 2,
          results: [
            {
              applicationNumber: applicationA.applicationNumber,
              applicationId: applicationA.id,
              offeringIntensity: applicationA.offeringIntensity,
              studentNumber: applicationA.studentNumber,
              studyStartDate:
                applicationA.currentAssessment.offering.studyStartDate,
              studyEndDate:
                applicationA.currentAssessment.offering.studyEndDate,
              coeStatus: COEStatus.required,
              fullName: getUserFullName(applicationA.student.user),
              disbursementScheduleId: applicationAFirstSchedule.id,
              disbursementDate: applicationAFirstSchedule.disbursementDate,
            },
            {
              applicationNumber: applicationB.applicationNumber,
              applicationId: applicationB.id,
              offeringIntensity: applicationB.offeringIntensity,
              studentNumber: applicationB.studentNumber,
              studyStartDate:
                applicationB.currentAssessment.offering.studyStartDate,
              studyEndDate:
                applicationB.currentAssessment.offering.studyEndDate,
              coeStatus: COEStatus.required,
              fullName: getUserFullName(applicationB.student.user),
              disbursementScheduleId: applicationBFirstSchedule.id,
              disbursementDate: applicationBFirstSchedule.disbursementDate,
            },
          ],
        });
    },
  );

  it(
    `Should get the COE current summary only from applications with application status ${ApplicationStatus.Enrolment} or ${ApplicationStatus.Completed}` +
      " when there are 2 COEs in given application statuses and more available for other application statuses.",
    async () => {
      // Arrange
      const collegeCLocation = createFakeInstitutionLocation({
        institution: collegeC,
      });
      await authorizeUserTokenForLocation(
        appDataSource,
        InstitutionTokenTypes.CollegeCUser,
        collegeCLocation,
      );
      // Application with status 'Assessment' which is not expected in COE summary.
      await saveFakeApplicationDisbursements(
        appDataSource,
        {
          institution: collegeC,
          institutionLocation: collegeCLocation,
          student: sharedStudent,
        },
        {
          applicationStatus: ApplicationStatus.Assessment,
        },
      );
      // Application in status 'Enrolment'.
      const applicationA = await saveFakeApplicationDisbursements(
        appDataSource,
        {
          institution: collegeC,
          institutionLocation: collegeCLocation,
          student: sharedStudent,
        },
        {
          applicationStatus: ApplicationStatus.Enrolment,
          createSecondDisbursement: true,
        },
      );
      const [applicationAFirstSchedule] =
        applicationA.currentAssessment.disbursementSchedules;

      const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/enrollmentPeriod/${EnrollmentPeriod.Current}?page=0&pageLimit=10&sortField=disbursementDate&sortOrder=ASC`;
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(
          await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
          BEARER_AUTH_TYPE,
        )
        .expect(HttpStatus.OK)
        .expect({
          count: 1,
          results: [
            {
              applicationNumber: applicationA.applicationNumber,
              applicationId: applicationA.id,
              offeringIntensity: applicationA.offeringIntensity,
              studentNumber: applicationA.studentNumber,
              studyStartDate:
                applicationA.currentAssessment.offering.studyStartDate,
              studyEndDate:
                applicationA.currentAssessment.offering.studyEndDate,
              coeStatus: COEStatus.required,
              fullName: getUserFullName(applicationA.student.user),
              disbursementScheduleId: applicationAFirstSchedule.id,
              disbursementDate: applicationAFirstSchedule.disbursementDate,
            },
          ],
        });
    },
  );

  it("Should get the count of COE current summary as zero when there is 1 COE that doesn't have estimated awards.", async () => {
    // Arrange
    const collegeCLocation = createFakeInstitutionLocation({
      institution: collegeC,
    });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    // Application A
    await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
        student: sharedStudent,
      },
      {
        applicationStatus: ApplicationStatus.Enrolment,
        createSecondDisbursement: true,
        firstDisbursementInitialValues: { hasEstimatedAwards: false },
        secondDisbursementInitialValues: { hasEstimatedAwards: false },
      },
    );

    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/enrollmentPeriod/${EnrollmentPeriod.Current}?page=0&pageLimit=10&sortField=disbursementDate&sortOrder=ASC`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect((response) => {
        const paginatedResults =
          response.body as PaginatedResultsAPIOutDTO<COESummaryAPIOutDTO>;
        expect(paginatedResults.count).toBe(0);
      });
  });

  it("Should return a BadRequest error when the page number has an invalid integer.", async () => {
    // Arrange
    const collegeCLocation = createFakeInstitutionLocation({
      institution: collegeC,
    });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    const invalidPage = Number.MAX_SAFE_INTEGER + 1;
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/enrollmentPeriod/${EnrollmentPeriod.Current}?page=${invalidPage}&pageLimit=10&sortField=disbursementDate&sortOrder=ASC`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ["page must not be greater than 9007199254740991"],
        error: "Bad Request",
      });
  });

  it("Should get the COE upcoming summary when there are 2 COEs available.", async () => {
    // Arrange
    const collegeCLocation = createFakeInstitutionLocation({
      institution: collegeC,
    });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    // Application A
    const applicationA = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
        student: sharedStudent,
      },
      {
        applicationStatus: ApplicationStatus.Enrolment,
        createSecondDisbursement: true,
      },
    );
    applicationA.applicationNumber = "GET_COE_01";
    const [applicationAFirstSchedule, applicationASecondSchedule] =
      applicationA.currentAssessment.disbursementSchedules;
    await applicationRepo.save(applicationA);
    await disbursementScheduleRepo.save(applicationAFirstSchedule);
    // Application B
    const applicationB = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
        student: sharedStudent,
      },
      {
        applicationStatus: ApplicationStatus.Enrolment,
        createSecondDisbursement: true,
      },
    );
    // Ensure the proper order by the application number.
    applicationB.applicationNumber = "GET_COE_02";
    const [applicationBFirstSchedule, applicationBSecondSchedule] =
      applicationB.currentAssessment.disbursementSchedules;
    await applicationRepo.save(applicationB);
    await disbursementScheduleRepo.save(applicationBFirstSchedule);

    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/enrollmentPeriod/${EnrollmentPeriod.Upcoming}?page=0&pageLimit=10&sortField=applicationNumber&sortOrder=ASC`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect((response) => {
        const paginatedResults =
          response.body as PaginatedResultsAPIOutDTO<COESummaryAPIOutDTO>;
        expect(paginatedResults.count).toBe(2);
        const [firstCOE, secondCOE] = paginatedResults.results;
        expect(firstCOE).toStrictEqual({
          applicationNumber: applicationA.applicationNumber,
          applicationId: applicationA.id,
          offeringIntensity: firstCOE.offeringIntensity,
          studentNumber: firstCOE.studentNumber,
          studyStartDate:
            applicationA.currentAssessment.offering.studyStartDate,
          studyEndDate: applicationA.currentAssessment.offering.studyEndDate,
          coeStatus: COEStatus.required,
          fullName: getUserFullName(applicationA.student.user),
          disbursementScheduleId: applicationASecondSchedule.id,
          disbursementDate: applicationASecondSchedule.disbursementDate,
        });
        expect(secondCOE).toStrictEqual({
          applicationNumber: applicationB.applicationNumber,
          applicationId: applicationB.id,
          offeringIntensity: secondCOE.offeringIntensity,
          studentNumber: secondCOE.studentNumber,
          studyStartDate:
            applicationB.currentAssessment.offering.studyStartDate,
          studyEndDate: applicationB.currentAssessment.offering.studyEndDate,
          coeStatus: COEStatus.required,
          fullName: getUserFullName(applicationB.student.user),
          disbursementScheduleId: applicationBSecondSchedule.id,
          disbursementDate: applicationBSecondSchedule.disbursementDate,
        });
      });
  });

  it(
    `Should get all the COEs with COE status ${COEStatus.completed} or ${COEStatus.declined} in the upcoming summary` +
      " when the provided location has one or more COEs with those statuses.",
    async () => {
      // Arrange
      const collegeCLocation = createFakeInstitutionLocation({
        institution: collegeC,
      });
      await authorizeUserTokenForLocation(
        appDataSource,
        InstitutionTokenTypes.CollegeCUser,
        collegeCLocation,
      );
      // Application A
      const applicationA = await saveFakeApplicationDisbursements(
        appDataSource,
        {
          institution: collegeC,
          institutionLocation: collegeCLocation,
          student: sharedStudent,
        },
        {
          applicationStatus: ApplicationStatus.Enrolment,
          firstDisbursementInitialValues: { coeStatus: COEStatus.completed },
        },
      );
      const [applicationAFirstSchedule] =
        applicationA.currentAssessment.disbursementSchedules;
      // Application B
      const applicationB = await saveFakeApplicationDisbursements(
        appDataSource,
        {
          institution: collegeC,
          institutionLocation: collegeCLocation,
          student: sharedStudent,
        },
        {
          applicationStatus: ApplicationStatus.Enrolment,
          firstDisbursementInitialValues: { coeStatus: COEStatus.declined },
        },
      );
      const [applicationBFirstSchedule] =
        applicationB.currentAssessment.disbursementSchedules;
      applicationBFirstSchedule.disbursementDate = getISODateOnlyString(
        addDays(1, applicationAFirstSchedule.disbursementDate),
      );
      await disbursementScheduleRepo.save(applicationBFirstSchedule);
      const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/enrollmentPeriod/${EnrollmentPeriod.Upcoming}?page=0&pageLimit=10&sortField=disbursementDate&sortOrder=ASC`;
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(
          await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
          BEARER_AUTH_TYPE,
        )
        .expect(HttpStatus.OK)
        .expect({
          count: 2,
          results: [
            {
              applicationNumber: applicationA.applicationNumber,
              applicationId: applicationA.id,
              offeringIntensity: applicationA.offeringIntensity,
              studentNumber: applicationA.studentNumber,
              studyStartDate:
                applicationA.currentAssessment.offering.studyStartDate,
              studyEndDate:
                applicationA.currentAssessment.offering.studyEndDate,
              coeStatus: COEStatus.completed,
              fullName: getUserFullName(applicationA.student.user),
              disbursementScheduleId: applicationAFirstSchedule.id,
              disbursementDate: applicationAFirstSchedule.disbursementDate,
            },
            {
              applicationNumber: applicationB.applicationNumber,
              applicationId: applicationB.id,
              offeringIntensity: applicationB.offeringIntensity,
              studentNumber: applicationB.studentNumber,
              studyStartDate:
                applicationB.currentAssessment.offering.studyStartDate,
              studyEndDate:
                applicationB.currentAssessment.offering.studyEndDate,
              coeStatus: COEStatus.declined,
              fullName: getUserFullName(applicationB.student.user),
              disbursementScheduleId: applicationBFirstSchedule.id,
              disbursementDate: applicationBFirstSchedule.disbursementDate,
            },
          ],
        });
    },
  );

  it(
    "Should get the COE current summary only for applications with offering end date till today" +
      " when there is one COE for an offering with end date as today," +
      " one COE with the offering end date as tomorrow," +
      " and one COE with the offering end date in the past.",
    async () => {
      // Arrange
      const today = getISODateOnlyString(new Date());
      const yesterday = getISODateOnlyString(addDays(-1, today));
      const tomorrow = getISODateOnlyString(addDays(1, today));
      const collegeCLocation = createFakeInstitutionLocation({
        institution: collegeC,
      });
      await authorizeUserTokenForLocation(
        appDataSource,
        InstitutionTokenTypes.CollegeCUser,
        collegeCLocation,
      );
      // Application A with offering end date as today,
      // which is the edge of the limit to it be included.
      const applicationAPromise = await saveFakeApplicationDisbursements(
        appDataSource,
        {
          institution: collegeC,
          institutionLocation: collegeCLocation,
          student: sharedStudent,
        },
        {
          applicationStatus: ApplicationStatus.Enrolment,
          offeringInitialValues: { studyEndDate: today },
          // Disbursement date inside COE window.
          firstDisbursementInitialValues: { disbursementDate: today },
        },
      );
      // Application B with offering end date as tomorrow,
      // which is near the edge of the limit to it be included.
      const applicationBPromise = await saveFakeApplicationDisbursements(
        appDataSource,
        {
          institution: collegeC,
          institutionLocation: collegeCLocation,
          student: sharedStudent,
        },
        {
          applicationStatus: ApplicationStatus.Enrolment,
          offeringInitialValues: { studyEndDate: tomorrow },
          // Disbursement date inside COE window and after application A disbursement date.
          firstDisbursementInitialValues: { disbursementDate: tomorrow },
        },
      );
      // Application C with offering end date one day in the past,
      // which is the edge of the limit to it be excluded.
      const applicationCPromise = await saveFakeApplicationDisbursements(
        appDataSource,
        {
          institution: collegeC,
          institutionLocation: collegeCLocation,
          student: sharedStudent,
        },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringInitialValues: { studyEndDate: yesterday },
          // Disbursement date inside COE window.
          firstDisbursementInitialValues: { disbursementDate: today },
        },
      );
      const [applicationA, applicationB] = await Promise.all([
        applicationAPromise,
        applicationBPromise,
        applicationCPromise,
      ]);
      const [[applicationAFirstSchedule], [applicationBFirstSchedule]] = [
        applicationA.currentAssessment.disbursementSchedules,
        applicationB.currentAssessment.disbursementSchedules,
      ];

      const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/enrollmentPeriod/${EnrollmentPeriod.Current}?page=0&pageLimit=10&sortField=disbursementDate&sortOrder=ASC`;
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(
          await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
          BEARER_AUTH_TYPE,
        )
        .expect(HttpStatus.OK)
        .expect({
          count: 2,
          results: [
            {
              applicationNumber: applicationA.applicationNumber,
              applicationId: applicationA.id,
              offeringIntensity: applicationA.offeringIntensity,
              studentNumber: applicationA.studentNumber,
              studyStartDate:
                applicationA.currentAssessment.offering.studyStartDate,
              studyEndDate:
                applicationA.currentAssessment.offering.studyEndDate,
              coeStatus: COEStatus.required,
              fullName: getUserFullName(applicationA.student.user),
              disbursementScheduleId: applicationAFirstSchedule.id,
              disbursementDate: applicationAFirstSchedule.disbursementDate,
            },
            {
              applicationNumber: applicationB.applicationNumber,
              applicationId: applicationB.id,
              offeringIntensity: applicationB.offeringIntensity,
              studentNumber: applicationB.studentNumber,
              studyStartDate:
                applicationB.currentAssessment.offering.studyStartDate,
              studyEndDate:
                applicationB.currentAssessment.offering.studyEndDate,
              coeStatus: COEStatus.required,
              fullName: getUserFullName(applicationB.student.user),
              disbursementScheduleId: applicationBFirstSchedule.id,
              disbursementDate: applicationBFirstSchedule.disbursementDate,
            },
          ],
        });
    },
  );

  it("Should get the COE current summary only for full-time applications when there is one COE for a full-time and one for a part-time application.", async () => {
    // Arrange
    const collegeCLocation = createFakeInstitutionLocation({
      institution: collegeC,
    });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    // Full-time application.
    const fullTimeApplicationPromise = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
        student: sharedStudent,
      },
      {
        applicationStatus: ApplicationStatus.Enrolment,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );
    // Part-time application.
    const partTimeApplicationPromise = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
        student: sharedStudent,
      },
      {
        applicationStatus: ApplicationStatus.Enrolment,
        offeringIntensity: OfferingIntensity.partTime,
      },
    );
    const [fullTimeApplication] = await Promise.all([
      fullTimeApplicationPromise,
      partTimeApplicationPromise,
    ]);
    const [fullTimeApplicationFirstSchedule] =
      fullTimeApplication.currentAssessment.disbursementSchedules;

    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/enrollmentPeriod/${EnrollmentPeriod.Current}?page=0&pageLimit=10&intensityFilter=${OfferingIntensity.fullTime}&sortField=disbursementDate&sortOrder=ASC`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect({
        count: 1,
        results: [
          {
            applicationNumber: fullTimeApplication.applicationNumber,
            applicationId: fullTimeApplication.id,
            offeringIntensity: fullTimeApplication.offeringIntensity,
            studentNumber: fullTimeApplication.studentNumber,
            studyStartDate:
              fullTimeApplication.currentAssessment.offering.studyStartDate,
            studyEndDate:
              fullTimeApplication.currentAssessment.offering.studyEndDate,
            coeStatus: COEStatus.required,
            fullName: getUserFullName(fullTimeApplication.student.user),
            disbursementScheduleId: fullTimeApplicationFirstSchedule.id,
            disbursementDate: fullTimeApplicationFirstSchedule.disbursementDate,
          },
        ],
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
