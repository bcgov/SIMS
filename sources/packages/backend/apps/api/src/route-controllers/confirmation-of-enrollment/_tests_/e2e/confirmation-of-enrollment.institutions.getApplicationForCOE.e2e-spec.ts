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
  createFakeDisbursementOveraward,
  createFakeDisbursementValue,
  createFakeInstitutionLocation,
} from "@sims/test-utils";
import { saveFakeApplicationCOE } from "@sims/test-utils/factories/confirmation-of-enrollment";
import { getDateOnlyFormat } from "@sims/utilities";
import { deliveryMethod, getUserFullName } from "../../../../utilities";
import { COEApprovalPeriodStatus } from "../../../../services";
import {
  COEStatus,
  DisbursementOveraward,
  DisbursementValueType,
  EducationProgramOffering,
} from "@sims/sims-db";

describe("ConfirmationOfEnrollmentInstitutionsController(e2e)-getApplicationForCOE", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;
  let offeringRepo: Repository<EducationProgramOffering>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
    offeringRepo = dataSource.getRepository(EducationProgramOffering);
  });

  it("Should throw NotFoundException when COE was not found under the location", async () => {
    // Arrange
    const disbursementScheduleId = 9999;
    const location = createFakeInstitutionLocation();
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      location,
    );
    const endpoint = `/institutions/location/${location.id}/confirmation-of-enrollment/disbursement-schedule/${disbursementScheduleId}`;
    // Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
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

  it("Should get the COE with calculated maxTuitionRemittanceAllowed when the COE exists under the location", async () => {
    // Arrange
    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    const institutionLocation = createFakeInstitutionLocation();
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      institutionLocation,
    );
    const application = await saveFakeApplicationCOE(appDataSource, {
      institution,
      institutionLocation,
      disbursementValues: [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLF",
          1000,
          { disbursedAmountSubtracted: 100 },
        ),
      ],
    });
    // Adjust offering values for maxTuitionRemittanceAllowed.
    application.currentAssessment.offering.actualTuitionCosts = 500;
    application.currentAssessment.offering.programRelatedCosts = 500;
    await offeringRepo.save(application.currentAssessment.offering);
    const [fistDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    const offering = application.currentAssessment.offering;
    const program = offering.educationProgram;
    const user = application.currentAssessment.application.student.user;
    const endpoint = `/institutions/location/${institutionLocation.id}/confirmation-of-enrollment/disbursement-schedule/${fistDisbursementSchedule.id}`;
    // Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect({
        applicationProgramName: program.name,
        applicationProgramDescription: program.description,
        applicationOfferingName: offering.name,
        applicationOfferingIntensity: offering.offeringIntensity,
        applicationOfferingStartDate: getDateOnlyFormat(
          offering.studyStartDate,
        ),
        applicationOfferingEndDate: getDateOnlyFormat(offering.studyEndDate),
        applicationOfferingHasStudyBreak: offering.lacksStudyBreaks,
        applicationOfferingActualTuition: offering.actualTuitionCosts,
        applicationOfferingProgramRelatedCost: offering.programRelatedCosts,
        applicationOfferingMandatoryCost: offering.mandatoryFees,
        applicationOfferingExceptionalExpenses: offering.exceptionalExpenses,
        applicationOfferingStudyDelivered: offering.offeringDelivered,
        applicationStudentName: getUserFullName(user),
        applicationNumber: application.applicationNumber,
        applicationLocationName: institutionLocation.name,
        applicationStatus: application.applicationStatus,
        applicationCOEStatus: COEStatus.required,
        applicationId: application.id,
        coeApprovalPeriodStatus: COEApprovalPeriodStatus.WithinApprovalPeriod,
        applicationLocationId: institutionLocation.id,
        applicationPIRStatus: null,
        disbursementDate: fistDisbursementSchedule.disbursementDate,
        applicationProgramCredential: program.credentialType,
        applicationProgramDelivery: deliveryMethod(
          program.deliveredOnline,
          program.deliveredOnSite,
        ),
        maxTuitionRemittanceAllowed: 900,
        hasOverawardBalance: false,
      });
  });

  it("Should return hasOverawardBalance as true when there is an overaward balance on the student account", async () => {
    // Arrange
    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    const institutionLocation = createFakeInstitutionLocation();
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      institutionLocation,
    );
    const application = await saveFakeApplicationCOE(appDataSource, {
      institution,
      institutionLocation,
    });
    const [fistDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    // Add a student overaward.
    const overaward = createFakeDisbursementOveraward({
      student: application.student,
      disbursementSchedule: fistDisbursementSchedule,
      studentAssessment: application.currentAssessment,
    });
    await disbursementOverawardRepo.save(overaward);
    const endpoint = `/institutions/location/${institutionLocation.id}/confirmation-of-enrollment/disbursement-schedule/${fistDisbursementSchedule.id}`;
    // Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.hasOverawardBalance).toBe(true);
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
