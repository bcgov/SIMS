import {
  COEStatus,
  DisbursementScheduleStatus,
  RestrictionActionType,
} from "@sims/sims-db";
import {
  ApplicationEventCode,
  DisbursementScheduleForApplicationEventCode,
} from "../../../models/ier12-integration.model";
import { ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService } from "../..";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "@sims/services/constants";
import { DATE_ONLY_ISO_FORMAT, addDays, formatDate } from "@sims/utilities";
import { FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS } from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";

describe("applicationEventCodeDuringEnrolmentAndCompletedUtilsService-applicationEventCodeDuringCompleted", () => {
  let applicationEventCodeDuringEnrolmentAndCompletedUtilsService: ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService;
  let payload: DisbursementScheduleForApplicationEventCode;

  beforeAll(() => {
    applicationEventCodeDuringEnrolmentAndCompletedUtilsService =
      new ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService();
    payload = {
      coeStatus: COEStatus.completed,
      disbursementDate: formatDate(new Date(), DATE_ONLY_ISO_FORMAT),
      disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
    };
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it(`Should return ${ApplicationEventCode.DISC} when the disbursement schedule status is ${DisbursementScheduleStatus.Cancelled}.`, () => {
    // Arrange
    const currentDisbursementSchedule = {
      ...payload,
      disbursementScheduleStatus: DisbursementScheduleStatus.Cancelled,
    };

    // Act.
    const applicationEventCode =
      applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
        currentDisbursementSchedule,
      );

    // Assert.
    expect(applicationEventCode).toBe(ApplicationEventCode.DISC);
  });

  it(
    `Should return ${ApplicationEventCode.COEA} when the disbursement schedule status is ${DisbursementScheduleStatus.Pending}, ` +
      `COE status is ${COEStatus.completed} and today is before the cutoff date(i.e. disbursement date + ${DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS}).`,
    () => {
      // Arrange
      const currentDisbursementSchedule = {
        ...payload,
        disbursementDate: formatDate(
          addDays(
            DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS + 1,
            new Date(),
          ),
          DATE_ONLY_ISO_FORMAT,
        ),
      };

      // Act
      const applicationEventCode =
        applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          currentDisbursementSchedule,
        );

      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.COEA);
    },
  );

  it(
    `Should return ${ApplicationEventCode.DISR} when the disbursement schedule status is ${DisbursementScheduleStatus.Pending}, ` +
      `COE status is ${COEStatus.completed}, disbursement date is same or after the cutoff date(i.e. disbursement date + ${DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS}) ` +
      `and has at least one ${RestrictionActionType.StopFullTimeDisbursement}.`,
    () => {
      // Arrange
      const activeRestrictionsActionTypes = [
        [RestrictionActionType.StopFullTimeDisbursement],
      ];

      // Act
      const applicationEventCode =
        applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          payload,
          activeRestrictionsActionTypes,
        );

      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.DISR);
    },
  );

  it(
    `Should return ${ApplicationEventCode.COEA} when the disbursement schedule status is ${DisbursementScheduleStatus.Pending}, ` +
      `COE status is ${COEStatus.completed}, disbursement date is same or after the cutoff date(i.e. disbursement date + ${DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS}) ` +
      `and does not have any ${RestrictionActionType.StopFullTimeDisbursement}.`,
    () => {
      // Arrange
      const activeRestrictionsActionTypes = [
        [RestrictionActionType.StopFullTimeApply],
      ];

      // Act
      const applicationEventCode =
        applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          payload,
          activeRestrictionsActionTypes,
        );

      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.COEA);
    },
  );

  it(
    `Should return ${ApplicationEventCode.COER} when the disbursement schedule status is ${DisbursementScheduleStatus.Pending}, ` +
      `COE status is ${COEStatus.required}.`,
    () => {
      // Arrange
      const currentDisbursementSchedule = {
        ...payload,
        coeStatus: COEStatus.required,
      };

      // Act
      const applicationEventCode =
        applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          currentDisbursementSchedule,
        );

      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.COER);
    },
  );

  it(
    `Should return ${ApplicationEventCode.COED} when the disbursement schedule status is ${DisbursementScheduleStatus.Pending}, ` +
      `COE status is ${COEStatus.declined}.`,
    () => {
      // Arrange
      const currentDisbursementSchedule = {
        ...payload,
        coeStatus: COEStatus.declined,
      };

      // Act
      const applicationEventCode =
        applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          currentDisbursementSchedule,
        );

      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.COED);
    },
  );

  it(
    `Should return ${ApplicationEventCode.DISE} when the disbursement schedule status is ${DisbursementScheduleStatus.Sent}, ` +
      `and has any full time disbursement feedback errors.`,
    () => {
      // Arrange
      const [feedbackErrorCode] = FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS;
      const currentDisbursementSchedule = {
        ...payload,
        disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        disbursementFeedbackErrors: [
          {
            eCertFeedbackError: { errorCode: feedbackErrorCode },
          },
        ],
      } as DisbursementScheduleForApplicationEventCode;

      // Act
      const applicationEventCode =
        applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          currentDisbursementSchedule,
        );

      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.DISE);
    },
  );

  it(
    `Should return ${ApplicationEventCode.DISW} when the disbursement schedule status is ${DisbursementScheduleStatus.Sent}, ` +
      `does not have any full time disbursement feedback errors and an award was withheld due to some restriction.`,
    () => {
      // Arrange.
      const currentDisbursementSchedule = {
        ...payload,
        disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        disbursementFeedbackErrors: [
          {
            eCertFeedbackError: { errorCode: "XXXXX" },
          },
        ],
        disbursementValues: [{ restrictionAmountSubtracted: 100 }],
      } as DisbursementScheduleForApplicationEventCode;

      // Act
      const applicationEventCode =
        applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          currentDisbursementSchedule,
        );

      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.DISW);
    },
  );

  it(
    `Should return ${ApplicationEventCode.DISS} when the disbursement schedule status is ${DisbursementScheduleStatus.Sent}, ` +
      `does not have any full time disbursement feedback errors and none of the award was withheld due to any restriction.`,
    () => {
      // Arrange.
      const currentDisbursementSchedule = {
        ...payload,
        disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        disbursementFeedbackErrors: [
          {
            eCertFeedbackError: { errorCode: "XXXXX" },
          },
        ],
        disbursementValues: [{ restrictionAmountSubtracted: 0 }],
      } as DisbursementScheduleForApplicationEventCode;

      // Act
      const applicationEventCode =
        applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          currentDisbursementSchedule,
        );

      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.DISS);
    },
  );
});
