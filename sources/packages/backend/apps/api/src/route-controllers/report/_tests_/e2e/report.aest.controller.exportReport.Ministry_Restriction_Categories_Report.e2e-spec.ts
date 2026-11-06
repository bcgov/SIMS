import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeRestriction,
  saveFakeInstitutionRestriction,
  saveFakeStudent,
  saveFakeStudentRestriction,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { parse } from "papaparse";
import request from "supertest";
import {
  RestrictionActionType,
  RestrictionNotificationType,
  RestrictionType,
} from "@sims/sims-db";

describe("ReportAESTController(e2e)-exportReport(Ministry_Restriction_Categories_Report)", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  const endpoint = "/aest/report";
  const payload = {
    reportName: "Ministry_Restriction_Categories_Report",
    params: {},
  };

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should generate a report with all the existing restrictions ordered by restriction code when the report is requested.", async () => {
    // Arrange
    const restrictions = await db.restriction.find({
      select: {
        id: true,
        restrictionCode: true,
        restrictionType: true,
        restrictionCategory: true,
        description: true,
        actionType: true,
        notificationType: true,
      },
      order: { restrictionCode: "ASC", id: "ASC" },
    });
    const ministryUserToken = await getAESTToken(
      AESTGroups.BusinessAdministrators,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(ministryUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        const fileContent = response.request.res["text"];
        const parsedResult = parse<Record<string, string>>(fileContent, {
          header: true,
        });
        // Other tests running in parallel can create restrictions between the restrictions
        // query and the report request. Only the report records for the queried restrictions
        // are asserted, which still validates their content and order.
        const restrictionCodes = new Set(
          restrictions.map((restriction) => restriction.restrictionCode),
        );
        const reportRecords = parsedResult.data.filter((record) =>
          restrictionCodes.has(record.Code),
        );
        // Active counts depend on data created by other tests, hence only the numeric format is asserted.
        expect(reportRecords).toEqual(
          restrictions.map((restriction) => ({
            Code: restriction.restrictionCode,
            Description: restriction.description,
            "Restriction Type": restriction.restrictionType,
            Category: restriction.restrictionCategory,
            "Action Type": restriction.actionType.join(", "),
            "Notification Type": restriction.notificationType,
            "Active Count": expect.stringMatching(/^\d+$/),
          })),
        );
        // Assert one restriction explicitly to validate the multiple action types formatting.
        expect(parsedResult.data).toContainEqual({
          Code: "SCV",
          Description: "Funding blocked for student compliance verification.",
          "Restriction Type": RestrictionType.Provincial,
          Category: "Verification",
          "Action Type": `${RestrictionActionType.StopFullTimeDisbursement}, ${RestrictionActionType.StopPartTimeDisbursement}`,
          "Notification Type": RestrictionNotificationType.Error,
          "Active Count": expect.stringMatching(/^\d+$/),
        });
      });
  });

  it("Should count only the active restrictions in the active count when restrictions are assigned to students and institutions.", async () => {
    // Arrange
    const ministryUserToken = await getAESTToken(
      AESTGroups.BusinessAdministrators,
    );
    // Restrictions created only for this test to ensure the counts are not affected by other tests.
    const [studentRestriction, institutionRestriction] =
      await db.restriction.save([
        createFakeRestriction(),
        createFakeRestriction({
          initialValues: { restrictionType: RestrictionType.Institution },
        }),
      ]);
    const student = await saveFakeStudent(db.dataSource);
    // Each restriction has one active record that must be counted
    // and one inactive record that must not be counted.
    await Promise.all([
      saveFakeStudentRestriction(db.dataSource, {
        student,
        restriction: studentRestriction,
      }),
      saveFakeStudentRestriction(
        db.dataSource,
        { student, restriction: studentRestriction },
        { isActive: false },
      ),
      saveFakeInstitutionRestriction(db, {
        restriction: institutionRestriction,
      }),
      saveFakeInstitutionRestriction(
        db,
        { restriction: institutionRestriction },
        { initialValues: { isActive: false } },
      ),
    ]);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(ministryUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        const fileContent = response.request.res["text"];
        const parsedResult = parse<Record<string, string>>(fileContent, {
          header: true,
        });
        const studentRestrictionRecord = parsedResult.data.find(
          (record) => record.Code === studentRestriction.restrictionCode,
        );
        const institutionRestrictionRecord = parsedResult.data.find(
          (record) => record.Code === institutionRestriction.restrictionCode,
        );
        expect(studentRestrictionRecord["Active Count"]).toBe("1");
        expect(institutionRestrictionRecord["Active Count"]).toBe("1");
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
