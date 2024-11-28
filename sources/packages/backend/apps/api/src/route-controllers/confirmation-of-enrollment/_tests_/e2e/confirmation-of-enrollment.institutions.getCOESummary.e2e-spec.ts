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
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  Institution,
} from "@sims/sims-db";
import { EnrollmentPeriod } from "../../../../services";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { PaginatedResultsAPIOutDTO } from "../../../models/pagination.dto";
import { COESummaryAPIOutDTO } from "../../models/confirmation-of-enrollment.dto";
import { getUserFullName } from "../../../../utilities";

describe("ConfirmationOfEnrollmentInstitutionsController(e2e)-getCOESummary", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let applicationRepo: Repository<Application>;
  let disbursementScheduleRepo: Repository<DisbursementSchedule>;
  let collegeC: Institution;

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
          studyStartPeriod:
            applicationA.currentAssessment.offering.studyStartDate,
          studyEndPeriod: applicationA.currentAssessment.offering.studyEndDate,
          coeStatus: COEStatus.required,
          fullName: getUserFullName(applicationA.student.user),
          disbursementScheduleId: applicationAFirstSchedule.id,
          disbursementDate: applicationAFirstSchedule.disbursementDate,
        });
        expect(secondCOE).toStrictEqual({
          applicationNumber: applicationB.applicationNumber,
          applicationId: applicationB.id,
          studyStartPeriod:
            applicationB.currentAssessment.offering.studyStartDate,
          studyEndPeriod: applicationB.currentAssessment.offering.studyEndDate,
          coeStatus: COEStatus.required,
          fullName: getUserFullName(applicationB.student.user),
          disbursementScheduleId: applicationBFirstSchedule.id,
          disbursementDate: applicationBFirstSchedule.disbursementDate,
        });
      });
  });

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
          studyStartPeriod:
            applicationA.currentAssessment.offering.studyStartDate,
          studyEndPeriod: applicationA.currentAssessment.offering.studyEndDate,
          coeStatus: COEStatus.required,
          fullName: getUserFullName(applicationA.student.user),
          disbursementScheduleId: applicationASecondSchedule.id,
          disbursementDate: applicationASecondSchedule.disbursementDate,
        });
        expect(secondCOE).toStrictEqual({
          applicationNumber: applicationB.applicationNumber,
          applicationId: applicationB.id,
          studyStartPeriod:
            applicationB.currentAssessment.offering.studyStartDate,
          studyEndPeriod: applicationB.currentAssessment.offering.studyEndDate,
          coeStatus: COEStatus.required,
          fullName: getUserFullName(applicationB.student.user),
          disbursementScheduleId: applicationBSecondSchedule.id,
          disbursementDate: applicationBSecondSchedule.disbursementDate,
        });
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
