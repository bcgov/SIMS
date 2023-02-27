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
import { createFakeInstitutionLocation } from "@sims/test-utils";
import { saveFakeApplicationCOE } from "@sims/test-utils/factories/confirmation-of-enrollment";
import {
  Application,
  ApplicationStatus,
  Institution,
  InstitutionLocation,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { ClientTypeBaseRoute } from "../../../../types";

describe(`${ClientTypeBaseRoute.AEST}-ConfirmationOfEnrollmentInstitutionsController(e2e)-confirmEnrollment`, () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let applicationRepo: Repository<Application>;
  let collegeC: Institution;
  let collegeCLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    applicationRepo = dataSource.getRepository(Application);
    const locationRepo = dataSource.getRepository(InstitutionLocation);
    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeC = institution;
    await locationRepo.save(createFakeInstitutionLocation(collegeC));
  });

  it("Should allow the COE confirmation when COE is outside the valid COE window.", async () => {
    // Arrange
    const application = await saveFakeApplicationCOE(appDataSource, {
      institution: collegeC,
      institutionLocation: collegeCLocation,
    });
    const [fistDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    const offeringEndDate = application.currentAssessment.offering.studyEndDate;
    // Adjust the COE to be outside the window.
    fistDisbursementSchedule.disbursementDate = getISODateOnlyString(
      addDays(1, offeringEndDate),
    );
    const endpoint = `/aest/confirmation-of-enrollment/disbursement-schedule/${fistDisbursementSchedule.id}/confirm`;
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

  afterAll(async () => {
    await app?.close();
  });
});
