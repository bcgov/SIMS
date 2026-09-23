import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import { TestingModule } from "@nestjs/testing";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAccountApplication,
  createFakeUser,
  saveFakeSFASIndividual,
} from "@sims/test-utils";
import { Notification, NotificationMessageType, User } from "@sims/sims-db";
import { In, IsNull } from "typeorm";
import { faker } from "@faker-js/faker";
import { applySINNumberFormat } from "@sims/test-utils/utils";
import { StudentAccountApplicationApprovalModel } from "../../../../services/student-account-applications/student-account-applications.models";
import { UserService } from "../../../../services";

describe("StudentAccountApplicationAESTController(e2e)-approveStudentAccountApplication", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let userService: UserService;
  const TEST_SIN1 = "046454286";
  const TEST_SIN2 = "534012703";
  const BLANK_SIN = "000000000";
  const TEST_BIRTH_DATE1 = "2001-01-31";
  const TEST_BIRTH_DATE2 = "2001-01-05";
  const TEST_EMAIL = "dummy@some.domain";

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    userService = appModule.get(UserService);
    db = createE2EDataSources(dataSource);

    // Insert a fake email contact to send ministry email.
    await db.notificationMessage.update(
      { id: NotificationMessageType.PartialStudentMatchNotification },
      { emailContacts: [TEST_EMAIL] },
    );
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    await resetMockJWTUserInfo(appModule);
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

  it.only("Should approve the student account and clear the cache when a student account is requested for approval.", async () => {
    // Arrange
    const user = createFakeUser();
    // Ensure the cache is empty before creating the student.
    expect(await userService.getUserLoginInfo(user.userName)).toBeNull();
    await db.user.save(user);
    const submittedData = createFakeSubmittedData(user);
    const studentAccountApplication = await db.studentAccountApplication.save(
      createFakeStudentAccountApplication(
        { user },
        { initialValues: { submittedData } },
      ),
    );
    const endpoint = `/aest/student-account-application/${studentAccountApplication.id}/approve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const submittedDataPayload = {
      ...submittedData,
      sinNumber: applySINNumberFormat(submittedData.sinNumber),
    };
    let createdStudentId = undefined;
    // Act
    await request(app.getHttpServer())
      .post(endpoint)
      .send(submittedDataPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        createdStudentId = response.body.id;
      });
    // Assert
    const createdStudent = await db.student.findOne({
      select: {
        id: true,
        birthDate: true,
        gender: true,
        contactInfo: true,
        sinConsent: true,
        user: {
          id: true,
          userName: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        sinValidation: { sin: true },
      },
      relations: { user: true, sinValidation: true },
      where: { id: createdStudentId },
      loadEagerRelations: false,
    });
    if (!createdStudent) {
      throw new Error("Expected the student to be created.");
    }
    const latestUserInfo = await userService.getUserLoginInfo(user.userName);
    // Assert that the latest user info has the created studentId
    // and the created student matches the expected values.
    expect({ latestUserInfo, createdStudent }).toMatchObject({
      latestUserInfo: {
        id: user.id,
        studentId: createdStudentId,
      },
      createdStudent: {
        user: {
          id: user.id,
          firstName: submittedData.firstName,
          lastName: submittedData.lastName,
          email: submittedData.email,
          userName: user.userName,
        },
        birthDate: submittedData.dateOfBirth,
        gender: submittedData.gender,
        contactInfo: {
          phone: submittedData.phone,
          address: {
            addressLine1: submittedData.addressLine1,
            provinceState: submittedData.provinceState,
            country: submittedData.country,
            city: submittedData.city,
            postalCode: submittedData.postalCode,
            selectedCountry: submittedData.selectedCountry,
          },
        },
        sinConsent: submittedData.sinConsent,
        sinValidation: { sin: submittedData.sinNumber },
      },
    });
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

    const submittedDataPayload = {
      ...submittedData,
      sinNumber: applySINNumberFormat(submittedData.sinNumber),
    };
    const endpoint = `/aest/student-account-application/${studentAccountApplication.id}/approve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(submittedDataPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
      });
    // Check that the notification is in the database.
    const notification = await getPartialMatchNotification();

    expect(notification).toEqual({
      id: expect.any(Number),
      dateSent: null,
      notificationMessage: notification.notificationMessage,
      messagePayload: {
        email_address: TEST_EMAIL,
        template_id: "2108329e-7939-46a0-a8f1-bae05f7ce2a2",
        personalisation: {
          lastName: user.lastName,
          givenNames: user.firstName,
          studentEmail: user.email,
          birthDate: "Jan 31 2001",
          matches: "Last name and birth date match.",
          matchTime: expect.any(String),
        },
      },
      templateId: "c1518247-a040-4c8d-9efc-72ee64d2dcf7",
      recipients: [TEST_EMAIL],
      messageContent: {
        params: {
          lastName: user.lastName,
          givenNames: user.firstName,
          studentEmail: user.email,
          birthDate: "Jan 31 2001",
          matches: "Last name and birth date match.",
          matchTime: expect.any(String),
        },
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

    const submittedDataPayload = {
      ...submittedData,
      sinNumber: applySINNumberFormat(submittedData.sinNumber),
    };
    const endpoint = `/aest/student-account-application/${studentAccountApplication.id}/approve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(submittedDataPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
      });
    // Check that the notification is in the database.
    const notification = await getPartialMatchNotification();

    expect(notification).toEqual({
      id: expect.any(Number),
      dateSent: null,
      notificationMessage: notification.notificationMessage,
      messagePayload: {
        email_address: TEST_EMAIL,
        template_id: "2108329e-7939-46a0-a8f1-bae05f7ce2a2",
        personalisation: {
          lastName: user.lastName,
          givenNames: user.firstName,
          studentEmail: user.email,
          birthDate: "Jan 31 2001",
          matches: "Last name and SIN match.",
          matchTime: expect.any(String),
        },
      },
      templateId: "c1518247-a040-4c8d-9efc-72ee64d2dcf7",
      recipients: [TEST_EMAIL],
      messageContent: {
        params: {
          lastName: user.lastName,
          givenNames: user.firstName,
          studentEmail: user.email,
          birthDate: "Jan 31 2001",
          matches: "Last name and SIN match.",
          matchTime: expect.any(String),
        },
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
        lastName: faker.string.uuid(),
        birthDate: TEST_BIRTH_DATE1,
        sin: TEST_SIN1,
      },
    });

    const submittedDataPayload = {
      ...submittedData,
      sinNumber: applySINNumberFormat(submittedData.sinNumber),
    };
    const endpoint = `/aest/student-account-application/${studentAccountApplication.id}/approve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(submittedDataPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
      });

    // Check that the notification is in the database.
    const notification = await getPartialMatchNotification();

    expect(notification).toEqual({
      id: expect.any(Number),
      dateSent: null,
      notificationMessage: notification.notificationMessage,
      messagePayload: {
        email_address: TEST_EMAIL,
        template_id: "2108329e-7939-46a0-a8f1-bae05f7ce2a2",
        personalisation: {
          lastName: user.lastName,
          givenNames: user.firstName,
          studentEmail: user.email,
          birthDate: "Jan 31 2001",
          matches: "Birth date and SIN match.",
          matchTime: expect.any(String),
        },
      },
      templateId: "c1518247-a040-4c8d-9efc-72ee64d2dcf7",
      recipients: [TEST_EMAIL],
      messageContent: {
        params: {
          lastName: user.lastName,
          givenNames: user.firstName,
          studentEmail: user.email,
          birthDate: "Jan 31 2001",
          matches: "Birth date and SIN match.",
          matchTime: expect.any(String),
        },
      },
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  /**
   * Create and return a dictionary of testing data to use in creating a testing student account.
   * @param user user to use for populating the name and email.
   * @returns dictionary with details for creating a new student account for testing purposes.
   */
  function createFakeSubmittedData(
    user: User,
  ): StudentAccountApplicationApprovalModel & {
    mode: string;
    identityProvider: string;
    canadaPostalCode: string;
  } {
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
      postalCode: "H1H1H1",
      provinceState: "BC",
      selectedCountry: "Canada",
      canadaPostalCode: "H1H1H1",
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
        templateId: true,
        recipients: true,
        messageContent: true,
        notificationMessage: { templateId: true },
      },
      relations: { notificationMessage: true },
      where: {
        dateSent: IsNull(),
        notificationMessage: {
          id: NotificationMessageType.PartialStudentMatchNotification,
        },
      },
    });
  }
});
