import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeDisbursementOveraward,
  createFakeDisbursementValue,
  createFakeInstitutionLocation,
  E2EDataSources,
  saveFakeApplicationDisbursements,
  YesNoOptions,
} from "@sims/test-utils";
import { getDateOnlyFormat } from "@sims/utilities";
import { deliveryMethod, getUserFullName } from "../../../../utilities";
import { COEApprovalPeriodStatus } from "../../../../services";
import {
  ApplicationStatus,
  COEStatus,
  DisabilityStatus,
  DisbursementValueType,
  Institution,
  InstitutionLocation,
} from "@sims/sims-db";

describe("ConfirmationOfEnrollmentInstitutionsController(e2e)-getApplicationForCOE", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeC: Institution;
  let collegeCLocation: InstitutionLocation;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    db = createE2EDataSources(dataSource);

    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeC = institution;
    collegeCLocation = createFakeInstitutionLocation({ institution: collegeC });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
  });

  it("Should throw NotFoundException when COE was not found under the location", async () => {
    // Arrange
    const disbursementScheduleId = 9999;
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${disbursementScheduleId}`;
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
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
        disbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLF",
            1000,
            { disbursedAmountSubtracted: 100 },
          ),
        ],
      },
      { applicationStatus: ApplicationStatus.Enrolment },
    );
    application.data = {
      workflowName: "test",
      applicationPDPPDStatus: YesNoOptions.No,
    };
    await db.application.save(application);
    // Adjust offering values for maxTuitionRemittanceAllowed.
    application.currentAssessment.offering.actualTuitionCosts = 500;
    application.currentAssessment.offering.programRelatedCosts = 500;
    await db.educationProgramOffering.save(
      application.currentAssessment.offering,
    );
    const [firstDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    const offering = application.currentAssessment.offering;
    const program = offering.educationProgram;
    const user = application.currentAssessment.application.student.user;
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}`;
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
        applicationLocationName: collegeCLocation.name,
        applicationStatus: application.applicationStatus,
        applicationCOEStatus: COEStatus.required,
        applicationId: application.id,
        coeApprovalPeriodStatus: COEApprovalPeriodStatus.WithinApprovalPeriod,
        applicationLocationId: collegeCLocation.id,
        applicationPIRStatus: null,
        disbursementDate: firstDisbursementSchedule.disbursementDate,
        applicationProgramCredential: program.credentialType,
        applicationProgramDelivery: deliveryMethod(
          program.deliveredOnline,
          program.deliveredOnSite,
        ),
        maxTuitionRemittanceAllowed: 900,
        hasOverawardBalance: false,
        disabilityProfileStatus: DisabilityStatus.NotRequested,
        disabilityApplicationStatus: YesNoOptions.No,
      });
  });

  it("Should return hasOverawardBalance as true when there is an overaward balance on the student account", async () => {
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
    // Add a student overaward.
    const overaward = createFakeDisbursementOveraward({
      student: application.student,
      disbursementSchedule: firstDisbursementSchedule,
      studentAssessment: application.currentAssessment,
    });
    await db.disbursementOveraward.save(overaward);
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}`;
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
