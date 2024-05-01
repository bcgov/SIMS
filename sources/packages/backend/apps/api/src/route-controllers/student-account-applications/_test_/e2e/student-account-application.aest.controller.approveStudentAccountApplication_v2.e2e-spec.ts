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
} from "@sims/test-utils";
import { AppAESTModule } from "../../../../app.aest.module";
import { FormNames, FormService } from "../../../../services";

// TODO: To be removed before
jest.setTimeout(120000);

describe("StudentAccountApplicationAESTController(e2e)-approveStudentAccountApplication", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedFormService: FormService;

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
  });

  beforeEach(() => {
    jest.resetAllMocks();
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
      sinNumber: "534012687",
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
    // TODO: user saveFakeSFASIndividual to add partial student matches to the SFAS table.
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
    // TODO: execute the asserts.
  });

  afterAll(async () => {
    await app?.close();
  });
});
