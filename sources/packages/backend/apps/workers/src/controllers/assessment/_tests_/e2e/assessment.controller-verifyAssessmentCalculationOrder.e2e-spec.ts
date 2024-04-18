import {
  createE2EDataSources,
  createFakeDisbursementValue,
  createFakeStudentAssessment,
  E2EDataSources,
  saveFakeApplicationDisbursements,
  saveFakeSFASIndividual,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  FakeWorkerJobResult,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { AssessmentController } from "../../assessment.controller";
import {
  ApplicationStatus,
  COEStatus,
  DisbursementValueType,
  OfferingIntensity,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { createFakeVerifyAssessmentCalculationOrderPayload } from "./verify-assessment-calculation-order-factory";
import { createFakeSFASApplication } from "@sims/test-utils/factories/sfas-application";
import { createFakeSFASPartTimeApplication } from "@sims/test-utils/factories/sfas-part-time-application";
import * as faker from "faker";

describe("AssessmentController(e2e)-verifyAssessmentCalculationOrder", () => {
  let db: E2EDataSources;
  let assessmentController: AssessmentController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    assessmentController = nestApplication.get(AssessmentController);
  });

  it("Should sum the grants from two past applications with different offering intensities when the applications are for the same student and program year.", async () => {
    // Arrange

    // Create the student to be shared across the applications.
    const student = await saveFakeStudent(db.dataSource);
    // Past part-time application with federal and provincial loans and grants.
    // Loans will be ignored.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLP",
            1,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSPT",
            2,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGD",
            3,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGP",
            4,
          ),
          // Should not be disbursed due to BCLM restriction.
          createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 5),
          createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 6),
          // Should not be disbursed due to BCLM restriction.
          createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 7),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          assessmentDate: addDays(-2),
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      },
    );
    // Past full-time application with federal and provincial loans and grants.
    // Loans will be ignored.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLF",
            8,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGD",
            9,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGP",
            10,
          ),
          createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 11),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "SBSD",
            12,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCAG",
            13,
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          assessmentDate: addDays(-1),
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      },
    );
    // Application currently being processed.
    const currentApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.InProgress,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );

    // Act
    const result = await assessmentController.verifyAssessmentCalculationOrder(
      createFakeVerifyAssessmentCalculationOrderPayload(
        currentApplication.currentAssessment.id,
      ),
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(result)).toBe(
      MockedZeebeJobResult.Complete,
    );
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
      latestCSLPBalance: 0,
      // Full-time
      programYearTotalFullTimeBCAG: 13,
      programYearTotalFullTimeCSGD: 9,
      programYearTotalFullTimeCSGP: 10,
      programYearTotalFullTimeSBSD: 12,
      // Part-time
      programYearTotalPartTimeBCAG: 7,
      programYearTotalPartTimeCSGD: 3,
      programYearTotalPartTimeCSGP: 4,
      programYearTotalPartTimeCSPT: 2,
      programYearTotalPartTimeSBSD: 6,
    });
  });

  it("Should consider the grant from only one disbursement from a valid past application when the past application has two disbursements and the second COE is declined.", async () => {
    // Arrange

    // Create the student to be shared across the applications.
    const student = await saveFakeStudent(db.dataSource);
    // Past part-time application with two disbursements where the second COE was declined.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGP",
            1000,
          ),
        ],
        secondDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGP",
            1000,
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          assessmentDate: addDays(-1),
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
        secondDisbursementInitialValues: {
          coeStatus: COEStatus.declined,
        },
      },
    );
    // Application currently being processed.
    const currentApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.InProgress,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );

    // Act
    const result = await assessmentController.verifyAssessmentCalculationOrder(
      createFakeVerifyAssessmentCalculationOrderPayload(
        currentApplication.currentAssessment.id,
      ),
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(result)).toBe(
      MockedZeebeJobResult.Complete,
    );
    // Expect to consider only the CSGP from the first disbursement
    // and ignore the second disbursement with the declined COE.
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
      latestCSLPBalance: 0,
      programYearTotalPartTimeCSGP: 1000,
    });
  });

  it("Should not return any program year total awards when there are no applications in the past for the same student and program year.", async () => {
    // Arrange

    // Create the student to be shared across the applications.
    const student = await saveFakeStudent(db.dataSource);
    // Application currently being processed.
    const currentApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.InProgress,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );

    // Act
    const result = await assessmentController.verifyAssessmentCalculationOrder(
      createFakeVerifyAssessmentCalculationOrderPayload(
        currentApplication.currentAssessment.id,
      ),
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(result)).toBe(
      MockedZeebeJobResult.Complete,
    );
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
      latestCSLPBalance: 0,
    });
  });

  it("Should sum the grants from past applications with different offering intensities and awards from SFAS and SFAS part time applications data when the applications are for the same student and program year.", async () => {
    // Arrange

    // Create the student and program year to be shared across the applications.
    const student = await saveFakeStudent(db.dataSource);
    // Get the program year for the start date.
    const programYear = await db.programYear.findOne({ where: { id: 2 } });

    // Past part-time application with federal and provincial loans and grants.
    // Loans will be ignored.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLP",
            1,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSPT",
            2,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGD",
            3,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGP",
            4,
          ),
          // Should not be disbursed due to BCLM restriction.
          createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 6),
          // Should not be disbursed due to BCLM restriction.
          createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 7),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          assessmentDate: addDays(10, programYear.startDate),
        },
      },
    );
    // Past full-time application with federal and provincial loans and grants.
    // Loans will be ignored.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLF",
            8,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGD",
            9,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGP",
            10,
          ),
          createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 11),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "SBSD",
            12,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCAG",
            13,
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          assessmentDate: addDays(20, programYear.startDate),
        },
      },
    );
    // Current application having the first assessment already processed.
    const currentApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.InProgress,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          assessmentDate: addDays(30, programYear.startDate),
        },
      },
    );
    const firstAssessmentDate =
      currentApplication.currentAssessment.assessmentDate;
    // The start date for the first SFAS and SFAS part time application record is set to the date before the first assessment date of the current application.
    const firstLegacyApplicationStartDate = faker.date.between(
      programYear.startDate,
      addDays(-1, firstAssessmentDate),
    );
    const firstLegacyApplicationEndDate = addDays(30, firstAssessmentDate);
    // The start date for the second SFAS and SFAS part time application record is set to the date after the end date of the first SFAS application.
    const secondLegacyApplicationStartDate = faker.date.between(
      firstLegacyApplicationEndDate,
      addDays(10, firstLegacyApplicationEndDate),
    );
    const secondLegacyApplicationEndDate = addDays(
      40,
      firstLegacyApplicationEndDate,
    );
    const secondAssessment = createFakeStudentAssessment(
      {
        auditUser: currentApplication.student.user,
        application: currentApplication,
        offering: currentApplication.currentAssessment.offering,
      },
      {
        initialValue: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );
    currentApplication.currentAssessment = secondAssessment;
    await db.application.save(currentApplication);

    // SFAS Individual.
    const sfasIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: student.user.lastName,
        birthDate: student.birthDate,
        sin: student.sinValidation.sin,
      },
    });
    // First SFAS application with the start date before the first assessment date of the current application.
    const firstFakeSFASApplication = createFakeSFASApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(firstLegacyApplicationStartDate),
          endDate: getISODateOnlyString(firstLegacyApplicationEndDate),
          csgdAward: 9,
          csgpAward: 10,
          sbsdAward: 12,
          bcagAward: 13,
        },
      },
    );
    // Second SFAS application with the start date after the end date of the first SFAS application.
    const secondFakeSFASApplication = createFakeSFASApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(secondLegacyApplicationStartDate),
          endDate: getISODateOnlyString(secondLegacyApplicationEndDate),
          csgdAward: 9,
          csgpAward: 10,
          sbsdAward: 12,
          bcagAward: 13,
        },
      },
    );
    await db.sfasApplication.save([
      firstFakeSFASApplication,
      secondFakeSFASApplication,
    ]);
    // First SFAS part time application with the start date before the first assessment date of the current application.
    const firstFakeSFASPartTimeApplication = createFakeSFASPartTimeApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(firstLegacyApplicationStartDate),
          endDate: getISODateOnlyString(firstLegacyApplicationEndDate),
          csptAward: 2,
          csgdAward: 3,
          csgpAward: 4,
          sbsdAward: 6,
          bcagAward: 7,
        },
      },
    );
    // Second SFAS part time application with the start date after the end date of the first SFAS part time application.
    const secondFakeSFASPartTimeApplication = createFakeSFASPartTimeApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(secondLegacyApplicationStartDate),
          endDate: getISODateOnlyString(secondLegacyApplicationEndDate),
          csptAward: 2,
          csgdAward: 3,
          csgpAward: 4,
          sbsdAward: 6,
          bcagAward: 7,
        },
      },
    );
    await db.sfasPartTimeApplications.save([
      firstFakeSFASPartTimeApplication,
      secondFakeSFASPartTimeApplication,
    ]);
    // Act
    const result = await assessmentController.verifyAssessmentCalculationOrder(
      createFakeVerifyAssessmentCalculationOrderPayload(
        currentApplication.currentAssessment.id,
      ),
    );
    // Assert
    expect(FakeWorkerJobResult.getResultType(result)).toBe(
      MockedZeebeJobResult.Complete,
    );
    // The calculation will only take SFAS and SFAS part time application data where the start date is the date before the first assessment date of the current application.
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
      // Full-time
      programYearTotalFullTimeCSGD: 18,
      programYearTotalFullTimeCSGP: 20,
      programYearTotalFullTimeSBSD: 24,
      programYearTotalFullTimeBCAG: 26,
      // Part-time
      programYearTotalPartTimeCSPT: 4,
      programYearTotalPartTimeCSGD: 6,
      programYearTotalPartTimeCSGP: 8,
      programYearTotalPartTimeSBSD: 12,
      programYearTotalPartTimeBCAG: 14,
    });
  });

  it("Should sum the awards from SFAS and SFAS part time applications data when there is no past SIMS application for the same student and program year.", async () => {
    // Arrange

    // Create the student to be shared across the applications.
    const student = await saveFakeStudent(db.dataSource);
    // Get the program year for the start date.
    const programYear = await db.programYear.findOne({ where: { id: 2 } });

    // Current application having the first assessment already processed.
    const currentApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.InProgress,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          assessmentDate: addDays(30, programYear.startDate),
        },
      },
    );
    const firstAssessmentDate =
      currentApplication.currentAssessment.assessmentDate;
    // The start date for the first SFAS and SFAS part time application record is set to the date before the first assessment date of the current application.
    const firstLegacyApplicationStartDate = faker.date.between(
      programYear.startDate,
      addDays(-1, firstAssessmentDate),
    );
    const firstLegacyApplicationEndDate = addDays(30, firstAssessmentDate);
    // The start date for the second SFAS and SFAS part time application record is set to the date after the end date of the first SFAS application.
    const secondLegacyApplicationStartDate = faker.date.between(
      firstLegacyApplicationEndDate,
      addDays(10, firstLegacyApplicationEndDate),
    );
    const secondLegacyApplicationEndDate = addDays(
      40,
      firstLegacyApplicationEndDate,
    );
    // Create the second assessment for the current application with a different assessment date.
    const secondAssessment = createFakeStudentAssessment(
      {
        auditUser: currentApplication.student.user,
        application: currentApplication,
        offering: currentApplication.currentAssessment.offering,
      },
      {
        initialValue: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );
    currentApplication.currentAssessment = secondAssessment;
    await db.application.save(currentApplication);

    // SFAS Individual.
    const sfasIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: student.user.lastName,
        birthDate: student.birthDate,
        sin: student.sinValidation.sin,
      },
    });
    // First SFAS application with the start date before the first assessment date of the current application.
    const firstFakeSFASApplication = createFakeSFASApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(firstLegacyApplicationStartDate),
          endDate: getISODateOnlyString(firstLegacyApplicationEndDate),
          csgdAward: 9,
          csgpAward: 10,
          sbsdAward: 12,
          bcagAward: 13,
        },
      },
    );
    // Second SFAS application with the start date after the end date of the first SFAS application.
    const secondFakeSFASApplication = createFakeSFASApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(secondLegacyApplicationStartDate),
          endDate: getISODateOnlyString(secondLegacyApplicationEndDate),
          csgdAward: 9,
          csgpAward: 10,
          sbsdAward: 12,
          bcagAward: 13,
        },
      },
    );
    await db.sfasApplication.save([
      firstFakeSFASApplication,
      secondFakeSFASApplication,
    ]);
    // First SFAS part time application with the start date before the first assessment date of the current application.
    const firstFakeSFASPartTimeApplication = createFakeSFASPartTimeApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(firstLegacyApplicationStartDate),
          endDate: getISODateOnlyString(firstLegacyApplicationEndDate),
          csptAward: 2,
          csgdAward: 3,
          csgpAward: 4,
          sbsdAward: 6,
          bcagAward: 7,
        },
      },
    );
    // Second SFAS part time application with the start date after the end date of the first SFAS part time application.
    const secondFakeSFASPartTimeApplication = createFakeSFASPartTimeApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(secondLegacyApplicationStartDate),
          endDate: getISODateOnlyString(secondLegacyApplicationEndDate),
          csptAward: 2,
          csgdAward: 3,
          csgpAward: 4,
          sbsdAward: 6,
          bcagAward: 7,
        },
      },
    );
    await db.sfasPartTimeApplications.save([
      firstFakeSFASPartTimeApplication,
      secondFakeSFASPartTimeApplication,
    ]);
    // Act
    const result = await assessmentController.verifyAssessmentCalculationOrder(
      createFakeVerifyAssessmentCalculationOrderPayload(
        currentApplication.currentAssessment.id,
      ),
    );
    // Assert
    expect(FakeWorkerJobResult.getResultType(result)).toBe(
      MockedZeebeJobResult.Complete,
    );
    // The calculation will only take SFAS and SFAS part time application data where the start date is the date before the first assessment date of the current application.
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
      // Full-time
      programYearTotalFullTimeCSGD: 9,
      programYearTotalFullTimeCSGP: 10,
      programYearTotalFullTimeSBSD: 12,
      programYearTotalFullTimeBCAG: 13,
      // Part-time
      programYearTotalPartTimeCSPT: 2,
      programYearTotalPartTimeCSGD: 3,
      programYearTotalPartTimeCSGP: 4,
      programYearTotalPartTimeSBSD: 6,
      programYearTotalPartTimeBCAG: 7,
    });
  });

  it("Should not return any program year total awards or grants from awards from SFAS and SFAS part time applications when there are no SIMS applications in the past and SFAS and SFAS part time applications for the same student and program year.", async () => {
    // Arrange

    // Create the student to be shared across the applications.
    const student = await saveFakeStudent(db.dataSource);

    // Current application having the first assessment already processed.
    const currentApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.InProgress,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );

    // Act
    const result = await assessmentController.verifyAssessmentCalculationOrder(
      createFakeVerifyAssessmentCalculationOrderPayload(
        currentApplication.currentAssessment.id,
      ),
    );
    // Assert
    expect(FakeWorkerJobResult.getResultType(result)).toBe(
      MockedZeebeJobResult.Complete,
    );
    // The result will not have data from SFAS or SFAS part time application data.
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
    });
  });
});
