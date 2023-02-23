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
  DisbursementSchedule,
  EducationProgramOffering,
  Institution,
  InstitutionLocation,
} from "@sims/sims-db";
import { COE_WINDOW } from "../../../../utilities";
import { addDays, getISODateOnlyString } from "@sims/utilities";

describe("ConfirmationOfEnrollmentInstitutionsController(e2e)-confirmEnrollment", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let applicationRepo: Repository<Application>;
  let disbursementScheduleRepo: Repository<DisbursementSchedule>;
  let offeringRepo: Repository<EducationProgramOffering>;
  let collegeC: Institution;
  let collegeCLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    applicationRepo = dataSource.getRepository(Application);
    disbursementScheduleRepo = dataSource.getRepository(DisbursementSchedule);
    offeringRepo = dataSource.getRepository(EducationProgramOffering);

    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeC = institution;
    collegeCLocation = createFakeInstitutionLocation(collegeC);
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
  });

  it("Should throw NotFoundException when application status is not valid.", async () => {
    // Arrange
    const application = await saveFakeApplicationCOE(appDataSource, {
      institution: collegeC,
      institutionLocation: collegeCLocation,
    });
    application.applicationStatus = ApplicationStatus.Assessment;
    await applicationRepo.save(application);
    const [fistDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${fistDisbursementSchedule.id}/confirm`;
    // Act/Assert
    return request(app.getHttpServer())
      .patch(endpoint)
      .send({ tuitionRemittanceAmount: 1 })
      .auth(
        await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message:
          "Confirmation of enrollment not found or application status not valid.",
        error: "Not Found",
      });
  });

  it("Should throw UnprocessableEntityException when COE is not within approval window.", async () => {
    // Arrange
    const application = await saveFakeApplicationCOE(appDataSource, {
      institution: collegeC,
      institutionLocation: collegeCLocation,
    });
    const [fistDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    const disbursementDate = addDays(COE_WINDOW + 1);
    // Adjust disbursementDate and studyEndDate to force the COE to be out of the valid COE window.
    fistDisbursementSchedule.disbursementDate =
      getISODateOnlyString(disbursementDate);
    await disbursementScheduleRepo.save(fistDisbursementSchedule);
    application.currentAssessment.offering.studyEndDate = getISODateOnlyString(
      addDays(30, disbursementDate),
    );
    await offeringRepo.save(application.currentAssessment.offering);
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${fistDisbursementSchedule.id}/confirm`;
    // Act/Assert
    return request(app.getHttpServer())
      .patch(endpoint)
      .send({ tuitionRemittanceAmount: 1 })
      .auth(
        await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: 422,
        message:
          "The enrolment cannot be confirmed as current date is not within the valid approval period.",
        error: "Unprocessable Entity",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
