import {
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValueType,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  createE2EDataSources,
  createFakeDisbursementOveraward,
  createFakeEducationProgramOffering,
  createFakeStudent,
  createFakeStudentAssessment,
  createFakeUser,
  E2EDataSources,
  saveFakeApplication,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import { createFakeDisbursementSchedule } from "@sims/test-utils/factories/disbursement-schedule";
import { createFakeDisbursementValue } from "@sims/test-utils/factories/disbursement-value";
import { createFakeSaveDisbursementSchedulesPayload } from "./save-disbursement-schedules-payloads";
import { DisbursementController } from "../../disbursement.controller";
import {
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";

describe("DisbursementController(e2e)-saveDisbursementSchedules", () => {
  let db: E2EDataSources;
  let disbursementController: DisbursementController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    disbursementController = nestApplication.get(DisbursementController);
  });

  it("Should generate an overaward when a reassessment happens and the student is entitled to less money", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    const savedStudent = await db.student.save(createFakeStudent(savedUser));
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      {
        student: savedStudent,
      },
      { applicationNumber: "OA_TEST001" },
    );
    // Original assessment.
    const fakeOriginalAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
    });
    fakeOriginalAssessment.application = savedApplication;
    // Original assessment - first disbursement (Sent).
    const firstSchedule = createFakeDisbursementSchedule({
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
      createFakeSaveDisbursementSchedulesPayload({
        assessmentId: savedReassessment.id,
        createSecondDisbursement: true,
      });
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

  it("Should generate an overaward and deduct grants already paid for a part-time application when a reassessment happens and the student is entitled to less money.", async () => {
    // Arrange

    // Save the application with the original disbursement sent.
    const savedApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLP",
            5000,
            { effectiveAmount: 5000 },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGP",
            4000,
            { effectiveAmount: 4000 },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCAG",
            3000,
            { effectiveAmount: 3000 },
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        firstDisbursementInitialValues: {
          coeStatus: COEStatus.completed,
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      },
    );
    // Create the reassessment.
    savedApplication.currentAssessment = createFakeStudentAssessment(
      {
        auditUser: savedApplication.student.user,
        application: savedApplication,
        offering: savedApplication.currentAssessment.offering,
      },
      {
        initialValue: { triggerType: AssessmentTriggerType.ManualReassessment },
      },
    );
    await db.application.save(savedApplication);
    const reassessment = savedApplication.currentAssessment;
    // Schedules to be saved to the reassessment.
    const saveDisbursementSchedulesPayload =
      createFakeSaveDisbursementSchedulesPayload({
        assessmentId: reassessment.id,
        firstDisbursementAwards: [
          {
            // Expected 300 overaward generated.
            valueCode: "CSLP",
            valueType: DisbursementValueType.CanadaLoan,
            valueAmount: 4700,
          },
          {
            // Expected 500 grant to be paid since 4000 was already sent.
            valueCode: "CSGP",
            valueType: DisbursementValueType.CanadaGrant,
            valueAmount: 4500,
          },
          {
            // No value expected because it was already sent 3000.
            valueCode: "BCAG",
            valueType: DisbursementValueType.BCGrant,
            valueAmount: 2000,
          },
        ],
      });

    // Act
    const saveResult = await disbursementController.saveDisbursementSchedules(
      saveDisbursementSchedulesPayload,
    );

    // Asserts
    expect(saveResult).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    // Assert disbursement already paid subtracted.
    const createdDisbursements = await db.disbursementSchedule.find({
      select: {
        id: true,
        disbursementValues: {
          id: true,
          valueType: true,
          valueAmount: true,
          disbursedAmountSubtracted: true,
        },
      },
      relations: {
        disbursementValues: true,
      },
      where: {
        studentAssessment: { id: reassessment.id },
      },
    });
    expect(createdDisbursements).toBeDefined();
    expect(createdDisbursements).toHaveLength(1);
    const [firstDisbursement] = createdDisbursements;
    // Expected 300 overaward generated since 5000 was already sent.
    assertAwardDeduction(firstDisbursement, DisbursementValueType.CanadaLoan, {
      valueAmount: 4700,
      disbursedAmountSubtracted: 4700,
    });
    // Expected 500 grant to be paid since 4000 was already sent.
    assertAwardDeduction(firstDisbursement, DisbursementValueType.CanadaGrant, {
      valueAmount: 4500,
      disbursedAmountSubtracted: 4000,
    });
    // No value expected because it was already sent 3000.
    assertAwardDeduction(firstDisbursement, DisbursementValueType.BCGrant, {
      valueAmount: 2000,
      disbursedAmountSubtracted: 2000,
    });
    // Overaward asserts.
    const overawards = await db.disbursementOveraward.find({
      select: {
        id: true,
        disbursementValueCode: true,
        overawardValue: true,
        originType: true,
      },
      where: { student: { id: savedApplication.student.id } },
    });
    // Assert overaward creation.
    // Part-time overawards are created but are not deducted during e-Cert generation.
    assertOveraward(overawards, "CSLP", 300);
  });

  it("Should assert 'hasEstimatedAward' flag as false when disbursement value amounts are zero.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    const savedStudent = await db.student.save(createFakeStudent(savedUser));
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      {
        student: savedStudent,
      },
      {
        applicationStatus: ApplicationStatus.InProgress,
        applicationNumber: "OA_TEST003",
      },
    );

    // Original assessment.
    const fakeOriginalAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
    });
    fakeOriginalAssessment.application = savedApplication;
    const savedOriginalAssessment = await db.studentAssessment.save(
      fakeOriginalAssessment,
    );
    const saveDisbursementSchedulesPayload =
      createFakeSaveDisbursementSchedulesPayload({
        assessmentId: savedOriginalAssessment.id,
        createSecondDisbursement: true,
        firstDisbursementAwards: [
          {
            valueCode: "CSLF",
            valueType: DisbursementValueType.CanadaLoan,
            valueAmount: 0,
          },
          {
            valueCode: "BCSL",
            valueType: DisbursementValueType.BCLoan,
            valueAmount: 0,
          },
        ],
        secondDisbursementAwards: [
          {
            valueCode: "CSLF",
            valueType: DisbursementValueType.CanadaLoan,
            valueAmount: 0,
          },
          {
            valueCode: "BCSL",
            valueType: DisbursementValueType.BCLoan,
            valueAmount: 0,
          },
        ],
      });

    // Act
    const saveResult = await disbursementController.saveDisbursementSchedules(
      saveDisbursementSchedulesPayload,
    );

    // Asserts
    expect(saveResult).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    const createdDisbursements = await db.disbursementSchedule.find({
      select: {
        id: true,
        hasEstimatedAwards: true,
      },
      where: {
        studentAssessment: { id: savedOriginalAssessment.id },
      },
    });
    // Assert disbursements.
    expect(createdDisbursements).toHaveLength(2);
    const [firstDisbursement, secondDisbursement] = createdDisbursements;
    // Assert firstDisbursement.
    expect(firstDisbursement.hasEstimatedAwards).toBe(false);
    // Assert secondDisbursement.
    expect(secondDisbursement.hasEstimatedAwards).toBe(false);
  });

  it("Should assert 'hasEstimatedAward' flag as true when disbursement value amounts are greater than zero.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    const savedStudent = await db.student.save(createFakeStudent(savedUser));
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      {
        student: savedStudent,
      },
      {
        applicationStatus: ApplicationStatus.InProgress,
        applicationNumber: "OA_TEST003",
      },
    );
    // Original assessment.
    const fakeOriginalAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
    });
    fakeOriginalAssessment.application = savedApplication;
    const savedOriginalAssessment = await db.studentAssessment.save(
      fakeOriginalAssessment,
    );
    const saveDisbursementSchedulesPayload =
      createFakeSaveDisbursementSchedulesPayload({
        assessmentId: savedOriginalAssessment.id,
        createSecondDisbursement: true,
        firstDisbursementAwards: [
          {
            valueCode: "CSLF",
            valueType: DisbursementValueType.CanadaLoan,
            valueAmount: 1000,
          },
          {
            valueCode: "BCSL",
            valueType: DisbursementValueType.BCLoan,
            valueAmount: 1000,
          },
        ],
        secondDisbursementAwards: [
          {
            valueCode: "CSLF",
            valueType: DisbursementValueType.CanadaLoan,
            valueAmount: 1000,
          },
          {
            valueCode: "BCSL",
            valueType: DisbursementValueType.BCLoan,
            valueAmount: 1000,
          },
        ],
      });

    // Act
    const saveResult = await disbursementController.saveDisbursementSchedules(
      saveDisbursementSchedulesPayload,
    );

    // Asserts
    expect(saveResult).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    const createdDisbursements = await db.disbursementSchedule.find({
      select: {
        id: true,
        hasEstimatedAwards: true,
      },
      where: {
        studentAssessment: { id: savedOriginalAssessment.id },
      },
    });
    // Assert disbursements.
    expect(createdDisbursements).toHaveLength(2);
    const [firstDisbursement, secondDisbursement] = createdDisbursements;
    // Assert firstDisbursement.
    expect(firstDisbursement.hasEstimatedAwards).toBe(true);
    // Assert secondDisbursement.
    expect(secondDisbursement.hasEstimatedAwards).toBe(true);
  });

  function assertAwardDeduction(
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

  function assertOveraward(
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
