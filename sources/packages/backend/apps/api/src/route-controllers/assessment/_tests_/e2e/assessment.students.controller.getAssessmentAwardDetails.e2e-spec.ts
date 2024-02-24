import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import {
  saveFakeApplicationDisbursements,
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
  createFakeDisbursementValue,
  MSFAAStates,
  createFakeMSFAANumber,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  DisbursementValueType,
  OfferingIntensity,
} from "@sims/sims-db";
import { TestingModule } from "@nestjs/testing";

describe("AssessmentStudentsController(e2e)-getAssessmentAwardDetails", () => {
  let appModule: TestingModule;
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    appModule = module;
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get the student assessment summary containing loan and all grants for an part-time application.", async () => {
    // Create the student to be shared across the applications.
    const student = await saveFakeStudent(db.dataSource);
    mockUserLoginInfo(appModule, student);
    // Valid MSFAA Number.
    const msfaaNumber = await db.msfaaNumber.save(
      createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
    );
    // Past part-time application with federal and provincial loans and grants.
    // Loans will be ignored.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
        msfaaNumber,
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLP",
            111,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGP",
            222,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSPT",
            333,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGD",
            444,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCAG",
            555,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "SBSD",
            666,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCSG",
            777,
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );

    const endpoint = `/students/assessment/${application.currentAssessment.id}/award`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      // TODO: Validate result, create receipts record, validate receipts.
      .expect({
        applicationNumber: "7560682449",
        applicationStatus: "Completed",
        institutionName: "Inc",
        offeringIntensity: "Part Time",
        offeringStudyStartDate: "Feb 23 2024",
        offeringStudyEndDate: "Mar 06 2024",
        estimatedAward: {
          disbursement1Date: "Feb 24 2024",
          disbursement1Status: "Pending",
          disbursement1COEStatus: "Completed",
          disbursement1MSFAANumber: "XXXXXXXXXX",
          disbursement1MSFAAId: 45256,
          disbursement1MSFAACancelledDate: null,
          disbursement1MSFAADateSigned: "2024-02-24",
          disbursement1TuitionRemittance: 0,
          disbursement1Id: 56661,
          disbursement1cslp: 111,
          disbursement1csgd: 444,
          disbursement1csgp: 222,
          disbursement1cspt: 333,
          disbursement1bcag: 555,
          disbursement1bcsg: 777,
          disbursement1sbsd: 666,
        },
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
