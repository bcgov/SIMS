import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import { FormCategory, ModifiedIndependentStatus } from "@sims/sims-db";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { FormNames } from "../../../../services";
import { FormSubmissionBlockedReason } from "../../models/form-submission.dto";

describe("FormSubmissionStudentsController(e2e)-getSubmissionForms", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
  });

  beforeEach(() => {
    resetMockJWTUserInfo(appModule);
  });

  it(`Should get form configurations for ${FormCategory.StudentForm} and ${FormCategory.StudentAppeal} when the endpoint is invoked.`, async () => {
    // Arrange
    const endpoint = getEndpoint();
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body.configurations).toEqual(
          expect.arrayContaining(getExpectedConfigurations()),
        ),
      );
  });

  it(`Should get a blocked ${FormNames.ModifiedIndependentAppeal} when the student has already been approved for modified independent status.`, async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource, undefined, {
      initialValue: {
        modifiedIndependentStatus: ModifiedIndependentStatus.Approved,
      },
    });

    const endpoint = getEndpoint();
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body.configurations).toEqual(
          expect.arrayContaining(
            getExpectedConfigurations(
              FormSubmissionBlockedReason.ModifiedIndependentStatusAlreadyApproved,
            ),
          ),
        ),
      );
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the endpoint to fetch student form submission forms.
 * @returns The endpoint URL for fetching student form submission forms.
 */
function getEndpoint(): string {
  return "/students/form-submission/forms";
}

/**
 * Gets the expected form configurations for the student form submission forms.
 * @param miaBlockedReason The blocked reason for the Modified Independent Appeal form, if applicable.
 * @returns An array of expected form configurations for the student form submission forms.
 */
function getExpectedConfigurations(
  miaBlockedReason?: FormSubmissionBlockedReason,
): unknown[] {
  return [
    {
      id: expect.any(Number),
      formDefinitionName: "studentexceptionalexpenseappeal",
      formType: "Exceptional expense",
      formCategory: "Student appeal",
      formDescription:
        "If you have had exceptional expenses that created financial hardship that affected your ability to start or continue your studies these expenses may be considered AS part of your assessment.",
      allowBundledSubmission: true,
      hasApplicationScope: true,
    },
    {
      id: expect.any(Number),
      formDefinitionName: "modifiedindependentappeal",
      formType: "Modified independent",
      formCategory: "Student appeal",
      formDescription:
        "Submit this appeal to change your classification from a dependent student to an independent student based on exceptional circumstances.",
      allowBundledSubmission: false,
      hasApplicationScope: false,
      blockedReason: miaBlockedReason,
    },
    {
      id: expect.any(Number),
      formDefinitionName: "nonpunitivewithdrawalform",
      formType: "Non-punitive withdrawal",
      formCategory: "Student form",
      formDescription:
        "Submit this form to request the modification of your withdrawal to a non-punitive withdrawal.",
      allowBundledSubmission: false,
      hasApplicationScope: false,
    },
    {
      id: expect.any(Number),
      formDefinitionName: "partnercurrentyearincomeappeal",
      formType: "Spouse/common-law partner current year income",
      formCategory: "Student appeal",
      formDescription:
        "If your spouse/common-law partner has had, or is anticipated to have, a significant decrease in gross income, you may submit this appeal to request assessment using their current year estimated gross income.",
      allowBundledSubmission: true,
      hasApplicationScope: true,
    },
    {
      id: expect.any(Number),
      formDefinitionName: "roomandboardcostsappeal",
      formType: "Room and board costs",
      formCategory: "Student appeal",
      formDescription:
        "Submit this appeal if, due to exceptional circumstances, your parents, step-parents, or legal guardian are unable to provide the expected free room and board while you reside in their home.",
      allowBundledSubmission: true,
      hasApplicationScope: true,
    },
    {
      id: expect.any(Number),
      formDefinitionName: "stepparentwaiverappeal",
      formType: "Step-parent waiver",
      formCategory: "Student appeal",
      formDescription:
        "Submit this appeal to waive your step-parent's fixed contribution if your parent has had a recent (within the past five years) marriage or common-law relationship with a step-parent, where the step-parent has not assumed financial responsibility for you and does not claim you as a dependent on their taxes.",
      allowBundledSubmission: true,
      hasApplicationScope: true,
    },
    {
      id: expect.any(Number),
      formDefinitionName: "studentcurrentyearincomeappeal",
      formType: "Student current year income",
      formCategory: "Student appeal",
      formDescription:
        "Submit this appeal to provide your current year income information if you have experienced a significant change in your financial circumstances since you submitted your Student Financial Aid Application.",
      allowBundledSubmission: true,
      hasApplicationScope: true,
    },
  ];
}
