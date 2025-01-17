import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAccountApplication,
  createFakeUser,
  getProviderInstanceForModule,
  saveFakeSFASIndividual,
} from "@sims/test-utils";
import { AppAESTModule } from "../../../../app.aest.module";
import { FormNames, FormService } from "../../../../services";
import { Notification, NotificationMessageType, User } from "@sims/sims-db";
import { In, IsNull } from "typeorm";
import * as faker from "faker";

describe("StudentAccountApplicationAESTController(e2e)-approveStudentAccountApplication", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedFormService: FormService;
  const TEST_SIN1 = "534012702";
  const TEST_SIN2 = "534012703";
  const BLANK_SIN = "000000000";
  const TEST_BIRTH_DATE1 = "2001-01-31";
  const TEST_BIRTH_DATE2 = "2001-01-05";
  const TEST_EMAIL = "dummy@some.domain";

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);

    sharedFormService = await getProviderInstanceForModule(
      module,
      AppAESTModule,
      FormService,
    );

    // Insert a fake email contact to send ministry email.
    await db.notificationMessage.update(
      { id: NotificationMessageType.PartialStudentMatchNotification },
      { emailContacts: [TEST_EMAIL] },
    );
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    // Ensure the SIN used for this method will not conflict.
    await db.sfasIndividual.update(
      { sin: In([TEST_SIN1, TEST_SIN2]) },
      { sin: BLANK_SIN },
    );
    await db.sinValidation.update(
      { sin: In([TEST_SIN1, TEST_SIN2]) },
      { sin: BLANK_SIN },
    );
    await db.notification.update(
      {
        dateSent: IsNull(),
        notificationMessage: {
          id: NotificationMessageType.PartialStudentMatchNotification,
        },
      },
      {
        dateSent: new Date(),
      },
    );
  });

  it("Should send a notification message when at least a partial match is found with matching last name and birth dates for importing a student record from SFAS.", async () => {
    // Arrange
    const user = await db.user.save(createFakeUser());
    const submittedData = createFakeSubmittedData(user);

    // Save the fake student account application to be later approved by the Ministry
    // and create the Student Account.
    const studentAccountApplication = await db.studentAccountApplication.save(
      createFakeStudentAccountApplication(
        { user },
        { initialValues: { submittedData } },
      ),
    );
    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: user.lastName,
        birthDate: TEST_BIRTH_DATE1,
        sin: TEST_SIN2,
      },
    });

    const endpoint = `/aest/student-account-application/${studentAccountApplication.id}/approve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Mock the form.io response.
    sharedFormService.dryRunSubmission = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.StudentProfile,
      data: { data: submittedData },
    });

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(submittedData)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
      });
    // Check that the notification is in the database.
    const notification = await getPartialMatchNotification();

    expect(notification.messagePayload).toEqual({
      email_address: TEST_EMAIL,
      template_id: expect.any(String),
      personalisation: {
        lastName: user.lastName,
        givenNames: user.firstName,
        studentEmail: user.email,
        birthDate: "Jan 31 2001",
        matches: "Last name and birth date match.",
        matchTime: expect.any(String),
      },
    });
  });

  it("Should send a notification message when at least a partial match is found with matching last name and SINs for importing a student record from SFAS.", async () => {
    // Arrange
    const user = await db.user.save(createFakeUser());
    const submittedData = createFakeSubmittedData(user);

    // Save the fake student account application to be later approved by the Ministry
    // and create the Student Account.
    const studentAccountApplication = await db.studentAccountApplication.save(
      createFakeStudentAccountApplication(
        { user },
        { initialValues: { submittedData } },
      ),
    );

    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: user.lastName,
        birthDate: TEST_BIRTH_DATE2,
        sin: TEST_SIN1,
      },
    });

    const endpoint = `/aest/student-account-application/${studentAccountApplication.id}/approve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Mock the form.io response.
    sharedFormService.dryRunSubmission = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.StudentProfile,
      data: { data: submittedData },
    });

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(submittedData)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
      });
    // Check that the notification is in the database.
    const notification = await getPartialMatchNotification();

    expect(notification.messagePayload).toEqual({
      email_address: TEST_EMAIL,
      template_id: expect.any(String),
      personalisation: {
        lastName: user.lastName,
        givenNames: user.firstName,
        studentEmail: user.email,
        birthDate: "Jan 31 2001",
        matches: "Last name and SIN match.",
        matchTime: expect.any(String),
      },
    });
  });

  it("Should send a notification message when at least a partial match is found with matching SIN and birth dates for importing a student record from SFAS.", async () => {
    // Arrange
    const user = await db.user.save(createFakeUser());
    const submittedData = createFakeSubmittedData(user);

    // Save the fake student account application to be later approved by the Ministry
    // and create the Student Account.
    const studentAccountApplication = await db.studentAccountApplication.save(
      createFakeStudentAccountApplication(
        { user },
        { initialValues: { submittedData } },
      ),
    );

    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: faker.datatype.uuid(),
        birthDate: TEST_BIRTH_DATE1,
        sin: TEST_SIN1,
      },
    });

    const endpoint = `/aest/student-account-application/${studentAccountApplication.id}/approve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Mock the form.io response.
    sharedFormService.dryRunSubmission = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.StudentProfile,
      data: { data: submittedData },
    });

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(submittedData)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
      });

    // Check that the notification is in the database.
    const notification = await getPartialMatchNotification();

    expect(notification.messagePayload).toEqual({
      email_address: TEST_EMAIL,
      template_id: expect.any(String),
      personalisation: {
        lastName: user.lastName,
        givenNames: user.firstName,
        studentEmail: user.email,
        birthDate: "Jan 31 2001",
        matches: "Birth date and SIN match.",
        matchTime: expect.any(String),
      },
    });
  });

  it("Should create disbursement overawards when an exact match is found with matching last name, birth dates and SIN for importing a student record with disbursement overawards from SFAS.", async () => {
    // Arrange
    const user = await db.user.save(createFakeUser());
    const submittedData = createFakeSubmittedData(user);

    // Save the fake student account application to be later approved by the Ministry
    // and create the Student Account.
    const studentAccountApplication = await db.studentAccountApplication.save(
      createFakeStudentAccountApplication(
        { user },
        { initialValues: { submittedData } },
      ),
    );

    const sfasIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: user.lastName,
        birthDate: submittedData.dateOfBirth,
        sin: submittedData.sinNumber,
        cslOveraward: 1000,
        bcslOveraward: 2000,
      },
    });

    const endpoint = `/aest/student-account-application/${studentAccountApplication.id}/approve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Mock the form.io response.
    sharedFormService.dryRunSubmission = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.StudentProfile,
      data: { data: submittedData },
    });

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(submittedData)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
      });

    // Check that the disbursement overawards are created.
    const disbursementOverawards = await db.disbursementOveraward.find({
      select: {
        overawardValue: true,
        originType: true,
      },
      where: {
        student: { id: sfasIndividual.student.id },
      },
    });
    expect(disbursementOverawards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          overawardValue: 1000,
          originType: "Legacy overaward",
        }),
        expect.objectContaining({
          overawardValue: 2000,
          originType: "Legacy overaward",
        }),
      ]),
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  /**
   * Create and return a dictionary of testing data to use in creating a testing student account.
   * @param user user to use for populating the name and email.
   * @returns dictionary with details for creating a new student account for testing purposes.
   */
  function createFakeSubmittedData(user: User) {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dateOfBirth: TEST_BIRTH_DATE1,
      phone: "1234567890",
      sinNumber: TEST_SIN1,
      mode: "aest-account-approval",
      identityProvider: "bceidboth",
      sinConsent: true,
      gender: "nonBinary",
      addressLine1: "address 1",
      city: "Victoria",
      country: "Canada",
      postalCode: "H1H1H1H",
      provinceState: "BC",
      selectedCountry: "canada",
      canadaPostalCode: "H1H1H1H",
    };
  }

  /**
   * Fetch the notification of a partial match from the database.
   */
  async function getPartialMatchNotification(): Promise<Notification> {
    return db.notification.findOne({
      select: {
        id: true,
        dateSent: true,
        messagePayload: true,
        notificationMessage: { templateId: true },
      },
      relations: { notificationMessage: true, user: true },
      where: {
        dateSent: IsNull(),
        notificationMessage: {
          id: NotificationMessageType.PartialStudentMatchNotification,
        },
      },
    });
  }
});
