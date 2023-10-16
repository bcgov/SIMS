import {
  COEStatus,
  DisbursementScheduleStatus,
  RestrictionActionType,
} from "@sims/sims-db";
import {
  ApplicationEventCode,
  DisbursementScheduleForApplicationEventCodeDuringCompleted,
} from "../../../models/ier12-integration.model";
import { DisbursementValueService } from "@sims/integrations/services";
import { ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService } from "../..";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "@sims/services/constants";
import { DATE_ONLY_ISO_FORMAT, formatDate } from "@sims/utilities";
import { FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS } from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";
import { createMock } from "@golevelup/ts-jest";

// todo: ann check all it description.
describe("applicationEventCodeDuringEnrolmentAndCompletedUtilsService-applicationEventCodeDuringCompleted", () => {
  let applicationEventCodeDuringEnrolmentAndCompletedUtilsService: ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService;
  let disbursementValueService: DisbursementValueService;
  let payload: DisbursementScheduleForApplicationEventCodeDuringCompleted;
  beforeAll(() => {
    disbursementValueService = createMock<DisbursementValueService>();
    applicationEventCodeDuringEnrolmentAndCompletedUtilsService =
      new ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService(
        disbursementValueService,
      );
    payload = {
      id: 9999,
      coeStatus: COEStatus.completed,
      disbursementDate: formatDate(new Date(), DATE_ONLY_ISO_FORMAT),
      disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
    };
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it(`Should return ${ApplicationEventCode.DISC} when the disbursement schedule status is ${DisbursementScheduleStatus.Cancelled}.`, async () => {
    // Arrange and act.
    const applicationEventCode =
      await applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
        {
          ...payload,
          disbursementScheduleStatus: DisbursementScheduleStatus.Cancelled,
        },
      );
    // Assert.
    expect(applicationEventCode).toBe(ApplicationEventCode.DISC);
  });

  it(
    `Should return ${ApplicationEventCode.COEA} when the disbursement schedule status is ${DisbursementScheduleStatus.Pending}, ` +
      `coe status is ${COEStatus.completed} and disbursement date is before the cutoff date(i.e disbursement date + ${DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS}).`,
    async () => {
      // Arrange and act.
      const applicationEventCode =
        await applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          payload,
        );
      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.COEA);
    },
  );

  it(
    `Should return ${ApplicationEventCode.DISR} when the disbursement schedule status is ${DisbursementScheduleStatus.Pending}, ` +
      `coe status is ${COEStatus.completed}, disbursement date is same or after the cutoff date(i.e disbursement date + ${DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS}) ` +
      `and has atleast one ${RestrictionActionType.StopFullTimeDisbursement}.`,
    async () => {
      // Arrange and act.
      const applicationEventCode =
        await applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          payload,
          [[RestrictionActionType.StopFullTimeDisbursement]],
        );
      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.DISR);
    },
  );

  it(
    `Should return ${ApplicationEventCode.COEA} when the disbursement schedule status is ${DisbursementScheduleStatus.Pending}, ` +
      `coe status is ${COEStatus.completed}, disbursement date is same or after the cutoff date(i.e disbursement date + ${DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS}) ` +
      `and des not have any ${RestrictionActionType.StopFullTimeDisbursement}.`,
    async () => {
      // Arrange and act.
      const applicationEventCode =
        await applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          payload,
          [[RestrictionActionType.StopFullTimeApply]],
        );
      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.COEA);
    },
  );

  it(
    `Should return ${ApplicationEventCode.COER} when the disbursement schedule status is ${DisbursementScheduleStatus.Pending}, ` +
      `coe status is ${COEStatus.required}.`,
    async () => {
      // Arrange and act.
      const applicationEventCode =
        await applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          {
            ...payload,
            coeStatus: COEStatus.required,
          },
        );
      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.COER);
    },
  );

  it(
    `Should return ${ApplicationEventCode.COED} when the disbursement schedule status is ${DisbursementScheduleStatus.Pending}, ` +
      `coe status is ${COEStatus.declined}.`,
    async () => {
      // Arrange and act.
      const applicationEventCode =
        await applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          {
            ...payload,
            coeStatus: COEStatus.declined,
          },
        );
      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.COED);
    },
  );

  it(
    `Should return ${ApplicationEventCode.DISE} when the disbursement schedule status is ${DisbursementScheduleStatus.Sent}, ` +
      `and has any full time disbursement feedback errors.`,
    async () => {
      // Arrange and act.
      const applicationEventCode =
        await applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          {
            id: payload.id,
            coeStatus: COEStatus.declined,
            disbursementDate: "XXXX-XX-XX",
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            disbursementFeedbackErrors: [
              {
                errorCode: FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS[0],
              },
            ],
          } as DisbursementScheduleForApplicationEventCodeDuringCompleted,
        );
      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.DISE);
    },
  );

  it(
    `Should return ${ApplicationEventCode.DISW} when the disbursement schedule status is ${DisbursementScheduleStatus.Sent}, ` +
      `, does not have any full time disbursement feedback errors and an award was withheld due to a restriction.`,
    async () => {
      // Arrange.
      // Mocked hasAwardWithheldDueToRestriction to return true, i.e some award was withheld due to a restriction.
      disbursementValueService.hasAwardWithheldDueToRestriction = jest
        .fn()
        .mockResolvedValue(true);
      // Arrange and act.
      const applicationEventCode =
        await applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          {
            id: payload.id,
            coeStatus: COEStatus.declined,
            disbursementDate: "XXXX-XX-XX",
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            disbursementFeedbackErrors: [
              {
                errorCode: "XXXXX",
              },
            ],
          } as DisbursementScheduleForApplicationEventCodeDuringCompleted,
        );
      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.DISW);
    },
  );

  it(
    `Should return ${ApplicationEventCode.DISS} when the disbursement schedule status is ${DisbursementScheduleStatus.Sent}, ` +
      `, does not have any full time disbursement feedback errors and none of the award was withheld due to any restriction.`,
    async () => {
      // Arrange.
      // Mocked hasAwardWithheldDueToRestriction to return false, i.e none of the award was withheld due to any restriction.
      disbursementValueService.hasAwardWithheldDueToRestriction = jest
        .fn()
        .mockResolvedValue(false);
      // Arrange and act.
      const applicationEventCode =
        await applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          {
            id: payload.id,
            coeStatus: COEStatus.declined,
            disbursementDate: "XXXX-XX-XX",
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            disbursementFeedbackErrors: [
              {
                errorCode: "XXXXX",
              },
            ],
          } as DisbursementScheduleForApplicationEventCodeDuringCompleted,
        );
      // Assert.
      expect(applicationEventCode).toBe(ApplicationEventCode.DISS);
    },
  );
});
