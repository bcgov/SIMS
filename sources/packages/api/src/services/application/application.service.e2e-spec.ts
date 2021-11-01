require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseModule } from "../../database/database.module";
import {
  ApplicationService,
  ConfigService,
  EducationProgramOfferingService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  KeycloakService,
  MSFAANumberService,
  SequenceControlService,
  StudentFileService,
  TokensService,
  WorkflowActionsService,
  WorkflowService,
} from "..";
import { Connection, Repository } from "typeorm";
import {
  Application,
  ApplicationStatus,
  MSFAANumber,
  Student,
} from "../../database/entities";
import { createMockedJwtService } from "../../testHelpers/mocked-providers/jwt-service-mock";
import { createFakeApplication } from "../../testHelpers/fake-entities/application-fake";
import {
  createFakeEducationProgramOffering,
  createFakeMSFAANumber,
  createFakeStudent,
} from "../../testHelpers/fake-entities";
import { MAX_MFSAA_VALID_DAYS } from "../../utilities/system-configurations-constants";
import * as dayjs from "dayjs";

const createFakeApplicationInAssessment = (student: Student): Application => {
  const fakeApplication = createFakeApplication();
  fakeApplication.student = student;
  fakeApplication.offering = createFakeEducationProgramOffering();
  fakeApplication.offering.studyStartDate = new Date();
  fakeApplication.applicationStatus = ApplicationStatus.assessment;
  return fakeApplication;
};

const createDateInMSFAAValidPeriod = (increment: number): Date => {
  return dayjs()
    .subtract(MAX_MFSAA_VALID_DAYS + increment, "days")
    .toDate();
};

describe("ApplicationService", () => {
  let applicationService: ApplicationService;
  let msfaaNumberService: MSFAANumberService;
  let applicationRepository: Repository<Application>;
  let msfaaNumberRepository: Repository<MSFAANumber>;
  let studentRepository: Repository<Student>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [
        ApplicationService,
        StudentFileService,
        EducationProgramOfferingService,
        SequenceControlService,
        WorkflowActionsService,
        WorkflowService,
        MSFAANumberService,
        KeycloakService,
        ConfigService,
        TokensService,
        createMockedJwtService(),
      ],
    }).compile();

    const connection = module.get(Connection);
    applicationService = module.get(ApplicationService);
    msfaaNumberService = module.get(MSFAANumberService);
    applicationRepository = connection.getRepository(Application);
    msfaaNumberRepository = connection.getRepository(MSFAANumber);
    studentRepository = connection.getRepository(Student);
    jest.spyOn(msfaaNumberService, "createMSFAANumber");
  });

  describe("associateMSFAANumber", () => {
    it("should throw an exception when application is not in the correct state", async () => {
      // Create fake application to have the MSFAA associated.
      const fakeApplication = createFakeApplication();
      fakeApplication.applicationStatus = ApplicationStatus.submitted;
      const testApplication = await applicationRepository.save(fakeApplication);

      try {
        await applicationService.associateMSFAANumber(testApplication.id);
      } catch (error) {
        expect(error.name === INVALID_OPERATION_IN_THE_CURRENT_STATUS);
      } finally {
        await applicationRepository.remove(testApplication);
      }
    });

    it("should associate a pending MSFAA as a priority when it exists", async () => {
      // Student used along this test.
      const testStudent = await studentRepository.save(createFakeStudent());
      // MSFAA record to be used along this test.
      const fakeMSFAANumber = createFakeMSFAANumber(testStudent);
      // Enforce that the MSFAA will be in pending state.
      fakeMSFAANumber.dateSigned = null;
      const testMSFAANumber = await msfaaNumberRepository.save(fakeMSFAANumber);
      // Create fake application to have the MSFAA associated.
      const fakeApplication = createFakeApplicationInAssessment(testStudent);
      const testApplication = await applicationRepository.save(fakeApplication);

      try {
        const savedApplication = await applicationService.associateMSFAANumber(
          testApplication.id,
        );
        expect(savedApplication.msfaaNumber).toBeTruthy();
        expect(savedApplication.msfaaNumber.id).toBe(testMSFAANumber.id);
      } finally {
        await applicationRepository.remove(testApplication);
        await msfaaNumberRepository.remove(testMSFAANumber);
        await studentRepository.remove(testStudent);
      }
    });

    it("should associate an existing MSFAA as a priority when it was signed inside the validity period.", async () => {
      // Student used along this test.
      const testStudent = await studentRepository.save(createFakeStudent());
      // MSFAA record to be used along this test.
      const fakeMSFAANumber = createFakeMSFAANumber(testStudent);
      // Enforce that the MSFAA will be in a valid period.
      fakeMSFAANumber.dateSigned = createDateInMSFAAValidPeriod(-1);
      const testMSFAANumber = await msfaaNumberRepository.save(fakeMSFAANumber);
      // Create fake application to have the MSFAA associated.
      const fakeApplication = createFakeApplicationInAssessment(testStudent);
      const testApplication = await applicationRepository.save(fakeApplication);

      try {
        const savedApplication = await applicationService.associateMSFAANumber(
          testApplication.id,
        );
        expect(savedApplication.msfaaNumber).toBeTruthy();
        expect(savedApplication.msfaaNumber.id).toBe(testMSFAANumber.id);
      } finally {
        await applicationRepository.remove(testApplication);
        await msfaaNumberRepository.remove(testMSFAANumber);
        await studentRepository.remove(testStudent);
      }
    });

    it("should create a new MSFAA record when a completed and signed application exists but the MSFAA period is expired", async () => {
      // Student used along this test.
      const testStudent = await studentRepository.save(createFakeStudent());
      // MSFAA record to be used.
      const fakeMSFAANumber = createFakeMSFAANumber(testStudent);
      // Make the dateSigned old enough to be considered expired.
      fakeMSFAANumber.dateSigned = createDateInMSFAAValidPeriod(1);
      const testMSFAANumber = await msfaaNumberRepository.save(fakeMSFAANumber);

      // Create a completed and signed fake application.
      const fakeCompletedApplication = createFakeApplication();
      fakeCompletedApplication.student = testStudent;
      fakeCompletedApplication.offering = createFakeEducationProgramOffering();
      // Make the application be considered outside the valid period.
      fakeCompletedApplication.offering.studyEndDate =
        createDateInMSFAAValidPeriod(1);
      fakeCompletedApplication.msfaaNumber = testMSFAANumber;
      fakeCompletedApplication.applicationStatus = ApplicationStatus.completed;
      const testCompletedApplication = await applicationRepository.save(
        fakeCompletedApplication,
      );

      // Create an application to receive the new MSFAA.
      const fakeApplication = createFakeApplicationInAssessment(testStudent);
      const testApplication = await applicationRepository.save(fakeApplication);

      try {
        const savedApplication = await applicationService.associateMSFAANumber(
          testApplication.id,
        );
        expect(savedApplication.msfaaNumber).toBeTruthy();
        expect(savedApplication.msfaaNumber.id).not.toBe(testMSFAANumber.id);
        expect(msfaaNumberService.createMSFAANumber).toHaveBeenCalled();
      } finally {
        await applicationRepository.remove(testApplication);
        await applicationRepository.remove(testCompletedApplication);
        await msfaaNumberRepository.remove(testMSFAANumber);
        await studentRepository.remove(testStudent);
      }
    });

    it("should reuse an existing MSFAA record when a complete and signed application exists and it is not expired", async () => {
      // Student used along this test.
      const testStudent = await studentRepository.save(createFakeStudent());
      // MSFAA record to be used along this test.
      const fakeMSFAANumber = createFakeMSFAANumber(testStudent);
      // Make the dateSigned be expired.
      // This will force the MSFAA to be considered valid due to the
      // previous application offering end date and current application
      // offering start date, since the MSFAA is expired.
      fakeMSFAANumber.dateSigned = createDateInMSFAAValidPeriod(1);
      const testMSFAANumber = await msfaaNumberRepository.save(fakeMSFAANumber);

      // Create a completed and signed fake application wth an
      // offering end date still inside the MSFAA valid period.
      const fakeCompletedApplication = createFakeApplication();
      fakeCompletedApplication.student = testStudent;
      fakeCompletedApplication.offering = createFakeEducationProgramOffering();
      // Make the application be considered still in the valid MSFAA period.
      fakeCompletedApplication.offering.studyEndDate =
        createDateInMSFAAValidPeriod(-1);
      fakeCompletedApplication.msfaaNumber = testMSFAANumber;
      fakeCompletedApplication.applicationStatus = ApplicationStatus.completed;
      const testCompletedApplication = await applicationRepository.save(
        fakeCompletedApplication,
      );

      // Create an application to receive the new MSFAA.
      const fakeApplication = createFakeApplicationInAssessment(testStudent);
      const testApplication = await applicationRepository.save(fakeApplication);

      try {
        const savedApplication = await applicationService.associateMSFAANumber(
          testApplication.id,
        );
        expect(savedApplication.msfaaNumber).toBeTruthy();
        expect(savedApplication.msfaaNumber.id).toBe(testMSFAANumber.id);
      } finally {
        await applicationRepository.remove(testCompletedApplication);
        await applicationRepository.remove(testApplication);
        await msfaaNumberRepository.remove(testMSFAANumber);
        await studentRepository.remove(testStudent);
      }
    });
  });

  describe("getPreviouslySignedApplication", () => {
    it("should be able to find a completed application with an MSFAA number associated", async () => {
      // Student used along this test.
      const testStudent = await studentRepository.save(createFakeStudent());
      // MSFAA record to be used along this test.
      const fakeMSFAANumber = createFakeMSFAANumber(testStudent);
      fakeMSFAANumber.dateSigned = new Date();
      const testMSFAANumber = await msfaaNumberRepository.save(fakeMSFAANumber);
      // Date to be assigned to the offering end date of the record to be retrieved.
      const expectedEndDate = new Date();
      expectedEndDate.setHours(0, 0, 0, 0);
      // Create fake application that must be returned.
      const fakeApplication = createFakeApplicationInAssessment(testStudent);
      fakeApplication.offering.studyEndDate = expectedEndDate;
      fakeApplication.msfaaNumber = testMSFAANumber;
      fakeApplication.applicationStatus = ApplicationStatus.completed;
      const testApplication = await applicationRepository.save(fakeApplication);
      // Create a fake application with an offering end data older than the previous one.
      // While querying the database the testApplication must be retrieve instead of this one.
      const olderFakeApplication = createFakeApplication();
      olderFakeApplication.student = testStudent;
      olderFakeApplication.offering = createFakeEducationProgramOffering();
      olderFakeApplication.offering.studyEndDate = dayjs(expectedEndDate)
        .subtract(1, "days")
        .toDate();
      olderFakeApplication.msfaaNumber = testMSFAANumber;
      olderFakeApplication.applicationStatus = ApplicationStatus.completed;
      // Save older fake application.
      await applicationRepository.save(olderFakeApplication);

      try {
        const previouslySignedApplication =
          await applicationService.getPreviouslySignedApplication(
            testStudent.id,
          );
        expect(previouslySignedApplication).toBeTruthy();
        expect(previouslySignedApplication.id).toBe(testApplication.id);
        expect(previouslySignedApplication.msfaaNumber.id).toBe(
          testMSFAANumber.id,
        );
        expect(previouslySignedApplication.offering.studyEndDate).toStrictEqual(
          expectedEndDate,
        );
      } finally {
        await applicationRepository.remove(testApplication);
        await applicationRepository.remove(olderFakeApplication);
        await msfaaNumberRepository.remove(testMSFAANumber);
        await studentRepository.remove(testStudent);
      }
    });
  });
});
