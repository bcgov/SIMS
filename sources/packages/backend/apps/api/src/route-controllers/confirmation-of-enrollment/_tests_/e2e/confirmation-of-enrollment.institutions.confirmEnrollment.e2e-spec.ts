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
  createFakeDisbursementValue,
  createFakeInstitutionLocation,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  DisbursementValueType,
  EducationProgramOffering,
  Institution,
  InstitutionLocation,
  OfferingIntensity,
  SequenceControl,
} from "@sims/sims-db";
import { MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE } from "../../../../utilities";
import { COE_WINDOW, addDays, getISODateOnlyString } from "@sims/utilities";

describe("ConfirmationOfEnrollmentInstitutionsController(e2e)-confirmEnrollment", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let applicationRepo: Repository<Application>;
  let disbursementScheduleRepo: Repository<DisbursementSchedule>;
  let offeringRepo: Repository<EducationProgramOffering>;
  let collegeC: Institution;
  let collegeCLocation: InstitutionLocation;
  let sequenceControlRepo: Repository<SequenceControl>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    applicationRepo = dataSource.getRepository(Application);
    disbursementScheduleRepo = dataSource.getRepository(DisbursementSchedule);
    offeringRepo = dataSource.getRepository(EducationProgramOffering);
    sequenceControlRepo = dataSource.getRepository(SequenceControl);

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

  it("Should allow the COE confirmation when the application is on Enrolment status and all the conditions are fulfilled.", async () => {
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
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}/confirm`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ tuitionRemittanceAmount: 1 })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Check if the application was updated as expected.
    const updatedApplication = await applicationRepo.findOne({
      select: { applicationStatus: true },
      where: { id: application.id },
    });
    expect(updatedApplication.applicationStatus).toBe(
      ApplicationStatus.Completed,
    );

    // Assert that the sequence control record was created correctly.
    const sequenceControl = await sequenceControlRepo.exists({
      where: {
        sequenceName: "Full Time_DISBURSEMENT_DOCUMENT_NUMBER",
        sequenceNumber: firstDisbursementSchedule.documentNumber.toString(),
      },
    });
    expect(sequenceControl).toBeDefined();
  });

  it("Should allow the COE confirmation when the application is on Enrolment status and all the conditions are fulfilled for part-time offering.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
      },
      {
        applicationStatus: ApplicationStatus.Enrolment,
        offeringIntensity: OfferingIntensity.partTime,
      },
    );
    const [firstDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}/confirm`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ tuitionRemittanceAmount: 1 })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Check if the application was updated as expected.
    const updatedApplication = await applicationRepo.findOne({
      select: { applicationStatus: true },
      where: { id: application.id },
    });
    expect(updatedApplication.applicationStatus).toBe(
      ApplicationStatus.Completed,
    );
    // Assert that the sequence control record was created correctly.
    const sequenceControl = await sequenceControlRepo.exists({
      where: {
        sequenceName: "Part Time_DISBURSEMENT_DOCUMENT_NUMBER",
        sequenceNumber: firstDisbursementSchedule.documentNumber.toString(),
      },
    });
    expect(sequenceControl).toBeDefined();
  });

  it("Should allow the second COE confirmation when the application is on Completed status and all the conditions are fulfilled.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
      },
      {
        applicationStatus: ApplicationStatus.Completed,
        createSecondDisbursement: true,
      },
    );
    const [, secondDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    // Adjust the second disbursement to be in a valid COE window to be confirmed.
    secondDisbursementSchedule.disbursementDate = getISODateOnlyString(
      new Date(),
    );
    await disbursementScheduleRepo.save(secondDisbursementSchedule);
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${secondDisbursementSchedule.id}/confirm`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ tuitionRemittanceAmount: 0 })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Check if the disbursement was updated as expected.
    const updatedDisbursementSchedule = await disbursementScheduleRepo.findOne({
      select: { coeStatus: true },
      where: { id: secondDisbursementSchedule.id },
    });
    expect(updatedDisbursementSchedule.coeStatus).toBe(COEStatus.completed);
  });

  it("Should throw Unprocessable Entity when application status is not valid.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
      },
      { applicationStatus: ApplicationStatus.Assessment },
    );
    const [firstDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}/confirm`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    // Act/Assert
    return request(app.getHttpServer())
      .patch(endpoint)
      .send({ tuitionRemittanceAmount: 1 })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: 422,
        message:
          "Enrolment cannot be confirmed as application is not in a valid status.",
        error: "Unprocessable Entity",
      });
  });

  it("Should throw UnprocessableEntityException when COE is not within approval window.", async () => {
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
    const disbursementDate = addDays(COE_WINDOW + 1);
    // Adjust disbursementDate and studyEndDate to force the COE to be out of the valid COE window.
    firstDisbursementSchedule.disbursementDate =
      getISODateOnlyString(disbursementDate);
    await disbursementScheduleRepo.save(firstDisbursementSchedule);
    application.currentAssessment.offering.studyEndDate = getISODateOnlyString(
      addDays(30, disbursementDate),
    );
    await offeringRepo.save(application.currentAssessment.offering);
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}/confirm`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    // Act/Assert
    return request(app.getHttpServer())
      .patch(endpoint)
      .send({ tuitionRemittanceAmount: 1 })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: 422,
        message:
          "The enrolment cannot be confirmed as enrolment confirmation date is not within the valid approval period.",
        error: "Unprocessable Entity",
      });
  });

  it("Should throw BadRequestException when the tuitionRemittanceAmount is negative.", async () => {
    // Arrange
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/9999/confirm`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    // Act/Assert
    return request(app.getHttpServer())
      .patch(endpoint)
      .send({ tuitionRemittanceAmount: -1 })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: 400,
        message: ["tuitionRemittanceAmount must not be less than 0"],
        error: "Bad Request",
      });
  });

  it("Should throw BadRequestException when the tuitionRemittanceAmount is over the limit.", async () => {
    // Arrange
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/9999/confirm`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    // Act/Assert
    return request(app.getHttpServer())
      .patch(endpoint)
      .send({ tuitionRemittanceAmount: MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE + 1 })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: 400,
        message: [
          `tuitionRemittanceAmount must not be greater than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE}`,
        ],
        error: "Bad Request",
      });
  });

  it("Should throw an UnprocessableEntityException when trying to confirm the second COE before confirming the first one.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
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
    const [, secondDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    // Change the second schedule to be available to be approved inside the COE window
    // to force the validation of the "first COE confirmation before the second".
    secondDisbursementSchedule.disbursementDate = getISODateOnlyString(
      addDays(COE_WINDOW - 1),
    );
    await disbursementScheduleRepo.save(secondDisbursementSchedule);
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${secondDisbursementSchedule.id}/confirm`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    // Act/Assert
    return request(app.getHttpServer())
      .patch(endpoint)
      .send({ tuitionRemittanceAmount: 1 })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "First disbursement(COE) not complete. Please complete the first disbursement.",
        errorType: "FIRST_COE_NOT_COMPLETE",
      });
  });

  it("Should throw an exception when the maxTuitionRemittance if over the limit.", async () => {
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
          ),
        ],
      },
      { applicationStatus: ApplicationStatus.Enrolment },
    );
    const [firstDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    // Adjust offering values for maxTuitionRemittanceAllowed.
    application.currentAssessment.offering.actualTuitionCosts = 500;
    application.currentAssessment.offering.programRelatedCosts = 500;
    application.currentAssessment.offering.mandatoryFees = 100;
    await offeringRepo.save(application.currentAssessment.offering);
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}/confirm`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    // Act/Assert
    return request(app.getHttpServer())
      .patch(endpoint)
      .send({ tuitionRemittanceAmount: 1001 })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Tuition amount provided should be lesser than both (Actual tuition + Program related costs + Mandatory fees - Previous tuition remittance) and (Canada grants + Canada Loan + BC Loan).",
        errorType: "INVALID_TUITION_REMITTANCE_AMOUNT",
      });
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
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}/confirm`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    // Act/Assert
    return request(app.getHttpServer())
      .patch(endpoint)
      .send({ tuitionRemittanceAmount: 1 })
      .auth(token, BEARER_AUTH_TYPE)
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
