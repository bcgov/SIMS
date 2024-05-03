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
import { NotificationMessageType } from "@sims/sims-db";
import { In, IsNull } from "typeorm";

describe("StudentAccountApplicationAESTController(e2e)-approveStudentAccountApplication", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedFormService: FormService;
  const testSIN1 = "534012702";
  const testSIN2 = "534012703";
  const blankSIN = "000000000";

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
      { emailContacts: ["dummy@some.domain"] },
    );
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    // Ensure the SIN used for this method will not conflict.
    await db.sfasIndividual.update(
      { sin: In([testSIN1, testSIN2]) },
      { sin: blankSIN },
    );
    await db.sinValidation.update(
      { sin: In([testSIN1, testSIN2]) },
      { sin: blankSIN },
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

  it("Should send a notification message when at least a partial match is found for importing a student record from SFAS.", async () => {
    // Arrange
    const user = await db.user.save(createFakeUser());
    // Submitted data to simulated the exists student account already saved on DB.
    // Same data will be used to be submitted when Ministry is approving it.
    const submittedData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dateOfBirth: "2001-01-31",
      phone: "1234567890",
      sinNumber: "534012702",
      mode: "aest-account-approval",
      identityProvider: "bceidboth",
      sinConsent: true,
      gender: "X",
      addressLine1: "address 1",
      city: "Victoria",
      country: "Canada",
      postalCode: "H1H1H1H",
      provinceState: "BC",
      selectedCountry: "canada",
      canadaPostalCode: "H1H1H1H",
    };
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
        birthDate: "2001-01-31",
        sin: "534012703",
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
    const notification = await db.notification.findOne({
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
    expect(notification.messagePayload["email_address"]).toEqual(
      "dummy@some.domain",
    );
    expect(notification.messagePayload["personalisation"]["lastName"]).toEqual(
      user.lastName,
    );
    expect(
      notification.messagePayload["personalisation"]["givenNames"],
    ).toEqual(user.firstName);
    expect(
      notification.messagePayload["personalisation"]["studentEmail"],
    ).toEqual(user.email);
    expect(notification.messagePayload["personalisation"]["dob"]).toEqual(
      "Jan 31 2001",
    );
    expect(notification.messagePayload["personalisation"]["matches"]).toEqual(
      "Last name and birth date match.",
    );
  });

  afterAll(async () => {
    await app?.close();
  });
});
