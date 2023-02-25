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
import { createFakeInstitutionLocation } from "@sims/test-utils";
import { saveFakeApplicationCOE } from "@sims/test-utils/factories/confirmation-of-enrollment";
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
    const collegeCLocation = createFakeInstitutionLocation(collegeC);
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    // Application A
    const applicationA = await saveFakeApplicationCOE(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
      },
      { createSecondDisbursement: true },
    );
    applicationA.applicationStatus = ApplicationStatus.Enrolment;
    await applicationRepo.save(applicationA);
    const [applicationAFirstSchedule] =
      applicationA.currentAssessment.disbursementSchedules;
    // Application B
    const applicationB = await saveFakeApplicationCOE(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
      },
      { createSecondDisbursement: true },
    );
    applicationB.applicationStatus = ApplicationStatus.Enrolment;
    await applicationRepo.save(applicationB);
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

  afterAll(async () => {
    await app?.close();
  });
});
