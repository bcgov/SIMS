import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAuthRelatedEntities,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  DisbursementSchedule,
  Institution,
  InstitutionLocation,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";

describe("ConfirmationOfEnrollmentInstitutionsController(e2e)-confirmEnrollment", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let applicationRepo: Repository<Application>;
  let collegeC: Institution;
  let collegeCLocation: InstitutionLocation;
  let disbursementScheduleRepo: Repository<DisbursementSchedule>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    applicationRepo = dataSource.getRepository(Application);
    disbursementScheduleRepo = dataSource.getRepository(DisbursementSchedule);
    const locationRepo = dataSource.getRepository(InstitutionLocation);
    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeC = institution;
    await locationRepo.save(
      createFakeInstitutionLocation({ institution: collegeC }),
    );
  });

  it("Should allow the COE confirmation when COE is outside the valid COE window.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
      },
      { applicationStatus: ApplicationStatus.Enrolment },
    );
    const [firstDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    const offeringEndDate = application.currentAssessment.offering.studyEndDate;
    // Adjust the COE to be outside the window.
    firstDisbursementSchedule.disbursementDate = getISODateOnlyString(
      addDays(1, offeringEndDate),
    );
    await disbursementScheduleRepo.save(firstDisbursementSchedule);
    const endpoint = `/aest/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}/confirm`;
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK);
    // Check if the application was updated as expected.
    const updatedApplication = await applicationRepo.findOne({
      select: { applicationStatus: true },
      where: { id: application.id },
    });
    expect(updatedApplication.applicationStatus).toBe(
      ApplicationStatus.Completed,
    );
  });

  it("Should throw NotFoundException when COE doesn't have estimated awards.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
      },
      {
        applicationStatus: ApplicationStatus.Enrolment,
        firstDisbursementInitialValues: { hasEstimatedAwards: false },
      },
    );
    const [firstDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;

    const endpoint = `/aest/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}/confirm`;
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Enrolment not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
