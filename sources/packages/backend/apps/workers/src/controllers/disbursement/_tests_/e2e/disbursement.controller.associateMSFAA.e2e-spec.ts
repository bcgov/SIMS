import {
  createE2EDataSources,
  createFakeApplication,
  createFakeDisbursementSchedule,
  createFakeDisbursementValue,
  createFakeEducationProgramOffering,
  createFakeInstitutionLocation,
  createFakeMSFAANumber,
  createFakeStudent,
  createFakeStudentAssessment,
  createFakeUser,
  E2EDataSources,
  MSFAAStates,
  saveFakeSFASIndividual,
} from "@sims/test-utils";
import { DisbursementController } from "../../disbursement.controller";
import { createTestingAppModule } from "../../../../../test/helpers";
import { createFakeSFASPartTimeApplication } from "@sims/test-utils/factories/sfas-part-time-application";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { createFakeAssociateMSFAAPayload } from "./associate-MSFAA-payloads";
import {
  DisbursementScheduleStatus,
  DisbursementValueType,
  InstitutionLocation,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  getAuthRelatedEntities,
  InstitutionTokenTypes,
} from "../../../../../../api/src/testHelpers";
import {
  FakeWorkerJobResult,
  MockedZeebeJobResult,
} from "../../../../../../../apps/workers/test/utils/worker-job-mock";

describe("DisbursementController(e2e)-associateMSFAA", () => {
  let db: E2EDataSources;
  let disbursementController: DisbursementController;
  let collegeFLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    disbursementController = nestApplication.get(DisbursementController);
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({
      institution: collegeF,
    });
  });

  const now = new Date();

  it("Should reuse the MSFAA Number from SFAS part applications by creating and activating in SIMS when there is a valid MSFAA found and date signed should be updated with application end date.", async () => {
    // Arrange
    const firstLegacyApplicationStartDate = addDays(-100, now);
    const firstLegacyApplicationEndDate = addDays(-10, now);

    // Create and save user.
    const savedUser = await db.user.save(createFakeUser());

    // Create and save fake student.
    const savedStudent = await db.student.save(createFakeStudent(savedUser));

    // Create and save fake offering.
    const savedOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        { auditUser: savedUser, institutionLocation: collegeFLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

    // Create and save application.
    const savedApplication = await db.application.save(
      createFakeApplication(
        {
          student: savedStudent,
          location: collegeFLocation,
        },
        { initialValue: { applicationNumber: "TEST001" } },
      ),
    );

    //Create student assessment.
    const fakeStudentAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      offering: savedOffering,
      application: savedApplication,
    });

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
    fakeStudentAssessment.disbursementSchedules = [
      firstSchedule,
      secondSchedule,
    ];

    // Save student assessment.
    const savedAssessment = await db.studentAssessment.save(
      fakeStudentAssessment,
    );

    //Save application with the current assessment.
    savedApplication.currentAssessment = savedAssessment;
    await db.application.save(savedApplication);

    const savedSFASIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { id: savedStudent.id },
    });
    const savedSFASPartTimeApplication = await db.sfasPartTimeApplications.save(
      createFakeSFASPartTimeApplication(
        { individual: savedSFASIndividual },
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
      ),
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: savedApplication.currentAssessment.id,
    });
    const saveResult = await disbursementController.associateMSFAA(
      associateMSFAAPayload,
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(saveResult)).toBe(
      MockedZeebeJobResult.Complete,
    );

    // Fetch MSFAA Number for the student in SIMS.
    const assignedMSFAANumber = await db.msfaaNumber.findOne({
      select: {
        id: true,
        msfaaNumber: true,
        dateSigned: true,
        dateRequested: true,
        serviceProviderReceivedDate: true,
        referenceApplication: { id: true },
      },
      relations: {
        referenceApplication: true,
      },
      where: {
        student: { id: savedStudent.id },
      },
    });
    // Assert MSFAA Number.
    expect(assignedMSFAANumber.msfaaNumber).toEqual(
      savedSFASIndividual.partTimeMSFAANumber,
    );
    // Assert date signed.
    expect(assignedMSFAANumber.dateSigned).toBe(
      savedSFASPartTimeApplication.endDate,
    );
    // Assert date requested.
    expect(assignedMSFAANumber.dateRequested).toBe(null);
    // Assert service provider date.
    expect(assignedMSFAANumber.serviceProviderReceivedDate).toBe(null);
    // Assert application.
    expect(assignedMSFAANumber.referenceApplication.id).toBe(
      savedApplication.id,
    );
  });

  it("Should reuse the MSFAA Number from SIMS when MSFAA number is already generated and the request is already sent for verification.", async () => {
    // Arrange
    const firstLegacyApplicationStartDate = addDays(-100, now);
    const firstLegacyApplicationEndDate = addDays(-10, now);

    // Create and save user.
    const savedUser = await db.user.save(createFakeUser());

    // Create and save fake student.
    const savedStudent = await db.student.save(createFakeStudent(savedUser));

    // Create and save fake offering.
    const savedOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        { auditUser: savedUser, institutionLocation: collegeFLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

    // Create and save application.
    const savedApplication = await db.application.save(
      createFakeApplication(
        {
          student: savedStudent,
          location: collegeFLocation,
        },
        { initialValue: { applicationNumber: "TEST001" } },
      ),
    );

    //Create student assessment.
    const fakeStudentAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      offering: savedOffering,
      application: savedApplication,
    });

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
    fakeStudentAssessment.disbursementSchedules = [
      firstSchedule,
      secondSchedule,
    ];

    // Save student assessment.
    const savedAssessment = await db.studentAssessment.save(
      fakeStudentAssessment,
    );

    //Save application with the current assessment.
    savedApplication.currentAssessment = savedAssessment;
    await db.application.save(savedApplication);

    //Create and save fake MSFAA Number.
    const savedMSFAANumber = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        {
          student: savedStudent,
          referenceApplication: savedApplication,
        },
        {
          msfaaState: MSFAAStates.Pending,
          msfaaInitialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: savedApplication.currentAssessment.id,
    });
    const saveResult = await disbursementController.associateMSFAA(
      associateMSFAAPayload,
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(saveResult)).toBe(
      MockedZeebeJobResult.Complete,
    );

    // Fetch MSFAA Number for the student in SIMS.
    const assignedMSFAANumber = await db.msfaaNumber.findOne({
      select: {
        id: true,
        msfaaNumber: true,
        dateSigned: true,
        dateRequested: true,
        serviceProviderReceivedDate: true,
        referenceApplication: { id: true },
      },
      relations: {
        referenceApplication: true,
      },
      where: {
        student: { id: savedStudent.id },
      },
    });
    // Assert MSFAA Number.
    expect(assignedMSFAANumber.msfaaNumber).toEqual(
      savedMSFAANumber.msfaaNumber,
    );
  });

  it("Should create new MSFAA Number for part applications by creating and activating in SIMS when MSFAA is not found or invalid offering end date.", async () => {
    // Arrange
    const firstLegacyApplicationStartDate = addDays(-800, now);
    const firstLegacyApplicationEndDate = addDays(-732, now);

    // Create and save user.
    const savedUser = await db.user.save(createFakeUser());

    // Create and save fake student.
    const savedStudent = await db.student.save(createFakeStudent(savedUser));

    // Create and save fake offering.
    const savedOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        { auditUser: savedUser, institutionLocation: collegeFLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

    // Create and save application.
    const savedApplication = await db.application.save(
      createFakeApplication(
        {
          student: savedStudent,
          location: collegeFLocation,
        },
        { initialValue: { applicationNumber: "TEST001" } },
      ),
    );

    //Create student assessment.
    const fakeStudentAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      offering: savedOffering,
      application: savedApplication,
    });

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
    fakeStudentAssessment.disbursementSchedules = [
      firstSchedule,
      secondSchedule,
    ];

    // Save student assessment.
    const savedAssessment = await db.studentAssessment.save(
      fakeStudentAssessment,
    );

    //Save application with the current assessment.
    savedApplication.currentAssessment = savedAssessment;
    await db.application.save(savedApplication);

    const savedSFASIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { id: savedStudent.id },
    });

    await db.sfasPartTimeApplications.save(
      createFakeSFASPartTimeApplication(
        { individual: savedSFASIndividual },
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
      ),
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: savedApplication.currentAssessment.id,
    });
    const saveResult = await disbursementController.associateMSFAA(
      associateMSFAAPayload,
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(saveResult)).toBe(
      MockedZeebeJobResult.Complete,
    );

    // Fetch MSFAA Number for the student in SIMS.
    const createdMSFAANumber = await db.msfaaNumber.findOne({
      select: {
        id: true,
        msfaaNumber: true,
        dateSigned: true,
        dateRequested: true,
        serviceProviderReceivedDate: true,
        referenceApplication: { id: true },
      },
      relations: {
        referenceApplication: true,
      },
      where: {
        student: { id: savedStudent.id },
      },
    });
    // Assert MSFAA Number.
    expect(createdMSFAANumber.msfaaNumber).not.toBe(
      savedSFASIndividual.partTimeMSFAANumber,
    );
    // Assert date signed.
    expect(createdMSFAANumber.dateSigned).toBe(null);
    // Assert date requested.
    expect(createdMSFAANumber.dateRequested).toBe(null);
    // Assert service provider date.
    expect(createdMSFAANumber.serviceProviderReceivedDate).toBe(null);
    // Assert application.
    expect(createdMSFAANumber.referenceApplication.id).toBe(
      savedApplication.id,
    );
  });

  it("Should reuse MSFAA Number for part applications if its available for a student in SIMS when MSFAA is found for a student with part-time offering intensity.", async () => {
    // Arrange
    // Create and save user.
    const savedUser = await db.user.save(createFakeUser());

    // Create and save fake student.
    const savedStudent = await db.student.save(createFakeStudent(savedUser));

    // Create and save fake offering.
    const savedOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        { auditUser: savedUser, institutionLocation: collegeFLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

    // Create and save application.
    const savedApplication = await db.application.save(
      createFakeApplication(
        {
          student: savedStudent,
          location: collegeFLocation,
        },
        { initialValue: { applicationNumber: "TEST001" } },
      ),
    );

    //Create student assessment.
    const fakeStudentAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      offering: savedOffering,
      application: savedApplication,
    });

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
    fakeStudentAssessment.disbursementSchedules = [
      firstSchedule,
      secondSchedule,
    ];

    // Save student assessment.
    const savedAssessment = await db.studentAssessment.save(
      fakeStudentAssessment,
    );

    //Save application with the current assessment.
    savedApplication.currentAssessment = savedAssessment;
    await db.application.save(savedApplication);

    //Create and save fake MSFAA Number.
    const savedMSFAANumber = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        {
          student: savedStudent,
          referenceApplication: savedApplication,
        },
        {
          msfaaState: MSFAAStates.Signed,
          msfaaInitialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: savedApplication.currentAssessment.id,
    });
    const saveResult = await disbursementController.associateMSFAA(
      associateMSFAAPayload,
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(saveResult)).toBe(
      MockedZeebeJobResult.Complete,
    );

    // Fetch MSFAA Number for the student in SIMS.
    const assignedMSFAANumber = await db.msfaaNumber.findOne({
      select: {
        id: true,
        msfaaNumber: true,
        dateSigned: true,
        dateRequested: true,
        serviceProviderReceivedDate: true,
        referenceApplication: { id: true },
      },
      relations: {
        referenceApplication: true,
      },
      where: {
        student: { id: savedStudent.id },
      },
    });
    // Assert MSFAA Number.
    expect(assignedMSFAANumber.msfaaNumber).toBe(savedMSFAANumber.msfaaNumber);
    // Assert date signed.
    expect(assignedMSFAANumber.dateSigned).toBe(getISODateOnlyString(now));
    // Assert date requested.
    expect(assignedMSFAANumber.dateRequested).not.toBe(null);
    // Assert service provider date.
    expect(assignedMSFAANumber.serviceProviderReceivedDate).not.toBe(null);
    // Assert application.
    expect(assignedMSFAANumber.referenceApplication.id).toBe(
      savedApplication.id,
    );
  });

  it("Should reuse MSFAA Number for part time application when MSFAA is found for previously signed disbursement for part applications in SIMS.", async () => {
    // Arrange
    // Create and save user.
    const savedUser = await db.user.save(createFakeUser());

    // Create and save fake student.
    const savedStudent = await db.student.save(createFakeStudent(savedUser));

    // Create and save fake offering.
    const savedOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        { auditUser: savedUser, institutionLocation: collegeFLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

    // Create and save application.
    const savedApplication = await db.application.save(
      createFakeApplication(
        {
          student: savedStudent,
          location: collegeFLocation,
        },
        { initialValue: { applicationNumber: "TEST001" } },
      ),
    );

    //Create student assessment.
    const fakeStudentAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      offering: savedOffering,
      application: savedApplication,
    });

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
    fakeStudentAssessment.disbursementSchedules = [
      firstSchedule,
      secondSchedule,
    ];

    // Save student assessment.
    const savedAssessment = await db.studentAssessment.save(
      fakeStudentAssessment,
    );

    //Save application with the current assessment.
    savedApplication.currentAssessment = savedAssessment;
    await db.application.save(savedApplication);

    // Create and save fake offering.
    const savedPreviousOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        { auditUser: savedUser, institutionLocation: collegeFLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

    // Create and save previously signed application.
    const savedPreviousApplication = await db.application.save(
      createFakeApplication(
        {
          student: savedStudent,
          location: collegeFLocation,
        },
        { initialValue: { applicationNumber: "TEST002" } },
      ),
    );

    //Create student assessment.
    const fakePreviousStudentAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      offering: savedPreviousOffering,
      application: savedPreviousApplication,
    });

    //Create and save fake MSFAA Number.
    const savedPreviousMSFAANumber = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        {
          student: savedStudent,
        },
        {
          msfaaState: MSFAAStates.Signed,
          msfaaInitialValues: {
            offeringIntensity: OfferingIntensity.partTime,
          },
        },
      ),
    );

    // Original assessment - first disbursement (Sent).
    const firstPreviousSchedule = createFakeDisbursementSchedule({
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
    firstPreviousSchedule.disbursementScheduleStatus =
      DisbursementScheduleStatus.Sent;
    firstPreviousSchedule.msfaaNumber = savedPreviousMSFAANumber;

    fakePreviousStudentAssessment.disbursementSchedules = [
      firstPreviousSchedule,
    ];

    // Save student assessment.
    const savedPreviousAssessment = await db.studentAssessment.save(
      fakePreviousStudentAssessment,
    );

    //Save application with the current assessment.
    savedPreviousApplication.currentAssessment = savedPreviousAssessment;
    await db.application.save(savedPreviousApplication);

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: savedApplication.currentAssessment.id,
    });
    const saveResult = await disbursementController.associateMSFAA(
      associateMSFAAPayload,
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(saveResult)).toBe(
      MockedZeebeJobResult.Complete,
    );

    // Fetch MSFAA Number for the student in SIMS.
    const assignedMSFAANumber = await db.msfaaNumber.findOne({
      select: {
        id: true,
        msfaaNumber: true,
        dateSigned: true,
        dateRequested: true,
        serviceProviderReceivedDate: true,
        referenceApplication: { id: true },
      },
      relations: {
        referenceApplication: true,
      },
      where: {
        student: { id: savedStudent.id },
      },
    });
    // Assert MSFAA Number.
    expect(assignedMSFAANumber.msfaaNumber).toBe(
      savedPreviousMSFAANumber.msfaaNumber,
    );
    // Assert date signed.
    expect(assignedMSFAANumber.dateSigned).toBe(getISODateOnlyString(now));
    // Assert date requested.
    expect(assignedMSFAANumber.dateRequested).not.toBe(null);
    // Assert service provider date.
    expect(assignedMSFAANumber.serviceProviderReceivedDate).not.toBe(null);
  });

  it("Should create new MSFAA Number for part time application when MSFAA is found for previously signed disbursement and the its invalid in SIMS.", async () => {
    // Arrange
    // Create and save user.
    const savedUser = await db.user.save(createFakeUser());

    // Create and save fake student.
    const savedStudent = await db.student.save(createFakeStudent(savedUser));

    // Create and save fake offering.
    const savedOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        { auditUser: savedUser, institutionLocation: collegeFLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

    // Create and save application.
    const savedApplication = await db.application.save(
      createFakeApplication(
        {
          student: savedStudent,
          location: collegeFLocation,
        },
        { initialValue: { applicationNumber: "TEST001" } },
      ),
    );

    //Create student assessment.
    const fakeStudentAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      offering: savedOffering,
      application: savedApplication,
    });

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
    fakeStudentAssessment.disbursementSchedules = [
      firstSchedule,
      secondSchedule,
    ];

    // Save student assessment.
    const savedAssessment = await db.studentAssessment.save(
      fakeStudentAssessment,
    );

    //Save application with the current assessment.
    savedApplication.currentAssessment = savedAssessment;
    await db.application.save(savedApplication);

    // Create and save fake offering.
    const savedPreviousOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        { auditUser: savedUser, institutionLocation: collegeFLocation },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            studyStartDate: getISODateOnlyString(addDays(-1000)),
            studyEndDate: getISODateOnlyString(addDays(-731)),
          },
        },
      ),
    );

    // Create and save previously signed application.
    const savedPreviousApplication = await db.application.save(
      createFakeApplication(
        {
          student: savedStudent,
          location: collegeFLocation,
        },
        { initialValue: { applicationNumber: "TEST002" } },
      ),
    );

    //Create student assessment.
    const fakePreviousStudentAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      offering: savedPreviousOffering,
      application: savedPreviousApplication,
    });

    //Create and save fake MSFAA Number.
    const savedPreviousMSFAANumber = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        {
          student: savedStudent,
        },
        {
          msfaaState: MSFAAStates.Signed,
          msfaaInitialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

    // Original assessment - first disbursement (Sent).
    const firstPreviousSchedule = createFakeDisbursementSchedule({
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
    firstPreviousSchedule.disbursementScheduleStatus =
      DisbursementScheduleStatus.Sent;
    firstPreviousSchedule.msfaaNumber = savedPreviousMSFAANumber;

    fakePreviousStudentAssessment.disbursementSchedules = [
      firstPreviousSchedule,
    ];

    // Save student assessment.
    const savedPreviousAssessment = await db.studentAssessment.save(
      fakePreviousStudentAssessment,
    );

    //Save application with the current assessment.
    savedPreviousApplication.currentAssessment = savedPreviousAssessment;
    await db.application.save(savedPreviousApplication);

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: savedApplication.currentAssessment.id,
    });
    const saveResult = await disbursementController.associateMSFAA(
      associateMSFAAPayload,
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(saveResult)).toBe(
      MockedZeebeJobResult.Complete,
    );
    // Fetch MSFAA Number for the student in SIMS.
    const createdMSFAANumber = await db.msfaaNumber.findOne({
      select: {
        id: true,
        msfaaNumber: true,
        dateSigned: true,
        dateRequested: true,
        serviceProviderReceivedDate: true,
        referenceApplication: { id: true },
      },
      relations: {
        referenceApplication: true,
      },
      where: {
        student: { id: savedStudent.id },
      },
    });
    // Assert MSFAA Number.
    expect(createdMSFAANumber.msfaaNumber).toBe(
      savedPreviousMSFAANumber.msfaaNumber,
    );
    // Assert date signed.
    expect(createdMSFAANumber.dateSigned).toBe(getISODateOnlyString(now));
    // Assert date requested.
    expect(createdMSFAANumber.dateRequested).not.toBe(null);
    // Assert service provider date.
    expect(createdMSFAANumber.serviceProviderReceivedDate).not.toBe(null);
  });

  it("Should throw Disbursement not found exception when MSFAA Number is tried to be created before disbursement.", async () => {
    // Arrange
    // Create and save user.
    const savedUser = await db.user.save(createFakeUser());

    // Create and save fake student.
    const savedStudent = await db.student.save(createFakeStudent(savedUser));

    // Create and save fake offering.
    const savedOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        { auditUser: savedUser, institutionLocation: collegeFLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

    // Create and save application.
    const savedApplication = await db.application.save(
      createFakeApplication(
        {
          student: savedStudent,
          location: collegeFLocation,
        },
        { initialValue: { applicationNumber: "TEST001" } },
      ),
    );

    //Create student assessment.
    const fakeStudentAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      offering: savedOffering,
      application: savedApplication,
    });

    // Save student assessment.
    const savedAssessment = await db.studentAssessment.save(
      fakeStudentAssessment,
    );

    //Save application with the current assessment.
    savedApplication.currentAssessment = savedAssessment;
    await db.application.save(savedApplication);

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: savedApplication.currentAssessment.id,
    });
    const saveResult = await disbursementController.associateMSFAA(
      associateMSFAAPayload,
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(saveResult)).toBe(
      MockedZeebeJobResult.Error,
    );
  });

  it("Should throw MSFAA number is already associated when MSFAA Number is already associated to a disbursement.", async () => {
    // Arrange
    // Create and save user.
    const savedUser = await db.user.save(createFakeUser());

    // Create and save fake student.
    const savedStudent = await db.student.save(createFakeStudent(savedUser));

    // Create and save fake offering.
    const savedOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        { auditUser: savedUser, institutionLocation: collegeFLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

    // Create and save application.
    const savedApplication = await db.application.save(
      createFakeApplication(
        {
          student: savedStudent,
          location: collegeFLocation,
        },
        { initialValue: { applicationNumber: "TEST001" } },
      ),
    );

    //Create student assessment.
    const fakeStudentAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
      offering: savedOffering,
      application: savedApplication,
    });

    //Create and save fake MSFAA Number.
    const savedMSFAANumber = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        {
          student: savedStudent,
        },
        {
          msfaaState: MSFAAStates.Signed,
          msfaaInitialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );

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
    firstSchedule.msfaaNumber = savedMSFAANumber;
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
    fakeStudentAssessment.disbursementSchedules = [
      firstSchedule,
      secondSchedule,
    ];

    // Save student assessment.
    const savedAssessment = await db.studentAssessment.save(
      fakeStudentAssessment,
    );

    //Save application with the current assessment.
    savedApplication.currentAssessment = savedAssessment;
    await db.application.save(savedApplication);

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: savedApplication.currentAssessment.id,
    });
    const saveResult = await disbursementController.associateMSFAA(
      associateMSFAAPayload,
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(saveResult)).toBe(
      MockedZeebeJobResult.Complete,
    );
  });
});
