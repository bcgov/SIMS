import {
  createE2EDataSources,
  createFakeDisbursementSchedule,
  createFakeDisbursementValue,
  createFakeStudentAssessment,
  createFakeStudentLoanBalance,
  E2EDataSources,
  ensureProgramYearExists,
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
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  DisbursementValueType,
  FullTimeAssessment,
  OfferingIntensity,
  PartTimeAssessment,
  StudentAssessmentStatus,
  WorkflowData,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { createFakeVerifyAssessmentCalculationOrderPayload } from "./verify-assessment-calculation-order-factory";
import { createFakeSFASApplication } from "@sims/test-utils/factories/sfas-application";
import { createFakeSFASPartTimeApplication } from "@sims/test-utils/factories/sfas-part-time-application";
import * as faker from "faker";
import * as dayjs from "dayjs";

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
          createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 5),
          createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 6),
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
        createSecondDisbursement: true,
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          assessmentDate: addDays(-1),
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
        secondDisbursementInitialValues: {
          coeStatus: COEStatus.declined,
          disbursementScheduleStatus: DisbursementScheduleStatus.Cancelled,
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

  it("Should sum the grants from past applications with different offering intensities and awards from SFAS and SFAS part-time applications data when the applications are for the same student and program year.", async () => {
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
    // The start date for the first SFAS and SFAS part-time application record is set to the date before the first assessment date of the current application.
    const firstLegacyApplicationStartDate = faker.date.between(
      programYear.startDate,
      addDays(-1, firstAssessmentDate),
    );
    const firstLegacyApplicationEndDate = addDays(30, firstAssessmentDate);
    // The start date for the second SFAS and SFAS part-time application record is set to the date after the end date of the first SFAS application.
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
        applicationEditStatusUpdatedBy: currentApplication.student.user,
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
        student,
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
    // First SFAS part-time application with the start date before the first assessment date of the current application.
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
    // Second SFAS part-time application with the start date after the end date of the first SFAS part-time application.
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
    // The calculation will only take SFAS and SFAS part-time application data where the start date is the date before the first assessment date of the current application.
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
      latestCSLPBalance: 0,
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

  it("Should sum the workflow totals from past applications with different offering intensities when the applications are for the same student and program year.", async () => {
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
            DisbursementValueType.CanadaGrant,
            "CSGP",
            4,
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          assessmentDate: addDays(10, programYear.startDate),
          workflowData: {
            calculatedData: {
              exemptScholarshipsBursaries: 2000,
              totalFederalFSC: 3000,
              totalProvincialFSC: 4000,
              returnTransportationCost: 5000,
            },
          } as WorkflowData,
          assessmentData: {
            booksAndSuppliesCost: 6000,
          } as PartTimeAssessment,
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
        ],
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          assessmentDate: addDays(20, programYear.startDate),
          workflowData: {
            calculatedData: {
              studentSpouseContributionWeeks: 1000,
              totalFederalFSC: 3000,
              totalProvincialFSC: 4000,
              returnTransportationCost: 5000,
            },
          } as WorkflowData,
          assessmentData: {
            booksAndSuppliesCost: 100,
          } as FullTimeAssessment,
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
          createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 11),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          assessmentDate: addDays(25, programYear.startDate),
          workflowData: {
            calculatedData: {
              totalFederalFSC: 300,
              totalProvincialFSC: 400,
            },
          } as WorkflowData,
          assessmentData: {
            booksAndSuppliesCost: 150,
          } as FullTimeAssessment,
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
    const secondAssessment = createFakeStudentAssessment(
      {
        auditUser: currentApplication.student.user,
        application: currentApplication,
        offering: currentApplication.currentAssessment.offering,
        applicationEditStatusUpdatedBy: currentApplication.student.user,
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
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
      latestCSLPBalance: 0,
      // Full-time
      programYearTotalFullTimeBooksAndSuppliesCost: 250,
      programYearTotalFullTimeFederalFSC: 3300,
      programYearTotalFullTimeProvincialFSC: 4400,
      programYearTotalFullTimeReturnTransportationCost: 5000,
      programYearTotalFullTimeSpouseContributionWeeks: 1000,
      // Part-time
      programYearTotalPartTimeCSGP: 4,
      programYearTotalPartTimeBooksAndSuppliesCost: 6000,
      programYearTotalPartTimeFederalFSC: 3000,
      programYearTotalPartTimeProvincialFSC: 4000,
      programYearTotalPartTimeReturnTransportationCost: 5000,
      programYearTotalPartTimeScholarshipsBursaries: 2000,
    });
  });

  it(
    "Should skip the awards from past legacy full-time cancelled application on calculating the program year award totals" +
      " when the student has one ore more legacy full-time and also one or more legacy part-time applications in the past for the same program year" +
      " and one of the legacy full-time application is cancelled.",
    async () => {
      // Arrange

      // Create program year with start date in the past.
      const programYear = await ensureProgramYearExists(db, dayjs().year() + 5);
      programYear.startDate = getISODateOnlyString(addDays(-180));
      programYear.endDate = getISODateOnlyString(addDays(185));
      await db.programYear.save(programYear);

      // Create the student and program year to be shared across the applications.
      const student = await saveFakeStudent(db.dataSource);

      // Current application having the first assessment in progress.
      const currentApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, programYear },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.InProgress,
          currentAssessmentInitialValues: {
            // This is the first ever assessment for the student
            // and hence the assessment date is not set.
            assessmentWorkflowId: "some fake id",
            studentAssessmentStatus: StudentAssessmentStatus.InProgress,
          },
        },
      );
      // The start date for the SFAS full-time application record is set to be after the program year start date.
      // The start date of this application is 178 days before current date.
      const legacyApplicationStartDate = addDays(2, programYear.startDate);
      const legacyApplicationEndDate = addDays(40, legacyApplicationStartDate);

      // The start date for the second SFAS full-time application record is set to be after the first full-time application.
      // The start date of this application is 136 days before current date.
      const secondApplicationStartDate = addDays(2, legacyApplicationEndDate);
      const secondApplicationEndDate = addDays(40, secondApplicationStartDate);

      // The start date for the SFAS part-time application record is set to be after the second full-time application.
      // The start date of this application is 94 days before current date.
      const legacyPTApplicationStartDate = addDays(2, secondApplicationEndDate);
      const legacyPTApplicationEndDate = addDays(
        40,
        legacyPTApplicationStartDate,
      );

      await db.application.save(currentApplication);

      // SFAS Individual.
      const sfasIndividual = await saveFakeSFASIndividual(db.dataSource, {
        initialValues: {
          lastName: student.user.lastName,
          birthDate: student.birthDate,
          sin: student.sinValidation.sin,
          student,
        },
      });
      // Past SFAS application with the start date before the first assessment date of the current application and cancelled.
      const pastFakeSFASApplication = createFakeSFASApplication(
        { individual: sfasIndividual },
        {
          initialValues: {
            startDate: getISODateOnlyString(legacyApplicationStartDate),
            endDate: getISODateOnlyString(legacyApplicationEndDate),
            csgdAward: 200,
            csgpAward: 100,
            sbsdAward: 100,
            bcagAward: 100,
            // The SFAS application is cancelled.
            applicationCancelDate: getISODateOnlyString(new Date()),
          },
        },
      );
      // Past SFAS application with the start date before the first assessment date of the current application and active.
      const secondPastFakeSFASApplication = createFakeSFASApplication(
        { individual: sfasIndividual },
        {
          initialValues: {
            startDate: getISODateOnlyString(secondApplicationStartDate),
            endDate: getISODateOnlyString(secondApplicationEndDate),
            csgpAward: 100,
            sbsdAward: 40,
          },
        },
      );
      await db.sfasApplication.save([
        pastFakeSFASApplication,
        secondPastFakeSFASApplication,
      ]);

      const pastPTFakeSFASApplication = createFakeSFASPartTimeApplication(
        {
          individual: sfasIndividual,
        },
        {
          initialValues: {
            startDate: getISODateOnlyString(legacyPTApplicationStartDate),
            endDate: getISODateOnlyString(legacyPTApplicationEndDate),
            csgpAward: 100,
            sbsdAward: 40,
            bcagAward: 200,
            csgdAward: 300,
            csptAward: 400,
          },
        },
      );

      await db.sfasPartTimeApplications.save(pastPTFakeSFASApplication);
      // Act
      const result =
        await assessmentController.verifyAssessmentCalculationOrder(
          createFakeVerifyAssessmentCalculationOrderPayload(
            currentApplication.currentAssessment.id,
          ),
        );
      // Assert
      expect(FakeWorkerJobResult.getResultType(result)).toBe(
        MockedZeebeJobResult.Complete,
      );
      // The calculation will skip the SFAS application that is cancelled.
      expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
        isReadyForCalculation: true,
        latestCSLPBalance: 0,
        // Full-time totals.
        programYearTotalFullTimeCSGP: 100,
        programYearTotalFullTimeSBSD: 40,
        // Part-time totals.
        programYearTotalPartTimeCSGP: 100,
        programYearTotalPartTimeSBSD: 40,
        programYearTotalPartTimeBCAG: 200,
        programYearTotalPartTimeCSGD: 300,
        programYearTotalPartTimeCSPT: 400,
      });
    },
  );

  it("Should sum the awards from SFAS and SFAS part-time applications data when there is no past SIMS application for the same student and program year.", async () => {
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
    // The start date for the first SFAS and SFAS part-time application record is set to the date before the first assessment date of the current application.
    const firstLegacyApplicationStartDate = faker.date.between(
      programYear.startDate,
      addDays(-1, firstAssessmentDate),
    );
    const firstLegacyApplicationEndDate = addDays(30, firstAssessmentDate);
    // The start date for the second SFAS and SFAS part-time application record is set to the date after the end date of the first SFAS application.
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
        applicationEditStatusUpdatedBy: currentApplication.student.user,
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
        student,
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
    // First SFAS part-time application with the start date before the first assessment date of the current application.
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
    // Second SFAS part-time application with the start date after the end date of the first SFAS part-time application.
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
    // The calculation will only take SFAS and SFAS part-time application data where the start date is the date before the first assessment date of the current application.
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
      latestCSLPBalance: 0,
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

  it("Should not sum the awards from SFAS and SFAS part-time applications data when the SFAS applications for the same student and program year are cancelled.", async () => {
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
    // The start date for the first SFAS and SFAS part-time application record is set to the date before the first assessment date of the current application.
    const legacyApplicationStartDate = faker.date.between(
      programYear.startDate,
      addDays(-1, firstAssessmentDate),
    );
    const legacyApplicationEndDate = addDays(30, firstAssessmentDate);

    // Create the second assessment for the current application with a different assessment date.
    const secondAssessment = createFakeStudentAssessment(
      {
        auditUser: currentApplication.student.user,
        application: currentApplication,
        offering: currentApplication.currentAssessment.offering,
        applicationEditStatusUpdatedBy: currentApplication.student.user,
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
        student,
      },
    });

    const fakeSFASApplication = createFakeSFASApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(legacyApplicationStartDate),
          endDate: getISODateOnlyString(legacyApplicationEndDate),
          csgdAward: 9,
          csgpAward: 10,
          sbsdAward: 12,
          bcagAward: 13,
          applicationCancelDate: getISODateOnlyString(new Date()),
        },
      },
    );
    await db.sfasApplication.save(fakeSFASApplication);

    const fakeSFASPartTimeApplication = createFakeSFASPartTimeApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(legacyApplicationStartDate),
          endDate: getISODateOnlyString(legacyApplicationEndDate),
          csptAward: 2,
          csgdAward: 3,
          csgpAward: 4,
          sbsdAward: 6,
          bcagAward: 7,
          applicationCancelDate: getISODateOnlyString(new Date()),
        },
      },
    );
    await db.sfasPartTimeApplications.save(fakeSFASPartTimeApplication);
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
    // The calculation will not take cancelled SFAS and SFAS part-time application data.
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
      latestCSLPBalance: 0,
    });
  });

  it("Should not return any program year total awards or grants from awards from SFAS and SFAS part-time applications when there are no SIMS applications in the past and SFAS and SFAS part-time applications for the same student and program year.", async () => {
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
    // The result will not have data from SFAS or SFAS part-time application data.
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
      latestCSLPBalance: 0,
    });
  });

  it("Should return latest CSLP balance, when the student submits a part-time application and has a value in the student loan balance table", async () => {
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

    // Update CSLP balance for the student.
    await db.studentLoanBalance.insert(
      createFakeStudentLoanBalance(
        { student },
        {
          initialValues: {
            balanceDate: "2023-11-30",
            cslBalance: 2000,
          },
        },
      ),
    );

    // Update another CSLP balance for the student.
    await db.studentLoanBalance.insert(
      createFakeStudentLoanBalance(
        { student },
        {
          initialValues: {
            balanceDate: "2023-12-30",
            cslBalance: 1000,
          },
        },
      ),
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
    // The result will not have data from SFAS or SFAS part-time application data.
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
      latestCSLPBalance: 1000,
    });
  });

  it("Should not return latest CSLP balance, when the student submits a full-time application and has a value in the student loan balance table", async () => {
    // Arrange

    // Create the student to be shared across the applications.
    const student = await saveFakeStudent(db.dataSource);

    // Current application having the first assessment already processed.
    const currentApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.InProgress,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );

    // Update CSLP balance for the student.
    await db.studentLoanBalance.insert(
      createFakeStudentLoanBalance(
        { student },
        {
          initialValues: {
            balanceDate: "2023-11-30",
            cslBalance: 1000,
          },
        },
      ),
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
    // The result will not have data from SFAS or SFAS part-time application data.
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
    });
  });

  it("Should sum the contributions and costs from past applications with full-time offering intensities when the applications are for the same student and program year and the student submits a full-time application.", async () => {
    // Arrange

    // Create the student and program year to be shared across the applications.
    const student = await saveFakeStudent(db.dataSource);
    // Get the program year for the start date.
    const programYear = await db.programYear.findOne({ where: { id: 2 } });

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
            1,
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          assessmentDate: addDays(10, programYear.startDate),
          workflowData: {
            calculatedData: {
              studentSpouseContributionWeeks: 1000,
              exemptScholarshipsBursaries: 2000,
              totalFederalFSC: 3000,
              totalProvincialFSC: 4000,
              returnTransportationCost: 500,
              totalBookCost: 600,
            },
          } as WorkflowData,
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
        ],
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          assessmentDate: addDays(20, programYear.startDate),
          workflowData: {
            calculatedData: {
              studentSpouseContributionWeeks: 1000,
              exemptScholarshipsBursaries: 2000,
              totalFederalFSC: 3000,
              totalProvincialFSC: 4000,
              returnTransportationCost: 500,
              totalBookCost: 600,
            },
          } as WorkflowData,
        },
      },
    );
    // Current application having the first assessment already processed.
    const currentApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.InProgress,
        currentAssessmentInitialValues: {
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          assessmentDate: addDays(30, programYear.startDate),
        },
      },
    );
    const secondAssessment = createFakeStudentAssessment(
      {
        auditUser: currentApplication.student.user,
        application: currentApplication,
        offering: currentApplication.currentAssessment.offering,
        applicationEditStatusUpdatedBy: currentApplication.student.user,
      },
      {
        initialValue: {
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );
    currentApplication.currentAssessment = secondAssessment;
    await db.application.save(currentApplication);

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
    // The calculation will only take full-time and part-time application data where the start date is the date before the first assessment date of the current application.
    expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
      isReadyForCalculation: true,
      programYearTotalFullTimeFederalFSC: 6000,
      programYearTotalFullTimeProvincialFSC: 8000,
      programYearTotalFullTimeReturnTransportationCost: 1000,
      programYearTotalFullTimeScholarshipsBursaries: 4000,
      programYearTotalFullTimeSpouseContributionWeeks: 2000,
    });
  });

  it(
    "Should calculate the sum of grants from effective amount for sent disbursements and from the difference between value amount and disbursement amount subtracted" +
      " for the pending disbursements when a past application has one disbursement sent and the other in pending status.",
    async () => {
      // Arrange

      // Create the student to be shared across the applications.
      const student = await saveFakeStudent(db.dataSource);
      // Past part-time application with two assessments where the first assessment disbursement is sent
      // and current assessment disbursement is pending to be sent.
      const pastApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          firstDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaGrant,
              "CSPT",
              1000,
              { effectiveAmount: 1000 },
            ),
            createFakeDisbursementValue(
              DisbursementValueType.CanadaGrant,
              "CSGD",
              500,
              { effectiveAmount: 450 },
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
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: addDays(-2),
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
        },
      );
      const currentAssessment = createFakeStudentAssessment(
        {
          auditUser: student.user,
          application: pastApplication,
          offering: pastApplication.currentAssessment.offering,
        },
        {
          initialValue: {
            assessmentWorkflowId: "some fake id",
            triggerType: AssessmentTriggerType.ManualReassessment,
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
            assessmentDate: addDays(-1),
          },
        },
      );
      pastApplication.currentAssessment = currentAssessment;
      await db.application.save(pastApplication);

      const currentAssessmentDisbursement = createFakeDisbursementSchedule(
        {
          studentAssessment: currentAssessment,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaGrant,
              "CSPT",
              1150,
              { disbursedAmountSubtracted: 1000 },
            ),
            createFakeDisbursementValue(
              DisbursementValueType.CanadaGrant,
              "CSGD",
              460,
              { disbursedAmountSubtracted: 450 },
            ),
          ],
        },
        {
          initialValues: {
            coeStatus: COEStatus.required,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        },
      );
      currentAssessment.disbursementSchedules = [currentAssessmentDisbursement];
      await db.studentAssessment.save(currentAssessment);

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
      const result =
        await assessmentController.verifyAssessmentCalculationOrder(
          createFakeVerifyAssessmentCalculationOrderPayload(
            currentApplication.currentAssessment.id,
          ),
        );

      // Assert
      expect(FakeWorkerJobResult.getResultType(result)).toBe(
        MockedZeebeJobResult.Complete,
      );
      // Expect to consider the CSGP and CSGD effective amount from the first assessment disbursement
      // and CSGP and CSGD value amount and disbursement amount subtracted difference from the second disbursement.
      expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
        isReadyForCalculation: true,
        latestCSLPBalance: 0,
        programYearTotalPartTimeCSPT: 1150,
        programYearTotalPartTimeCSGD: 460,
      });
    },
  );

  it(
    "Should consider the sum of grants only from the sent disbursement when a past application has COE declined for current assessment disbursement" +
      " but has a disbursement sent from previous assessment.",
    async () => {
      // Arrange

      // Create the student to be shared across the applications.
      const student = await saveFakeStudent(db.dataSource);
      // Past part-time application with two assessments where the first assessment disbursement is sent
      // and current assessment disbursement COE is declined and the disbursement is cancelled.
      const pastApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          firstDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaGrant,
              "CSPT",
              1000,
              { effectiveAmount: 1000 },
            ),
            createFakeDisbursementValue(
              DisbursementValueType.CanadaGrant,
              "CSGD",
              500,
              { effectiveAmount: 420 },
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
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: addDays(-2),
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
        },
      );
      const currentAssessment = createFakeStudentAssessment(
        {
          auditUser: student.user,
          application: pastApplication,
          offering: pastApplication.currentAssessment.offering,
        },
        {
          initialValue: {
            assessmentWorkflowId: "some fake id",
            triggerType: AssessmentTriggerType.ManualReassessment,
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
            assessmentDate: addDays(-1),
          },
        },
      );
      pastApplication.currentAssessment = currentAssessment;
      await db.application.save(pastApplication);

      // COE declined for current assessment disbursement.
      const currentAssessmentDisbursement = createFakeDisbursementSchedule(
        {
          studentAssessment: currentAssessment,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaGrant,
              "CSPT",
              1150,
              { disbursedAmountSubtracted: 1000 },
            ),
            createFakeDisbursementValue(
              DisbursementValueType.CanadaGrant,
              "CSGD",
              450,
              { disbursedAmountSubtracted: 420 },
            ),
          ],
        },
        {
          initialValues: {
            coeStatus: COEStatus.declined,
            disbursementScheduleStatus: DisbursementScheduleStatus.Cancelled,
          },
        },
      );
      currentAssessment.disbursementSchedules = [currentAssessmentDisbursement];
      await db.studentAssessment.save(currentAssessment);

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
      const result =
        await assessmentController.verifyAssessmentCalculationOrder(
          createFakeVerifyAssessmentCalculationOrderPayload(
            currentApplication.currentAssessment.id,
          ),
        );

      // Assert
      expect(FakeWorkerJobResult.getResultType(result)).toBe(
        MockedZeebeJobResult.Complete,
      );
      // Expect to consider the CSGP and CSGD effective amount from the first assessment disbursement.
      expect(FakeWorkerJobResult.getOutputVariables(result)).toStrictEqual({
        isReadyForCalculation: true,
        latestCSLPBalance: 0,
        programYearTotalPartTimeCSPT: 1000,
        programYearTotalPartTimeCSGD: 420,
      });
    },
  );
});
