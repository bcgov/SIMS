import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
} from "../../../../testHelpers";
import { FormCategory } from "@sims/sims-db";

describe("FormSubmissionStudentsController(e2e)-getSubmissionForms", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { nestApplication } = await createTestingAppModule();
    app = nestApplication;
  });

  it(`Should get form configurations for ${FormCategory.StudentForm} and ${FormCategory.StudentAppeal} when the endpoint is invoked.`, async () => {
    // Arrange
    const endpoint = "/students/form-submission/forms";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        configurations: [
          {
            id: 27,
            formDefinitionName: "modifiedindependentappeal",
            formType: "Modified independent",
            formCategory: "Student appeal",
            formDescription:
              "Submit this appeal to change your classification from a dependent student to an independent student based on exceptional circumstances.",
            allowBundledSubmission: false,
            hasApplicationScope: false,
          },
          {
            id: 28,
            formDefinitionName: "nonpunitivewithdrawalform",
            formType: "Non-punitive withdrawal",
            formCategory: "Student form",
            formDescription:
              "Submit this form to request the modification of your withdrawal to a non-punitive withdrawal.",
            allowBundledSubmission: false,
            hasApplicationScope: false,
          },
          {
            id: 25,
            formDefinitionName: "roomandboardcostsappeal",
            formType: "Room and board costs",
            formCategory: "Student appeal",
            formDescription:
              "Submit this appeal if, due to exceptional circumstances, your parents, step-parents, or legal guardian are unable to provide the expected free room and board while you reside in their home.",
            allowBundledSubmission: true,
            hasApplicationScope: true,
          },
          {
            id: 26,
            formDefinitionName: "stepparentwaiverappeal",
            formType: "Step-parent waiver",
            formCategory: "Student appeal",
            formDescription:
              "Submit this appeal to waive your step-parent's fixed contribution if your parent has had a recent (within the past five years) marriage or common-law relationship with a step-parent, where the step-parent has not assumed financial responsibility for you and does not claim you as a dependent on their taxes.",
            allowBundledSubmission: true,
            hasApplicationScope: true,
          },
        ],
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
