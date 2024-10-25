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

    // Fetch MSFAA Number for the disbursement schedule assigned to the student in SIMS.
    const disbursementSchedule = await db.disbursementSchedule.findOne({
      select: {
        id: true,
        msfaaNumber: { id: true },
      },
      relations: {
        msfaaNumber: true,
        studentAssessment: true,
      },
      where: {
        studentAssessment: { id: application.currentAssessment.id },
      },
    });
    // Assert MSFAA Number.
    expect(disbursementSchedule.msfaaNumber.id).toBe(savedMSFAANumber.id);
  });

  it("Should reuse the MSFAA Number from SIMS when MSFAA number is already generated and the request is pending for verification.", async () => {
    // Arrange
    // Create student and save fake application with disbursements.
    const student = await saveFakeStudent(db.dataSource);
    const currentMSFAA = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        { student },
        {
          msfaaState: MSFAAStates.Pending,
        },
      ),
    );
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

    // Fetch MSFAA Number for the disbursement schedule assigned to the student in SIMS.
    const disbursementSchedule = await db.disbursementSchedule.findOne({
      select: {
        id: true,
        msfaaNumber: { id: true },
      },
      relations: {
        msfaaNumber: true,
        studentAssessment: true,
      },
      where: {
        studentAssessment: { id: application.currentAssessment.id },
      },
    });
    // Assert MSFAA Number.
    expect(disbursementSchedule.msfaaNumber.id).toBe(currentMSFAA.id);
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
    const pendingMSFAA = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        { student },
        {
          msfaaState: MSFAAStates.Pending,
          msfaaInitialValues: {
            offeringIntensity: OfferingIntensity.partTime,
          },
        },
      ),
    );

    const savedSFASIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { student: student },
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

    // Fetch MSFAA Number for the disbursement schedule assigned to the student in SIMS.
    await db.disbursementSchedule.findOne({
      select: {
        id: true,
        msfaaNumber: { id: true, msfaaNumber: true },
      },
      relations: {
        msfaaNumber: true,
        studentAssessment: true,
      },
      where: {
        studentAssessment: { id: application.currentAssessment.id },
      },
    });
    // Fetch MSFAA Number for the student in SIMS.
    const [createdMSFAANumber, cancelledMSFAANumber] =
      await db.msfaaNumber.find({
        select: {
          id: true,
          cancelledDate: true,
          msfaaNumber: true,
          referenceApplication: { id: true },
          serviceProviderReceivedDate: true,
          dateRequested: true,
          dateSigned: true,
        },
        relations: {
          referenceApplication: true,
        },
        where: {
          student: { id: student.id },
        },
        order: {
          id: "DESC",
        },
      });

    // Assert MSFAA Number.
    expect(createdMSFAANumber).toEqual({
      id: expect.any(Number),
      msfaaNumber: savedSFASIndividual.partTimeMSFAANumber,
      dateSigned: savedSFASPartTimeApplication.endDate,
      referenceApplication: { id: application.id },
      serviceProviderReceivedDate: null,
      dateRequested: null,
      cancelledDate: null,
    });
    expect(cancelledMSFAANumber.msfaaNumber).toBe(pendingMSFAA.msfaaNumber);
    expect(cancelledMSFAANumber.cancelledDate).not.toBe(null);
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
        cancelledDate: true,
        msfaaNumber: true,
        referenceApplication: { id: true },
        serviceProviderReceivedDate: true,
        dateRequested: true,
        dateSigned: true,
      },
      relations: {
        referenceApplication: true,
      },
      where: {
        student: { id: student.id },
      },
    });
    // Fetch MSFAA Number for the disbursement schedule assigned to the student in SIMS.
    const disbursementSchedule = await db.disbursementSchedule.findOne({
      select: {
        id: true,
        msfaaNumber: { id: true, msfaaNumber: true },
      },
      relations: {
        msfaaNumber: true,
        studentAssessment: true,
      },
      where: {
        studentAssessment: { id: application.currentAssessment.id },
      },
    });
    // Assert MSFAA Number.
    expect(createdMSFAANumber).toEqual({
      id: expect.any(Number),
      msfaaNumber: disbursementSchedule.msfaaNumber.msfaaNumber,
      referenceApplication: { id: application.id },
      dateSigned: null,
      serviceProviderReceivedDate: null,
      dateRequested: null,
      cancelledDate: null,
    });
  });

  it("Should reuse the MSFAA Number from SFAS full-time applications by creating and activating in SIMS when there is a valid MSFAA found and date signed updated with application end date.", async () => {
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

    const pendingMSFAA = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        { student },
        {
          msfaaState: MSFAAStates.Pending,
          msfaaInitialValues: {
            offeringIntensity: OfferingIntensity.fullTime,
          },
        },
      ),
    );

    const savedSFASIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: { student: student },
    });
    const savedSFASFullTimeApplication = await db.sfasApplication.save(
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

    // Fetch MSFAA Number for the disbursement schedule assigned to the student in SIMS.
    await db.disbursementSchedule.findOne({
      select: {
        id: true,
        msfaaNumber: { id: true, msfaaNumber: true },
      },
      relations: {
        msfaaNumber: true,
        studentAssessment: true,
      },
      where: {
        studentAssessment: { id: application.currentAssessment.id },
      },
    });
    // Fetch MSFAA Number for the student in SIMS.
    const [createdMSFAANumber, cancelledMSFAANumber] =
      await db.msfaaNumber.find({
        select: {
          id: true,
          cancelledDate: true,
          msfaaNumber: true,
          referenceApplication: { id: true },
          serviceProviderReceivedDate: true,
          dateRequested: true,
          dateSigned: true,
        },
        relations: {
          referenceApplication: true,
        },
        where: {
          student: { id: student.id },
        },
        order: {
          id: "DESC",
        },
      });
    // Assert MSFAA Number.
    expect(createdMSFAANumber).toEqual({
      id: expect.any(Number),
      msfaaNumber: savedSFASIndividual.msfaaNumber,
      dateSigned: savedSFASFullTimeApplication.endDate,
      referenceApplication: { id: application.id },
      serviceProviderReceivedDate: null,
      dateRequested: null,
      cancelledDate: null,
    });
    expect(cancelledMSFAANumber.msfaaNumber).toBe(pendingMSFAA.msfaaNumber);
    expect(cancelledMSFAANumber.cancelledDate).not.toBe(null);
  });

  it("Should create new MSFAA Number for full-time applications by creating and activating in SIMS when MSFAA is not found or invalid SFAS application offering end date.", async () => {
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
        cancelledDate: true,
        msfaaNumber: true,
        referenceApplication: { id: true },
        serviceProviderReceivedDate: true,
        dateRequested: true,
        dateSigned: true,
      },
      relations: {
        referenceApplication: true,
      },
      where: {
        student: { id: student.id },
      },
    });
    // Fetch MSFAA Number for the disbursement schedule assigned to the student in SIMS.
    const disbursementSchedule = await db.disbursementSchedule.findOne({
      select: {
        id: true,
        msfaaNumber: { id: true, msfaaNumber: true },
      },
      relations: {
        msfaaNumber: true,
        studentAssessment: true,
      },
      where: {
        studentAssessment: { id: application.currentAssessment.id },
      },
    });
    // Assert MSFAA Number.
    expect(disbursementSchedule.msfaaNumber.id).toBe(createdMSFAANumber.id);
    expect(createdMSFAANumber).toEqual({
      id: expect.any(Number),
      msfaaNumber: disbursementSchedule.msfaaNumber.msfaaNumber,
      referenceApplication: { id: application.id },
      dateSigned: null,
      serviceProviderReceivedDate: null,
      dateRequested: null,
      cancelledDate: null,
    });
  });

  it("Should reuse MSFAA number for part-time application when MSFAA is found for previously signed disbursement for part-time applications in SIMS.", async () => {
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

    // Fetch MSFAA Number for the disbursement schedule assigned to the student in SIMS.
    const [firstDisbursementSchedule, secondDisbursementSchedule] =
      await db.disbursementSchedule.find({
        select: {
          id: true,
          msfaaNumber: { id: true },
        },
        relations: {
          msfaaNumber: true,
          studentAssessment: true,
        },
        where: {
          studentAssessment: { id: application.currentAssessment.id },
        },
      });
    // Assert MSFAA Number.
    expect(firstDisbursementSchedule.msfaaNumber.id).toBe(savedMSFAANumber.id);
    expect(secondDisbursementSchedule.msfaaNumber.id).toBe(savedMSFAANumber.id);
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
    // Fetch MSFAA Number for the disbursement schedule assigned to the student in SIMS.
    const [firstDisbursementSchedule, secondDisbursementSchedule] =
      await db.disbursementSchedule.find({
        select: {
          id: true,
          msfaaNumber: { id: true },
        },
        relations: {
          msfaaNumber: true,
          studentAssessment: true,
        },
        where: {
          studentAssessment: { id: application.currentAssessment.id },
        },
      });
    // Assert MSFAA Number.
    expect(firstDisbursementSchedule.msfaaNumber.id).toBe(
      createdMSFAANumber.id,
    );
    expect(secondDisbursementSchedule.msfaaNumber.id).toBe(
      createdMSFAANumber.id,
    );
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
