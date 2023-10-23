import { ApplicationEventCode } from "../../../models/ier12-integration.model";
import { ApplicationEventCodeDuringAssessmentUtilsService } from "../..";
import { ApplicationSharedService } from "@sims/services";
import { createMock } from "@golevelup/ts-jest";

describe("ApplicationEventCodeDuringAssessmentUtilsService-applicationEventCodeDuringAssessment", () => {
  let applicationEventCodeDuringAssessmentUtilsService: ApplicationEventCodeDuringAssessmentUtilsService;
  let applicationSharedService: ApplicationSharedService;
  let applicationNumber: string;

  beforeAll(() => {
    applicationSharedService = createMock<ApplicationSharedService>();
    applicationEventCodeDuringAssessmentUtilsService =
      new ApplicationEventCodeDuringAssessmentUtilsService(
        applicationSharedService,
      );

    // Arrange
    applicationNumber = "9999999999";
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it(`Should return ${ApplicationEventCode.REIA} when there are multiple submissions to the application.`, async () => {
    // Arrange
    // Mocked hasMultipleApplicationSubmissions to return true, i.e. has multiple submissions.
    applicationSharedService.hasMultipleApplicationSubmissions = jest
      .fn()
      .mockResolvedValue(true);

    // Act
    const applicationEventCode =
      await applicationEventCodeDuringAssessmentUtilsService.applicationEventCodeDuringAssessment(
        applicationNumber,
      );

    // Assert
    expect(applicationEventCode).toBe(ApplicationEventCode.REIA);
  });

  it(`Should return ${ApplicationEventCode.ASMT} when there is no multiple submission to the application.`, async () => {
    // Arrange
    // Mocked hasMultipleApplicationSubmissions to return false, i.e. there is no multiple submissions.
    applicationSharedService.hasMultipleApplicationSubmissions = jest
      .fn()
      .mockResolvedValue(false);

    // Act
    const applicationEventCode =
      await applicationEventCodeDuringAssessmentUtilsService.applicationEventCodeDuringAssessment(
        applicationNumber,
      );

    // Assert
    expect(applicationEventCode).toBe(ApplicationEventCode.ASMT);
  });
});
