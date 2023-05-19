import {
  ApplicationStatus,
  AssessmentTriggerType,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValueType,
} from "@sims/sims-db";
import {
  createE2EDataSources,
  createFakeApplication,
  createFakeDisbursementOveraward,
  createFakeEducationProgramOffering,
  createFakeStudent,
  createFakeStudentAssessment,
  createFakeUser,
  E2EDataSources,
} from "@sims/test-utils";
import { createFakeDisbursementSchedule } from "@sims/test-utils/factories/disbursement-schedule";
import { createFakeDisbursementValue } from "@sims/test-utils/factories/disbursement-value";
import { createFakeSaveDisbursementSchedulesPayload } from "./save-disbursement-schedules-payloads";
import { DisbursementController } from "../../disbursement.controller";
import {
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../testHelpers";

describe("DisbursementController(e2e)-saveDisbursementSchedules", () => {
  let db: E2EDataSources;
  let disbursementController: DisbursementController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    await nestApplication.init();
    db = createE2EDataSources(dataSource);
    disbursementController = nestApplication.get(DisbursementController);
  });

  it("Should generate an overaward when a reassessment happens and the student is entitled to less money", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    const savedStudent = await db.student.save(createFakeStudent(savedUser));
    const fakeApplication = createFakeApplication({ student: savedStudent });
    fakeApplication.applicationNumber = "OA_TEST001";
    const savedApplication = await db.application.save(fakeApplication);
    // Original assessment.
    const fakeOriginalAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
    });
    fakeOriginalAssessment.application = savedApplication;
    // Original assessment - first disbursement (Sent).
    const firstSchedule = createFakeDisbursementSchedule({
      auditUser: savedUser,
      disbursementValues: [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLF",
          1250,
          { effectiveAmount: 1250 },
        ),
        createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 800, {
          disbursedAmountSubtracted: 50,
          effectiveAmount: 750,
        }),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          1500,
          { effectiveAmount: 1500 },
        ),
      ],
    });
    firstSchedule.disbursementScheduleStatus = DisbursementScheduleStatus.Sent;
    // Original assessment - second disbursement (Pending).
    const secondSchedule = createFakeDisbursementSchedule({
      auditUser: savedUser,
      disbursementValues: [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSLF",
          1000,
        ),
        createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 500),
      ],
    });
    secondSchedule.disbursementScheduleStatus =
      DisbursementScheduleStatus.Pending;
    fakeOriginalAssessment.disbursementSchedules = [
      firstSchedule,
      secondSchedule,
    ];
    // Reassessment.
    const savedOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering({ auditUser: savedUser }),
    );
    const fakeReassessment = createFakeStudentAssessment({
      auditUser: savedUser,
      offering: savedOffering,
    });
    fakeReassessment.triggerType = AssessmentTriggerType.OfferingChange;
    fakeReassessment.application = savedApplication;
    const [savedOriginalAssessment, savedReassessment] =
      await db.studentAssessment.save([
        fakeOriginalAssessment,
        fakeReassessment,
      ]);
    savedApplication.currentAssessment = fakeReassessment;
    savedApplication.applicationStatus = ApplicationStatus.Completed;
    await db.application.save(savedApplication);

    const fakeOverawardForSameApplication = createFakeDisbursementOveraward();
    fakeOverawardForSameApplication.student = savedStudent;
    fakeOverawardForSameApplication.studentAssessment = savedOriginalAssessment;
    fakeOverawardForSameApplication.originType =
      DisbursementOverawardOriginType.ReassessmentOveraward;
    const preExistingOveraward = await db.disbursementOveraward.save(
      fakeOverawardForSameApplication,
    );

    // Act
    const saveDisbursementSchedulesPayload =
      createFakeSaveDisbursementSchedulesPayload(savedReassessment.id);
    const saveResult = await disbursementController.saveDisbursementSchedules(
      saveDisbursementSchedulesPayload,
    );

    // Asserts
    expect(saveResult).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    // Assert overawards for the same application were deleted.
    // Deleted means deletedAt has a value defined.
    const softDeletedPreExistingOveraward =
      await db.disbursementOveraward.findOne({
        select: {
          id: true,
          deletedAt: true,
        },
        where: {
          id: preExistingOveraward.id,
        },
        withDeleted: true,
      });
    expect(softDeletedPreExistingOveraward).toBeDefined();
    expect(softDeletedPreExistingOveraward.deletedAt).toBeTruthy();

    const createdDisbursements = await db.disbursementSchedule.find({
      relations: {
        disbursementValues: true,
      },
      where: {
        studentAssessment: { id: savedReassessment.id },
      },
    });
    // Assert disbursement already paid subtracted.
    expect(createdDisbursements).toBeDefined();
    expect(createdDisbursements).toHaveLength(2);
    const [firstDisbursement, secondDisbursement] = createdDisbursements;
    // Assert firstDisbursement.
    // For Canada Loan there will be an overaward of 250 that should not be created
    // because there is a constraint to create overawards for student only if the debt
    // is greater than 250.
    assertAwardDeduction(firstDisbursement, DisbursementValueType.CanadaLoan, {
      valueAmount: 1000,
      disbursedAmountSubtracted: 1000,
    });
    assertAwardDeduction(firstDisbursement, DisbursementValueType.BCLoan, {
      valueAmount: 250,
      disbursedAmountSubtracted: 250,
    });
    // Assert secondDisbursement.
    assertAwardDeduction(secondDisbursement, DisbursementValueType.BCLoan, {
      valueAmount: 350,
      disbursedAmountSubtracted: 350,
    });
    // Grants do not generate overaward. The the Canada grant CSGP got 1500 already
    // disbursed value so the student already received $300 extra. For this case the
    // student will not receive the money for the grant but will no be charged either
    // for the $300 already received.
    assertAwardDeduction(
      secondDisbursement,
      DisbursementValueType.CanadaGrant,
      {
        valueAmount: 1200,
        disbursedAmountSubtracted: 1200,
      },
    );

    // Overaward asserts
    const overawards = await db.disbursementOveraward.find({
      where: { student: { id: savedStudent.id } },
    });
    // Assert overaward not created for grants.
    const grantOveraward = overawards.find(
      (overaward) => overaward.disbursementValueCode === "CSGP",
    );
    expect(grantOveraward).toBeUndefined();
    // Assert overaward creation.
    assertOveraward(overawards, "BCSL", 150);
  });

  async function assertAwardDeduction(
    createdDisbursement: DisbursementSchedule,
    valueType: DisbursementValueType,
    assertValues: {
      valueAmount: number;
      disbursedAmountSubtracted?: number;
    },
  ) {
    const award = createdDisbursement.disbursementValues.find(
      (scheduleValue) => scheduleValue.valueType === valueType,
    );
    expect(award).toBeDefined();
    expect(award.valueAmount).toBe(+assertValues.valueAmount);
    expect(award.disbursedAmountSubtracted).toBe(
      assertValues.disbursedAmountSubtracted,
    );
  }

  async function assertOveraward(
    overawards: DisbursementOveraward[],
    awardCode: string,
    awardValue: number,
  ) {
    expect(overawards).toBeDefined();
    const awardOverawards = overawards.filter(
      (overaward) => overaward.disbursementValueCode === awardCode,
    );
    expect(awardOverawards).toHaveLength(1);
    const [overaward] = awardOverawards;
    expect(overaward.overawardValue).toBe(awardValue);
    expect(overaward.originType).toBe(
      DisbursementOverawardOriginType.ReassessmentOveraward,
    );
  }
});
