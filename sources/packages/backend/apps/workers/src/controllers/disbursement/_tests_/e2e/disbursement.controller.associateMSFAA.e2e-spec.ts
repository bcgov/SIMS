import {
  createE2EDataSources,
  createFakeMSFAANumber,
  E2EDataSources,
  MSFAAStates,
  saveFakeApplication,
  saveFakeApplicationDisbursements,
  saveFakeSFASIndividual,
  saveFakeStudent,
} from "@sims/test-utils";
import { DisbursementController } from "../../disbursement.controller";
import { createTestingAppModule } from "../../../../../test/helpers";
import { createFakeSFASPartTimeApplication } from "@sims/test-utils/factories/sfas-part-time-application";
import {
  addDays,
  getISODateOnlyString,
  MAX_MSFAA_VALID_DAYS,
} from "@sims/utilities";
import { createFakeAssociateMSFAAPayload } from "./associate-MSFAA-payloads";
import {
  ApplicationStatus,
  DisbursementScheduleStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  FakeWorkerJobResult,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createFakeSFASApplication } from "@sims/test-utils/factories/sfas-application";

describe("DisbursementController(e2e)-associateMSFAA", () => {
  let db: E2EDataSources;
  let disbursementController: DisbursementController;
  const now = new Date();

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    disbursementController = nestApplication.get(DisbursementController);
  });

  it("Should reuse a part-time MSFAA number for a part-time application if the MSFAA is signed and the signed date is within the valid period.", async () => {
    // Arrange
    // Create student and save fake application with disbursements.
    const student = await saveFakeStudent(db.dataSource);
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );

    // Create and save fake MSFAA Number.
    const savedMSFAANumber = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        {
          student: student,
        },
        {
          msfaaState: MSFAAStates.Signed,
          msfaaInitialValues: {
            offeringIntensity: OfferingIntensity.partTime,
          },
        },
      ),
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: application.currentAssessment.id,
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
        student: { id: student.id },
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
  });

  it("Should reuse the MSFAA Number from SIMS when MSFAA number is already generated and the request is pending for verification.", async () => {
    // Arrange
    // Create student and save fake application with disbursements.
    const student = await saveFakeStudent(db.dataSource);
    const currentMSFAA = createFakeMSFAANumber(
      { student },
      {
        msfaaState: MSFAAStates.Pending,
      },
    );
    await db.msfaaNumber.save(currentMSFAA);
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: application.currentAssessment.id,
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
        student: { id: student.id },
      },
    });
    // Assert MSFAA Number.
    expect(assignedMSFAANumber.msfaaNumber).toEqual(currentMSFAA.msfaaNumber);
  });

  it("Should reuse the part-time MSFAA number from SFAS part-time applications creating and activating it in SIMS when a valid MSFAA was found in SFAS.", async () => {
    // Arrange
    const firstLegacyApplicationStartDate = addDays(-100);
    const firstLegacyApplicationEndDate = addDays(-10);

    // Create student and save fake application with disbursements.
    const student = await saveFakeStudent(db.dataSource);
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );

    const savedSFASIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { id: student.id },
    });
    const savedSFASPartTimeApplication = await db.sfasPartTimeApplications.save(
      createFakeSFASPartTimeApplication(
        { individual: savedSFASIndividual },
        {
          initialValues: {
            startDate: getISODateOnlyString(firstLegacyApplicationStartDate),
            endDate: getISODateOnlyString(firstLegacyApplicationEndDate),
          },
        },
      ),
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: application.currentAssessment.id,
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
        student: { id: student.id },
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
    expect(assignedMSFAANumber.referenceApplication.id).toBe(application.id);
  });

  it("Should create a new MSFAA number for part-time applications by creating and activating in SIMS when MSFAA is not found or invalid SFAS application offering end date.", async () => {
    // Arrange
    const firstLegacyApplicationStartDate = addDays(-MAX_MSFAA_VALID_DAYS + 10);
    const firstLegacyApplicationEndDate = addDays(-MAX_MSFAA_VALID_DAYS + 2);

    // Create student and save fake application with disbursements.
    const student = await saveFakeStudent(db.dataSource);
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );

    const savedSFASIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { id: student.id },
    });

    await db.sfasPartTimeApplications.save(
      createFakeSFASPartTimeApplication(
        { individual: savedSFASIndividual },
        {
          initialValues: {
            startDate: getISODateOnlyString(firstLegacyApplicationStartDate),
            endDate: getISODateOnlyString(firstLegacyApplicationEndDate),
          },
        },
      ),
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: application.currentAssessment.id,
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
        student: { id: student.id },
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
    expect(createdMSFAANumber.referenceApplication.id).toBe(application.id);
  });

  it("Should reuse the MSFAA Number from SFAS full applications by creating and activating in SIMS when there is a valid MSFAA found and date signed updated with application end date.", async () => {
    // Arrange
    const firstLegacyApplicationStartDate = addDays(-100);
    const firstLegacyApplicationEndDate = addDays(-10);

    // Create student and save fake application with disbursements.
    const student = await saveFakeStudent(db.dataSource);
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );

    const savedSFASIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { id: student.id },
    });
    const savedSFASPartTimeApplication = await db.sfasApplication.save(
      createFakeSFASApplication(
        { individual: savedSFASIndividual },
        {
          initialValues: {
            startDate: getISODateOnlyString(firstLegacyApplicationStartDate),
            endDate: getISODateOnlyString(firstLegacyApplicationEndDate),
          },
        },
      ),
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: application.currentAssessment.id,
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
        student: { id: student.id },
      },
    });
    // Assert MSFAA Number.
    expect(assignedMSFAANumber.msfaaNumber).toEqual(
      savedSFASIndividual.msfaaNumber,
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
    expect(assignedMSFAANumber.referenceApplication.id).toBe(application.id);
  });

  it("Should create new MSFAA Number for full applications by creating and activating in SIMS when MSFAA is not found or invalid SFAS application offering end date.", async () => {
    // Arrange
    const firstLegacyApplicationStartDate = addDays(-MAX_MSFAA_VALID_DAYS + 10);
    const firstLegacyApplicationEndDate = addDays(-MAX_MSFAA_VALID_DAYS + 2);

    // Create student and save fake application with disbursements.
    const student = await saveFakeStudent(db.dataSource);
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );

    const savedSFASIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { id: student.id },
    });

    await db.sfasApplication.save(
      createFakeSFASApplication(
        { individual: savedSFASIndividual },
        {
          initialValues: {
            startDate: getISODateOnlyString(firstLegacyApplicationStartDate),
            endDate: getISODateOnlyString(firstLegacyApplicationEndDate),
          },
        },
      ),
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: application.currentAssessment.id,
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
        student: { id: student.id },
      },
    });
    // Assert MSFAA Number.
    expect(createdMSFAANumber.msfaaNumber).not.toBe(
      savedSFASIndividual.msfaaNumber,
    );
    // Assert date signed.
    expect(createdMSFAANumber.dateSigned).toBe(null);
    // Assert date requested.
    expect(createdMSFAANumber.dateRequested).toBe(null);
    // Assert service provider date.
    expect(createdMSFAANumber.serviceProviderReceivedDate).toBe(null);
    // Assert application.
    expect(createdMSFAANumber.referenceApplication.id).toBe(application.id);
  });

  it("Should reuse MSFAA Number for part time application when MSFAA is found for previously signed disbursement for part applications in SIMS.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Create and save fake MSFAA Number.
    const savedMSFAANumber = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        {
          student: student,
        },
        {
          msfaaState: MSFAAStates.Signed,
          msfaaInitialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            dateSigned: getISODateOnlyString(
              addDays(-MAX_MSFAA_VALID_DAYS + 1),
            ),
          },
        },
      ),
    );
    // Create previous fake application with disbursements.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: savedMSFAANumber },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        firstDisbursementInitialValues: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
        createSecondDisbursement: true,
      },
    );

    // Create student and save fake application with disbursements.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        createSecondDisbursement: true,
      },
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: application.currentAssessment.id,
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
        student: { id: student.id },
      },
    });
    // Assert MSFAA Number.
    expect(assignedMSFAANumber.msfaaNumber).toBe(savedMSFAANumber.msfaaNumber);
    // Assert date signed.
    expect(assignedMSFAANumber.dateSigned).toBe(savedMSFAANumber.dateSigned);
    // Assert date requested.
    expect(assignedMSFAANumber.dateRequested).not.toBe(null);
    // Assert service provider date.
    expect(assignedMSFAANumber.serviceProviderReceivedDate).not.toBe(null);
  });

  it("Should create new MSFAA number for part-time application when MSFAA is found for previously signed disbursement and its offering end date is not between the valid date.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Create and save fake MSFAA Number.
    const savedMSFAANumber = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        {
          student: student,
        },
        {
          msfaaState: MSFAAStates.Signed,
          msfaaInitialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            dateSigned: getISODateOnlyString(
              addDays(-MAX_MSFAA_VALID_DAYS + 1),
            ),
          },
        },
      ),
    );
    // Create previous fake application with disbursements.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: savedMSFAANumber },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        firstDisbursementInitialValues: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
        offeringInitialValues: {
          studyStartDate: getISODateOnlyString(
            addDays(-MAX_MSFAA_VALID_DAYS + 2),
          ),
          studyEndDate: getISODateOnlyString(
            addDays(-MAX_MSFAA_VALID_DAYS + 1),
          ),
        },
        createSecondDisbursement: true,
      },
    );

    // Create student and save fake application with disbursements.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        createSecondDisbursement: true,
      },
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: application.currentAssessment.id,
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
        student: { id: student.id },
      },
      order: {
        id: { direction: "DESC" },
      },
    });
    // Assert MSFAA Number.
    expect(createdMSFAANumber.msfaaNumber).not.toBe(null);
    expect(createdMSFAANumber.msfaaNumber).not.toBe(
      savedMSFAANumber.msfaaNumber,
    );
    // Assert date signed.
    expect(createdMSFAANumber.dateSigned).toBe(null);
    // Assert date requested.
    expect(createdMSFAANumber.dateRequested).toBe(null);
    // Assert service provider date.
    expect(createdMSFAANumber.serviceProviderReceivedDate).toBe(null);
  });

  it("Should throw Disbursement not found exception when MSFAA Number is tried to be created before disbursement.", async () => {
    // Arrange
    // Create save fake application without disbursements.
    const application = await saveFakeApplication(db.dataSource);

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: application.currentAssessment.id,
    });
    const saveResult = await disbursementController.associateMSFAA(
      associateMSFAAPayload,
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(saveResult)).toBe(
      MockedZeebeJobResult.Error,
    );
  });

  it("Should return 'Completed' when the MSFAA is already associated.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Create and save fake MSFAA Number.
    const savedMSFAANumber = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        {
          student: student,
        },
        {
          msfaaState: MSFAAStates.Signed,
          msfaaInitialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      ),
    );
    // Create save fake application with disbursements.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: savedMSFAANumber },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        createSecondDisbursement: true,
      },
    );

    // Act
    const associateMSFAAPayload = createFakeAssociateMSFAAPayload({
      assessmentId: application.currentAssessment.id,
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
