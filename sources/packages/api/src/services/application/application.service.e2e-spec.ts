require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseModule } from "../../database/database.module";
import {
  ApplicationService,
  ConfigService,
  EducationProgramOfferingService,
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
import * as dayjs from "dayjs";

describe("ApplicationService", () => {
  let applicationService: ApplicationService;
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
    applicationRepository = connection.getRepository(Application);
    msfaaNumberRepository = connection.getRepository(MSFAANumber);
    studentRepository = connection.getRepository(Student);
  });

  it("should be able to find a completed application with an MSFAA number associated", async () => {
    const testStudent = await studentRepository.save(createFakeStudent());

    const fakeMSFAANumber = createFakeMSFAANumber(testStudent);
    fakeMSFAANumber.dateSigned = new Date();
    const testMSFAANumber = await msfaaNumberRepository.save(fakeMSFAANumber);

    const fakeOffering = createFakeEducationProgramOffering();
    fakeOffering.studyStartDate = dayjs(new Date())
      .subtract(1, "year")
      .toDate();
    fakeOffering.studyEndDate = new Date();

    // Create fake application.
    const fakeApplication = createFakeApplication();
    fakeApplication.student = testStudent;
    fakeApplication.offering = fakeOffering;
    fakeApplication.msfaaNumber = testMSFAANumber;
    fakeApplication.applicationStatus = ApplicationStatus.completed;

    // Save fake application.
    const testApplication = await applicationRepository.save(fakeApplication);

    try {
      const previouslySignedApplication =
        await applicationService.getPreviouslySignedApplication(testStudent.id);

      expect(previouslySignedApplication).toBeTruthy();
      expect(previouslySignedApplication.id).toBe(testApplication.id);
      expect(previouslySignedApplication.msfaaNumber.id).toBe(
        testMSFAANumber.id,
      );
      expect(previouslySignedApplication.offering.studyEndDate).toBe(
        fakeOffering.studyEndDate,
      );
    } finally {
      await applicationRepository.remove(testApplication);
      await msfaaNumberRepository.remove(testMSFAANumber);
      await studentRepository.remove(testStudent);
    }
  });
});
