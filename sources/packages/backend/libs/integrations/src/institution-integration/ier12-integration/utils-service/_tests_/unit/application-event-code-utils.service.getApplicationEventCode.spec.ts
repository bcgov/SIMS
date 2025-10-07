import {
  ApplicationStatus,
  COEStatus,
  DisbursementScheduleStatus,
  RestrictionActionType,
} from "@sims/sims-db";
import {
  ApplicationEventCode,
  DisbursementScheduleForApplicationEventCode,
} from "../../../models/ier12-integration.model";
import {
  ApplicationEventCodeDuringAssessmentUtilsService,
  ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService,
  ApplicationEventCodeUtilsService,
} from "../..";
import { DATE_ONLY_ISO_FORMAT, formatDate } from "@sims/utilities";
import { createMock } from "@golevelup/ts-jest";

describe("ApplicationEventCodeUtilsService-getApplicationEventCode", () => {
  let applicationEventCodeUtilsService: ApplicationEventCodeUtilsService;
  let applicationEventCodeDuringAssessmentUtilsService: ApplicationEventCodeDuringAssessmentUtilsService;
  let applicationEventCodeDuringEnrolmentAndCompletedUtilsService: ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService;
  let payload: DisbursementScheduleForApplicationEventCode;
  let applicationNumber: string;
  let activeRestrictionsActionTypes: RestrictionActionType[][];

  beforeAll(() => {
    applicationEventCodeDuringAssessmentUtilsService =
      createMock<ApplicationEventCodeDuringAssessmentUtilsService>();
    applicationEventCodeDuringEnrolmentAndCompletedUtilsService =
      createMock<ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService>();
    applicationEventCodeUtilsService = new ApplicationEventCodeUtilsService(
      applicationEventCodeDuringAssessmentUtilsService,
      applicationEventCodeDuringEnrolmentAndCompletedUtilsService,
    );

    // Arrange.
    payload = {
      coeStatus: COEStatus.completed,
      disbursementDate: formatDate(new Date(), DATE_ONLY_ISO_FORMAT),
      disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
    };
    applicationNumber = "999999999";
    activeRestrictionsActionTypes = [];
  });

  it(`Should return ${ApplicationEventCode.DISC} when the application status is ${ApplicationStatus.Cancelled}.`, async () => {
    // Arrange
    const currentDisbursementSchedule = {
      ...payload,
      coeStatus: COEStatus.required,
    };

    // Act
    const applicationEventCode =
      await applicationEventCodeUtilsService.getApplicationEventCode(
        applicationNumber,
        ApplicationStatus.Cancelled,
        currentDisbursementSchedule,
      );

    // Assert
    expect(applicationEventCode).toBe(ApplicationEventCode.DISC);
  });

  it(`Should call applicationEventCodeDuringAssessment when the application status is ${ApplicationStatus.Assessment}.`, async () => {
    // Act
    await applicationEventCodeUtilsService.getApplicationEventCode(
      applicationNumber,
      ApplicationStatus.Assessment,
      payload,
    );

    // Assert
    expect(
      applicationEventCodeDuringAssessmentUtilsService.applicationEventCodeDuringAssessment,
    ).toHaveBeenCalledWith(applicationNumber);
  });

  it(`Should call applicationEventCodeDuringEnrolmentAndCompleted when the application status is ${ApplicationStatus.Enrolment}.`, async () => {
    // Act
    await applicationEventCodeUtilsService.getApplicationEventCode(
      applicationNumber,
      ApplicationStatus.Enrolment,
      payload,
    );

    // Assert
    expect(
      applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringEnrolmentAndCompleted,
    ).toHaveBeenCalledWith(payload.coeStatus);
  });

  it(`Should call applicationEventCodeDuringCompleted when the application status is ${ApplicationStatus.Completed}.`, async () => {
    // Act
    await applicationEventCodeUtilsService.getApplicationEventCode(
      applicationNumber,
      ApplicationStatus.Completed,
      payload,
      activeRestrictionsActionTypes,
    );

    // Assert
    expect(
      applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted,
    ).toHaveBeenCalledWith(payload, activeRestrictionsActionTypes);
  });
});
